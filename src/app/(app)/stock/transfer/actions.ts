"use server";

import { revalidatePath } from "next/cache";
import { collection, doc, runTransaction, getDoc, setDoc } from "firebase/firestore";
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
        // This action decreases stock, but doesn't increase it anywhere else yet.
        // A full implementation would require a stock-per-warehouse data model.
        // For this example, we'll just record the transfer and adjust total stock.
        
        transaction.update(productSnap.ref, { stock: newStock });
      }

      transaction.set(newDocRef, transferData);
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
