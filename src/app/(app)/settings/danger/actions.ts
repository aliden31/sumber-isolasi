
"use server";

import { revalidatePath } from "next/cache";
import { collection, writeBatch, getDocs, query, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction, SalesReturn, GoodsReceipt, PurchaseReturn, StockOpname, Product } from "@/lib/types";

const createResponse = (error: string | null = null, data: any = null) => ({ error, data });

const ALL_COLLECTION_NAMES = [
    "transactions", "journals", "salesReturns", "parkedTransactions",
    "purchaseRequests", "purchaseOrders", "goodsReceipts", "supplierInvoices",
    "purchasePayments", "purchaseReturns", "stockTransfers", "periodClosings",
    "stockOpnames", "products", "customers", "suppliers",
    "productCategories", "warehouses", "taxes", "currencies",
    "marketplaceStores", "coa"
];

export async function deleteSingleCollection(collectionName: string) {
    try {
        const batch = writeBatch(db);
        const docsToDelete = await getDocs(query(collection(db, collectionName)));
        
        if (!docsToDelete.empty) {
             for (const docSnap of docsToDelete.docs) {
                batch.delete(docSnap.ref);
            }
        }
        
        await batch.commit();
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : `Gagal menghapus koleksi ${collectionName}.`);
    }
}


export async function backupAllData() {
    try {
        const backupData: { [key: string]: any[] } = {};

        for (const collectionName of ALL_COLLECTION_NAMES) {
            const snapshot = await getDocs(collection(db, collectionName));
            backupData[collectionName] = snapshot.docs.map(doc => {
                 const data = doc.data();
                // Convert Firestore Timestamps to ISO strings
                Object.keys(data).forEach(key => {
                    if (data[key] instanceof Timestamp) {
                        data[key] = { _seconds: data[key].seconds, _nanoseconds: data[key].nanoseconds };
                    }
                });
                return { id: doc.id, ...data };
            });
        }
        
        return createResponse(null, backupData);

    } catch(e) {
        return createResponse(e instanceof Error ? e.message : "Terjadi kesalahan saat membuat backup.");
    }
}

export async function restoreAllData(data: { [key: string]: any[] }) {
    try {
        for (const collectionName of ALL_COLLECTION_NAMES) {
             // First, delete all existing documents in the collection
            const existingDocs = await getDocs(collection(db, collectionName));
            let deleteBatch = writeBatch(db);
            existingDocs.forEach(doc => deleteBatch.delete(doc.ref));
            await deleteBatch.commit();
            
            // Then, write new documents from the backup
            if (data[collectionName] && data[collectionName].length > 0) {
                 let writeBatch = writeBatch(db);
                 data[collectionName].forEach(item => {
                    const { id, ...itemData } = item;
                     // Convert objects back to Firestore Timestamps
                    Object.keys(itemData).forEach(key => {
                        if (itemData[key] && typeof itemData[key] === 'object' && itemData[key]._seconds !== undefined) {
                            itemData[key] = new Timestamp(itemData[key]._seconds, itemData[key]._nanoseconds);
                        }
                    });
                    const docRef = doc(db, collectionName, id);
                    writeBatch.set(docRef, itemData);
                 });
                 await writeBatch.commit();
            }
        }
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : "Terjadi kesalahan saat memulihkan data.");
    }
}


// Helper to revalidate all relevant paths after deletion
function revalidateAllPaths() {
    const paths = [
        "/",
        "/(app)/dashboard",
        "/(app)/pos",
        "/(app)/pos/parked",
        "/(app)/transactions",
        "/(app)/sales/receivables",
        "/(app)/sales/manual-input",
        "/(app)/sales/returns",
        "/(app)/sales/import",
        "/(app)/products",
        "/(app)/products/categories",
        "/(app)/products/import",
        "/(app)/stock/warehouses",
        "/(app)/stock/notifications",
        "/(app)/stock/transfer",
        "/(app)/stock/opname",
        "/(app)/customers",
        "/(app)/suppliers",
        "/(app)/purchasing/request",
        "/(app)/purchasing/order",
        "/(app)/purchasing/goods-receipt",
        "/(app)/purchasing/invoice",
        "/(app)/purchasing/payables",
        "/(app)/purchasing/returns",
        "/(app)/accounting/coa",
        "/(app)/accounting/journal",
        "/(app)/accounting/ledger",
        "/(app)/accounting/closing",
        "/(app)/accounting/post-closing-trial-balance",
        "/(app)/reports",
        "/(app)/reports/financial",
        "/(app)/reports/balance-sheet",
        "/(app)/reports/cash-flow",
        "/(app)/reports/purchasing",
        "/(app)/reports/stock",
        "/(app)/settings",
        "/(app)/settings/accounting",
        "/(app)/settings/marketplace",
        "/(app)/settings/danger",
        "/(app)/taxes",
        "/(app)/currencies",
        "/(app)/users",
        "/(app)/cash/in",
        "/(app)/cash/out",
        "/(app)/cash/transfer",
    ];
    paths.forEach(path => revalidatePath(path));
}
