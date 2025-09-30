
"use server";

import { revalidatePath } from "next/cache";
import { collection, doc, runTransaction, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewStockTransfer, Product } from "@/lib/types";
import { generateDocumentId } from "@/lib/utils";

const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function processStockTransfer(transferData: NewStockTransfer) {
  try {
    const newTransferRef = await runTransaction(db, async (transaction) => {
      const newId = generateDocumentId('ST');
      const newDocRef = doc(collection(db, 'stockTransfers'), newId);

      for (const item of transferData.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);
        
        if (!productSnap.exists()) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }
      }

      transaction.set(newDocRef, { ...transferData, date: Timestamp.fromDate(transferData.date) });
      return newDocRef;
    });

    revalidatePath("/(app)/stock/transfer");
    revalidatePath("/(app)/products");
    
    return createResponse(null, newTransferRef.id);
  } catch (e) {
    console.error("Error processing stock transfer: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
