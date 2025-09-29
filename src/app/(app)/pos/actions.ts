
"use server";

import { revalidatePath } from "next/cache";
import { 
  collection, 
  doc, 
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewTransaction, Product, JournalEntry, NewJournal, Account } from "@/lib/types";
import { addJournalEntry } from "../accounting/journal/actions";
import { getAccountingSettings } from "../settings/accounting/actions";

// Helper function to return a consistent response shape
const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

// Helper function to get an account from a list by its ID
function getAccountById(accounts: Account[], id: string): Account | null {
    return accounts.find(acc => acc.id === id) || null;
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
        
        // Add a server-side timestamp to the transaction data
        const transactionWithTimestamp = {
          ...transactionData,
          date: Timestamp.fromDate(new Date()),
        };

        // 3. Set the new transaction document in the transaction
        t.set(newDocRef, transactionWithTimestamp);
        
        return { ref: newDocRef, totalCost };
    });

    // 4. Create Automatic Journal Entry
    const { totalCost } = newTransactionRef;
    const { total, paymentMethod } = transactionData;
    const description = `Penjualan POS #${newTransactionRef.ref.id}`;

    // Get accounting settings for account mapping
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
    
    // Journal for Sales Revenue
    journalEntries.push(
        { accountId: paymentAccountId!, accountName: '', debit: total, credit: 0 },
        { accountId: settings.salesRevenueAccountId!, accountName: '', debit: 0, credit: total }
    );
    
    // Journal for COGS if there is cost
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
    revalidatePath("/(app)/accounting/ledger"); // Revalidate ledger
    return createResponse(null, newTransactionRef.ref.id);
  } catch (e) {
    console.error("Error adding transaction: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
