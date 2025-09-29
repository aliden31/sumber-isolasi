
"use server";

import { revalidatePath } from "next/cache";
import { 
  collection, 
  doc, 
  Timestamp,
  runTransaction,
  where,
  query,
  getDocs,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewTransaction, Product, Account, JournalEntry, NewJournal } from "@/lib/types";
import { addJournalEntry } from "../accounting/journal/actions";

// Helper function to return a consistent response shape
const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

// Helper function to find an account by its name. This is a temporary solution.
// A better approach would be to have a dedicated settings page for account mapping.
async function getAccountByName(name: string): Promise<Account | null> {
  const q = query(collection(db, "coa"), where("name", "==", name), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.error(`Account with name "${name}" not found.`);
    return null;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Account;
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

    // Get account IDs (replace with a more robust mapping system in the future)
    const kasAccount = await getAccountByName(paymentMethod === 'Tunai' ? 'Kas' : 'Bank');
    const pendapatanAccount = await getAccountByName('Pendapatan Penjualan');
    const hppAccount = await getAccountByName('Beban Pokok Penjualan');
    const persediaanAccount = await getAccountByName('Persediaan Barang Dagang');

    if (!kasAccount || !pendapatanAccount || !hppAccount || !persediaanAccount) {
      const missingAccounts = [
        !kasAccount && (paymentMethod === 'Tunai' ? 'Kas' : 'Bank'),
        !pendapatanAccount && 'Pendapatan Penjualan',
        !hppAccount && 'Beban Pokok Penjualan',
        !persediaanAccount && 'Persediaan Barang Dagang'
      ].filter(Boolean).join(', ');
      throw new Error(`Gagal membuat jurnal otomatis: Akun (${missingAccounts}) tidak ditemukan. Mohon buat akun tersebut di Bagan Akun.`);
    }

    const journalEntries: JournalEntry[] = [
      // Debit Kas/Bank, Credit Pendapatan
      { accountId: kasAccount.id, accountName: kasAccount.name, debit: total, credit: 0 },
      { accountId: pendapatanAccount.id, accountName: pendapatanAccount.name, debit: 0, credit: total },
      // Debit HPP, Credit Persediaan
      { accountId: hppAccount.id, accountName: hppAccount.name, debit: totalCost, credit: 0 },
      { accountId: persediaanAccount.id, accountName: persediaanAccount.name, debit: 0, credit: totalCost },
    ];
    
    const newJournal: NewJournal = {
      date: new Date(),
      description,
      refNumber: newTransactionRef.ref.id,
      entries: journalEntries.filter(entry => entry.debit > 0 || entry.credit > 0), // Filter out zero entries if cost is 0
      total: total, // For accounting purpose, the total of journal is the main transaction amount, not including COGS
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
