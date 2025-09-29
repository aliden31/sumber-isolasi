"use server";

import { revalidatePath } from "next/cache";
import { 
  collection, 
  addDoc, 
  doc, 
  writeBatch, 
  getDoc,
  Timestamp,
  runTransaction
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewTransaction, Product } from "@/lib/types";

// Helper function to return a consistent response shape
const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function createTransaction(transactionData: NewTransaction) {
  try {
    const transactionsCol = collection(db, "transactions");
    
    // Add a server-side timestamp to the transaction data
    const transactionWithTimestamp = {
      ...transactionData,
      date: Timestamp.fromDate(new Date()),
    };

    const newTransactionRef = await runTransaction(db, async (t) => {
        const productsCol = collection(db, 'products');

        // 1. Create a new transaction document reference
        const newDocRef = doc(transactionsCol);

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
            t.update(productRef, { stock: newStock });
        }
        
        // 3. Set the new transaction document in the transaction
        t.set(newDocRef, transactionWithTimestamp);
        
        return newDocRef;
    });

    revalidatePath("/(app)/pos");
    revalidatePath("/(app)/transactions");
    revalidatePath("/(app)/dashboard");
    return createResponse(null, newTransactionRef.id);
  } catch (e) {
    console.error("Error adding transaction: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
