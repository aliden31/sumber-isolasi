
"use server";

import { revalidatePath } from "next/cache";
import { 
  collection, 
  doc, 
  Timestamp,
  runTransaction,
  addDoc,
  getDoc,
  query,
  where,
  getDocs,
  limit,
  writeBatch,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewTransaction, Product, JournalEntry, NewJournal, NewParkedTransaction, NewSalesReturn, Transaction, Customer } from "@/lib/types";
import { addJournalEntry } from "../accounting/journal/actions";
import { getAccountingSettings } from "../settings/accounting/actions";

// Helper function to return a consistent response shape
const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function parkTransaction(parkedData: NewParkedTransaction) {
    try {
        const parkedCol = collection(db, 'parkedTransactions');
        await addDoc(parkedCol, {
            ...parkedData,
            createdAt: Timestamp.fromDate(parkedData.createdAt as Date)
        });
        revalidatePath('/(app)/pos/parked');
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : 'An unknown error occurred.');
    }
}

export async function getTransaction(id: string) {
    try {
        const txRef = doc(db, 'transactions', id);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) {
            return { data: null, error: "Transaksi tidak ditemukan." };
        }
        const txData = txSnap.data();
        const transaction: Transaction = {
            id: txSnap.id,
            ...txData,
            date: txData.date.toDate(),
        } as Transaction;
        return { data: transaction, error: null };
    } catch (e) {
        return { data: null, error: e instanceof Error ? e.message : 'An unknown error occurred.' };
    }
}

export async function createTransaction(transactionData: NewTransaction, isPOS: boolean = true) {
  try {
    const newTransactionRef = await runTransaction(db, async (t) => {
        const productsCol = collection(db, 'products');
        const transactionsCol = collection(db, "transactions");

        const newDocRef = doc(transactionsCol);

        let totalCost = 0;

        for (const item of transactionData.items) {
            const productRef = doc(productsCol, item.productId);
            const productSnap = await t.get(productRef);
            if (!productSnap.exists()) {
                throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
            }
            const productData = productSnap.data() as Product;
            const newStock = productData.stock - item.quantity;
            if (newStock < 0) {
                throw new Error(`Stok untuk produk ${productData.name} tidak mencukupi.`);
            }
            totalCost += (productData.cost || 0) * item.quantity;
            t.update(productRef, { stock: newStock });
        }
        
        const status = transactionData.paymentMethod === 'Kredit' ? 'Belum Lunas' : 'Lunas';
        
        const transactionWithTimestamp: Omit<Transaction, 'id'> = {
          ...transactionData,
          date: Timestamp.fromDate(transactionData.date as Date),
          status,
        };

        t.set(newDocRef, transactionWithTimestamp);
        
        return { ref: newDocRef, totalCost };
    });

    const { totalCost } = newTransactionRef;
    const { total, paymentMethod, customerId, customerName } = transactionData;
    const description = `Penjualan ${isPOS ? 'POS' : 'Manual'} #${newTransactionRef.ref.id}${customerName ? ` kepada ${customerName}`: ''}`;

    const settings = await getAccountingSettings();
    
    let paymentAccountId: string | undefined;
    if (paymentMethod === 'Tunai') {
        paymentAccountId = settings.cashAccountId;
    } else if (paymentMethod === 'Transfer') {
        paymentAccountId = settings.bankAccountId;
    } else if (paymentMethod === 'Kredit') {
        paymentAccountId = settings.accountsReceivableAccountId;
    }

    const requiredAccountIds = [
      paymentAccountId,
      settings.salesRevenueAccountId,
      settings.cogsAccountId,
      settings.inventoryAccountId
    ];

    if (requiredAccountIds.some(id => !id)) {
       throw new Error(`Gagal membuat jurnal otomatis: Pengaturan pemetaan akun belum lengkap. Mohon lengkapi di menu Pengaturan > Akuntansi.`);
    }

    const journalEntries: JournalEntry[] = [];
    
    journalEntries.push(
        { accountId: paymentAccountId!, accountName: '', debit: total, credit: 0 },
        { accountId: settings.salesRevenueAccountId!, accountName: '', debit: 0, credit: total }
    );
    
    if (totalCost > 0) {
        journalEntries.push(
            { accountId: settings.cogsAccountId!, accountName: '', debit: totalCost, credit: 0 },
            { accountId: settings.inventoryAccountId!, accountName: '', debit: 0, credit: totalCost }
        );
    }
    
    const newJournal: NewJournal = {
      date: transactionData.date,
      description,
      refNumber: newTransactionRef.ref.id,
      entries: journalEntries,
      total: total, 
    };

    await addJournalEntry(newJournal);

    revalidatePath("/(app)/pos");
    revalidatePath("/(app)/transactions");
    revalidatePath("/(app)/dashboard");
    revalidatePath("/(app)/accounting/ledger");
    revalidatePath("/(app)/sales/receivables");
    revalidatePath("/(app)/sales/manual-input");
    return createResponse(null, newTransactionRef.ref.id);
  } catch (e) {
    console.error("Error adding transaction: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function processSalesReturn(returnData: NewSalesReturn) {
  try {
    const returnRef = await runTransaction(db, async (t) => {
        const returnsCol = collection(db, 'salesReturns');
        const newReturnRef = doc(returnsCol);

        let totalCost = 0;
        const productUpdates: { ref: any, newStock: number }[] = [];
        const productReads: Promise<any>[] = [];
        
        // --- 1. Perform all reads first ---

        // Read original transaction
        const originalTxRef = doc(db, 'transactions', returnData.originalTransactionId);
        const originalTxSnap = await t.get(originalTxRef);

        // Read all products involved in the return
        for (const item of returnData.items) {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await t.get(productRef);
            if (!productSnap.exists()) {
                throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
            }
            const productData = productSnap.data() as Product;
            totalCost += (productData.cost || 0) * item.quantity;
            productUpdates.push({ ref: productRef, newStock: productData.stock + item.quantity });
        }

        // --- 2. Perform all writes now ---
        
        // Update product stocks
        for (const update of productUpdates) {
            t.update(update.ref, { stock: update.newStock });
        }
        
        // If the original transaction was credit and not yet paid, update its total
        if (originalTxSnap.exists()) {
            const originalTxData = originalTxSnap.data() as Transaction;
            if (originalTxData.status === 'Belum Lunas') {
                t.update(originalTxRef, { total: originalTxData.total - returnData.total });
            }
        }
        
        // Create the new sales return document
        const returnWithTimestamp = {
          ...returnData,
          date: Timestamp.fromDate(new Date()),
        };
        t.set(newReturnRef, returnWithTimestamp);
        
        return { ref: newReturnRef, totalCost };
    });

    // Create reversing journal entry
    const { totalCost } = returnRef;
    const { total, originalPaymentMethod, originalTransactionId } = returnData;
    const description = `Retur Penjualan dari Transaksi #${originalTransactionId}`;

    const settings = await getAccountingSettings();
    let paymentAccountId;
    if (originalPaymentMethod === 'Tunai') {
        paymentAccountId = settings.cashAccountId;
    } else if (originalPaymentMethod === 'Transfer') {
        paymentAccountId = settings.bankAccountId;
    } else {
        paymentAccountId = settings.accountsReceivableAccountId;
    }
    
    const requiredAccountIds = [
      paymentAccountId,
      settings.salesRevenueAccountId,
      settings.cogsAccountId,
      settings.inventoryAccountId
    ];

    if (requiredAccountIds.some(id => !id)) {
       throw new Error(`Gagal membuat jurnal otomatis: Pengaturan pemetaan akun belum lengkap.`);
    }

    const journalEntries: JournalEntry[] = [];

    // Reverse revenue
    journalEntries.push(
        { accountId: settings.salesRevenueAccountId!, accountName: '', debit: total, credit: 0 },
        { accountId: paymentAccountId!, accountName: '', debit: 0, credit: total }
    );
    
    // Reverse COGS
    if (totalCost > 0) {
        journalEntries.push(
            { accountId: settings.inventoryAccountId!, accountName: '', debit: totalCost, credit: 0 },
            { accountId: settings.cogsAccountId!, accountName: '', debit: 0, credit: totalCost }
        );
    }
    
    const newJournal: NewJournal = {
      date: new Date(),
      description,
      refNumber: returnRef.ref.id,
      entries: journalEntries,
      total: total,
    };

    await addJournalEntry(newJournal);

    revalidatePath('/(app)/pos/returns');
    revalidatePath('/(app)/sales/returns');
    revalidatePath('/(app)/dashboard');
    revalidatePath('/(app)/accounting/ledger');
    revalidatePath('/(app)/sales/receivables');

    return createResponse(null, returnRef.ref.id);
  } catch (e) {
    console.error("Error processing sales return: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}


export async function settleReceivable(transaction: Transaction, paymentAccountId: string) {
    try {
        const settings = await getAccountingSettings();
        if (!settings.accountsReceivableAccountId) {
            throw new Error("Akun Piutang Usaha belum diatur di Pengaturan Akuntansi.");
        }

        const batch = writeBatch(db);

        // Update transaction status
        const txRef = doc(db, 'transactions', transaction.id);
        batch.update(txRef, { status: 'Lunas' });

        // Create journal entry for settlement
        const description = `Pelunasan piutang untuk transaksi #${transaction.id}`;
        const journalEntries: JournalEntry[] = [
            { accountId: paymentAccountId, accountName: '', debit: transaction.total, credit: 0 },
            { accountId: settings.accountsReceivableAccountId, accountName: '', debit: 0, credit: transaction.total },
        ];
        
        const newJournal: NewJournal = {
            date: new Date(),
            description,
            refNumber: `PELUNASAN-${transaction.id}`,
            entries: journalEntries,
            total: transaction.total,
        };

        const journalsCol = collection(db, "journals");
        const newJournalRef = doc(journalsCol);
        
        batch.set(newJournalRef, { ...newJournal, date: Timestamp.fromDate(newJournal.date as Date) });

        await batch.commit();

        revalidatePath('/(app)/sales/receivables');
        revalidatePath('/(app)/accounting/ledger');

        return createResponse();
    } catch (e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}
