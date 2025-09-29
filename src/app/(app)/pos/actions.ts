
"use server";

import { revalidatePath } from "next/cache";
import { 
  collection, 
  doc, 
  Timestamp,
  runTransaction,
  addDoc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewTransaction, Product, JournalEntry, NewJournal, Account, NewParkedTransaction, SalesReturn, NewSalesReturn } from "@/lib/types";
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
        const transaction = {
            id: txSnap.id,
            ...txData,
            date: txData.date.toDate(),
        };
        return { data: transaction, error: null };
    } catch (e) {
        return { data: null, error: e instanceof Error ? e.message : 'An unknown error occurred.' };
    }
}

export async function createTransaction(transactionData: NewTransaction) {
  try {
    const newTransactionRef = await runTransaction(db, async (t) => {
        const productsCol = collection(db, 'products');
        const transactionsCol = collection(db, "transactions");

        // 1. Create a new transaction document reference
        const newDocRef = doc(transactionsCol);

        let totalCost = 0;

        // 2. Validate stock and prepare batch updates
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
        
        const transactionWithTimestamp = {
          ...transactionData,
          date: Timestamp.fromDate(new Date()),
        };

        t.set(newDocRef, transactionWithTimestamp);
        
        return { ref: newDocRef, totalCost };
    });

    // 4. Create Automatic Journal Entry
    const { totalCost } = newTransactionRef;
    const { total, paymentMethod } = transactionData;
    const description = `Penjualan POS #${newTransactionRef.ref.id}`;

    const settings = await getAccountingSettings();
    const paymentAccountId = paymentMethod === 'Tunai' ? settings.cashAccountId : settings.bankAccountId;
    
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
      date: new Date(),
      description,
      refNumber: newTransactionRef.ref.id,
      entries: journalEntries,
      total: total, 
    };

    if (newJournal.entries.length > 0) {
       await addJournalEntry(newJournal);
    }

    revalidatePath("/(app)/pos");
    revalidatePath("/(app)/transactions");
    revalidatePath("/(app)/dashboard");
    revalidatePath("/(app)/accounting/ledger");
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

        for (const item of returnData.items) {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await t.get(productRef);
            if (!productSnap.exists()) {
                throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
            }
            const productData = productSnap.data() as Product;
            totalCost += (productData.cost || 0) * item.quantity;
            t.update(productRef, { stock: productData.stock + item.quantity });
        }
        
        const returnWithTimestamp = {
          ...returnData,
          date: Timestamp.fromDate(new Date()),
        };
        t.set(newReturnRef, returnWithTimestamp);
        return { ref: newReturnRef, totalCost };
    });

    // Create reversing journal entry
    const { totalCost } = returnRef;
    const { total, originalPaymentMethod } = returnData;
    const description = `Retur Penjualan dari Transaksi #${returnData.originalTransactionId}`;

    const settings = await getAccountingSettings();
    const paymentAccountId = originalPaymentMethod === 'Tunai' ? settings.cashAccountId : settings.bankAccountId;
    
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
    revalidatePath('/(app)/dashboard');
    revalidatePath('/(app)/accounting/ledger');

    return createResponse(null, returnRef.ref.id);
  } catch (e) {
    console.error("Error processing sales return: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
