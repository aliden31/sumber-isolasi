
"use server";

import { revalidatePath } from "next/cache";
import { collection, writeBatch, getDocs, query, doc, getDoc, where, Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction, SalesReturn, GoodsReceipt, PurchaseReturn, StockOpname, Product } from "@/lib/types";

const createResponse = (error: string | null = null) => ({ error });

async function deleteDocuments(q: Query) {
    const batch = writeBatch(db);
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


export async function deleteCashInJournals() {
    try {
        const q = query(collection(db, "journals"), where('description', '>=', 'Kas Masuk:'), where('description', '<', 'Kas Masuk:' + '\uf8ff'));
        await deleteDocuments(q);
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : `Gagal menghapus jurnal Kas Masuk.`);
    }
}

export async function deleteCashOutJournals() {
    try {
        const q = query(collection(db, "journals"), where('description', '>=', 'Kas Keluar:'), where('description', '<', 'Kas Keluar:' + '\uf8ff'));
        await deleteDocuments(q);
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : `Gagal menghapus jurnal Kas Keluar.`);
    }
}

export async function deleteCashTransferJournals() {
    try {
        const q = query(collection(db, "journals"), where('description', '>=', 'Transfer:'), where('description', '<', 'Transfer:' + '\uf8ff'));
        await deleteDocuments(q);
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : `Gagal menghapus jurnal Transfer Kas.`);
    }
}


export async function deleteSingleCollection(collectionName: string) {
    try {
        const batch = writeBatch(db);
        const docsToDelete = await getDocs(query(collection(db, collectionName)));
        const stockAdjustments: { [productId: string]: number } = {};

        if (!docsToDelete.empty) {
            for (const docSnap of docsToDelete.docs) {
                const data = docSnap.data();

                // Logic for stock reversion based on collection type
                switch (collectionName) {
                    case 'transactions':
                        const tx = data as Transaction;
                        tx.items.forEach(item => {
                            stockAdjustments[item.productId] = (stockAdjustments[item.productId] || 0) + item.quantity;
                        });
                        break;
                    case 'salesReturns':
                        const sr = data as SalesReturn;
                        sr.items.forEach(item => {
                            stockAdjustments[item.productId] = (stockAdjustments[item.productId] || 0) - item.quantity;
                        });
                        break;
                    case 'goodsReceipts':
                        const gr = data as GoodsReceipt;
                        gr.items.forEach(item => {
                            stockAdjustments[item.productId] = (stockAdjustments[item.productId] || 0) - item.receivedQuantity;
                        });
                        break;
                    case 'purchaseReturns':
                        const pr = data as PurchaseReturn;
                        pr.items.forEach(item => {
                            stockAdjustments[item.productId] = (stockAdjustments[item.productId] || 0) + item.returnQuantity;
                        });
                        break;
                    case 'stockOpnames':
                        const so = data as StockOpname;
                        so.items.forEach(item => {
                            stockAdjustments[item.productId] = (stockAdjustments[item.productId] || 0) - item.difference;
                        });
                        break;
                }
                batch.delete(docSnap.ref);
            }

            for (const productId in stockAdjustments) {
                const productRef = doc(db, 'products', productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    const productData = productSnap.data() as Product;
                    const currentStock = productData.stock || 0;
                    batch.update(productRef, { stock: currentStock + stockAdjustments[productId] });
                }
            }
        }
        
        await batch.commit();
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : `Gagal menghapus koleksi ${collectionName}.`);
    }
}


export async function resetAllProductStock() {
    try {
        const batch = writeBatch(db);
        const productsSnapshot = await getDocs(collection(db, 'products'));

        if (productsSnapshot.empty) {
            return createResponse("Tidak ada produk untuk direset.");
        }

        productsSnapshot.forEach(doc => {
            batch.update(doc.ref, { stock: 0 });
        });

        await batch.commit();
        revalidateAllPaths();
        return createResponse();
    } catch (e) {
        return createResponse(e instanceof Error ? e.message : "Gagal mereset stok produk.");
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
