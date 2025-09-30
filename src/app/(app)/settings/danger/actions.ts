"use server";

import { revalidatePath } from "next/cache";
import { collection, writeBatch, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

const createResponse = (error: string | null = null) => ({ error });

async function deleteCollection(collectionName: string, batch: FirebaseFirestore.WriteBatch) {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(query(colRef));
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
}

// Re-export individual delete functions if they are needed elsewhere,
// but for this page, we'll use a single handler.

export async function deleteTransactionalData() {
    const COLLECTIONS = [
        "transactions", "journals", "salesReturns", "parkedTransactions",
        "purchaseRequests", "purchaseOrders", "goodsReceipts", "supplierInvoices",
        "purchasePayments", "purchaseReturns", "stockTransfers", "periodClosings",
        "stockOpnames"
    ];
    try {
        const batch = writeBatch(db);
        for (const colName of COLLECTIONS) {
            await deleteCollection(colName, batch);
        }
        await batch.commit();
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}
export async function deleteMasterData() {
    const COLLECTIONS = [
        "products", "customers", "suppliers", "productCategories", 
        "warehouses", "taxes", "currencies", "marketplaceStores"
    ];
    try {
        const batch = writeBatch(db);
        for (const colName of COLLECTIONS) {
            await deleteCollection(colName, batch);
        }
        await batch.commit();
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}

export async function deleteCoaData() {
    const COLLECTIONS = ["coa"];
    try {
        const batch = writeBatch(db);
        for (const colName of COLLECTIONS) {
            await deleteCollection(colName, batch);
        }
        await batch.commit();
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}

export async function deleteSingleCollection(collectionName: string) {
    try {
        const batch = writeBatch(db);
        await deleteCollection(collectionName, batch);
        await batch.commit();
        revalidateAllPaths();
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : `Gagal menghapus koleksi ${collectionName}.`);
    }
}


// Helper to revalidate all relevant paths after deletion
function revalidateAllPaths() {
    const paths = [
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