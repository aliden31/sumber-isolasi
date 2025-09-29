
"use server";

import { revalidatePath } from "next/cache";
import { collection, writeBatch, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

const createResponse = (error: string | null = null) => ({ error });

const COLLECTIONS = {
    TRANSACTIONAL: ["transactions", "journals", "salesReturns", "parkedTransactions"],
    MASTER: ["products", "customers", "suppliers"],
    ACCOUNTING: ["coa"],
}

async function deleteCollection(collectionName: string, batch: FirebaseFirestore.WriteBatch) {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(query(colRef));
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
}

export async function deleteTransactionalData() {
  try {
    const batch = writeBatch(db);
    for (const colName of COLLECTIONS.TRANSACTIONAL) {
        await deleteCollection(colName, batch);
    }
    await batch.commit();
    revalidateAllPaths();
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteMasterData() {
  try {
    const batch = writeBatch(db);
    for (const colName of COLLECTIONS.MASTER) {
        await deleteCollection(colName, batch);
    }
    await batch.commit();
    revalidateAllPaths();
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteCoaData() {
  try {
    const batch = writeBatch(db);
    await deleteCollection("coa", batch);
    await batch.commit();
    revalidateAllPaths();
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteAllData() {
   try {
    const batch = writeBatch(db);
    const allCollections = [...COLLECTIONS.TRANSACTIONAL, ...COLLECTIONS.MASTER, ...COLLECTIONS.ACCOUNTING];
    for (const colName of allCollections) {
        await deleteCollection(colName, batch);
    }
    await batch.commit();
    revalidateAllPaths();
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
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
        "/(app)/products",
        "/(app)/customers",
        "/(app)/suppliers",
        "/(app)/accounting/coa",
        "/(app)/accounting/journal",
        "/(app)/accounting/ledger",
        "/(app)/reports/financial",
    ];
    paths.forEach(path => revalidatePath(path));
}
