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

      const productReads = transferData.items.map(item => {
        const productRef = doc(db, 'products', item.productId);
        return transaction.get(productRef);
      });
      const productSnaps = await Promise.all(productReads);

      for (let i = 0; i < productSnaps.length; i++) {
        const productSnap = productSnaps[i];
        const item = transferData.items[i];
        
        if (!productSnap.exists()) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }
        
        const productData = productSnap.data() as Product;
        const newStock = productData.stock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Stok untuk produk ${productData.name} tidak mencukupi.`);
        }

        // For now, we assume stock is centralized. A multi-warehouse stock model would be more complex.
        // This action only records the transfer but doesn't affect stock levels in a multi-warehouse scenario.
        // In a single-stock model, this transfer implies stock moving out of the system's "main" tracked inventory.
        // A more advanced implementation would adjust stock counts per warehouse.
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
