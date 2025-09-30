"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, Timestamp, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewPurchaseOrder, NewGoodsReceipt, Product, JournalEntry, NewJournal } from "@/lib/types";
import { addJournalEntry } from "@/app/(app)/accounting/journal/actions";
import { getAccountingSettings } from "@/app/(app)/settings/accounting/actions";

const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function addPurchaseOrder(poData: NewPurchaseOrder) {
  try {
    const poCol = collection(db, "purchaseOrders");

    const poWithTimestamp = {
      ...poData,
      date: Timestamp.fromDate(poData.date as Date),
    };

    const docRef = await addDoc(poCol, poWithTimestamp);
    
    revalidatePath("/(app)/purchasing/order");
    return createResponse(null, docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updatePurchaseOrderStatus(poId: string, status: 'Sent' | 'Completed' | 'Cancelled') {
    try {
        const poRef = doc(db, "purchaseOrders", poId);
        await updateDoc(poRef, { status });
        revalidatePath("/(app)/purchasing/order");
        revalidatePath("/(app)/purchasing/goods-receipt");
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}


export async function addGoodsReceipt(grData: NewGoodsReceipt, poId: string) {
    try {
        const newGRRef = await runTransaction(db, async (transaction) => {
            // 1. Create new Goods Receipt document
            const grCol = collection(db, "goodsReceipts");
            const newDocRef = doc(grCol);
            transaction.set(newDocRef, { ...grData, date: Timestamp.fromDate(grData.date as Date) });

            let totalValueReceived = 0;

            // 2. Update stock for each product
            for (const item of grData.items) {
                const productRef = doc(db, "products", item.productId);
                const productSnap = await transaction.get(productRef);
                if (!productSnap.exists()) {
                    throw new Error(`Produk ${item.productName} tidak ditemukan.`);
                }
                const productData = productSnap.data() as Product;
                const newStock = productData.stock + item.receivedQuantity;
                transaction.update(productRef, { stock: newStock });
                totalValueReceived += (item.cost || 0) * item.receivedQuantity;
            }

            // 3. Update PO status to 'Completed'
            const poRef = doc(db, "purchaseOrders", poId);
            transaction.update(poRef, { status: 'Completed' });

            return { ref: newDocRef, totalValueReceived };
        });

        // 4. Create Journal Entry
        const { totalValueReceived } = newGRRef;
        const settings = await getAccountingSettings();
        const { inventoryAccountId, accountsPayableAccountId } = settings; // Assuming AP account for now

        if (!inventoryAccountId || !accountsPayableAccountId) {
            throw new Error('Akun Persediaan atau Utang Usaha belum diatur di Pengaturan Akuntansi.');
        }

        const journalDescription = `Penerimaan Barang dari PO #${poId}`;
        const journalEntries: JournalEntry[] = [
            { accountId: inventoryAccountId, accountName: '', debit: totalValueReceived, credit: 0 },
            { accountId: accountsPayableAccountId, accountName: '', debit: 0, credit: totalValueReceived }
        ];

        const newJournal: NewJournal = {
            date: grData.date,
            description: journalDescription,
            refNumber: newGRRef.ref.id,
            entries: journalEntries,
            total: totalValueReceived
        };

        await addJournalEntry(newJournal);

        // 5. Revalidate paths
        revalidatePath("/(app)/purchasing/goods-receipt");
        revalidatePath("/(app)/purchasing/order");
        revalidatePath("/(app)/products");
        revalidatePath("/(app)/accounting/ledger");
        revalidatePath("/(app)/dashboard"); // for low stock etc

        return createResponse(null, newGRRef.ref.id);
    } catch (e) {
        console.error("Error adding goods receipt: ", e);
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}
