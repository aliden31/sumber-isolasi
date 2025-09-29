"use server";

import { revalidatePath } from "next/cache";
import { collection, writeBatch, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { COA_SEED_DATA } from "@/lib/coa-seed";
import { CUSTOMERS_SEED_DATA } from "@/lib/customers-seed";
import { PRODUCTS_SEED_DATA } from "@/lib/products-seed";
import { SUPPLIERS_SEED_DATA } from "@/lib/suppliers-seed";

const createResponse = (error: string | null = null) => ({ error });

async function seedCollection(collectionName: string, data: any[], revalidationPath: string) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(query(colRef));
    
    if (!snapshot.empty) {
      return createResponse(`${collectionName} sudah berisi data. Proses seed dibatalkan.`);
    }
    
    const batch = writeBatch(db);
    data.forEach(item => {
      const docRef = collection(db, collectionName).doc();
      batch.set(docRef, item);
    });

    await batch.commit();
    revalidatePath(revalidationPath);
    return createResponse();
  } catch(e) {
    console.error(`Error seeding ${collectionName}: `, e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function seedInitialAccounts() {
  return seedCollection("coa", COA_SEED_DATA, "/(app)/accounting/coa");
}

export async function seedInitialCustomers() {
  return seedCollection("customers", CUSTOMERS_SEED_DATA, "/(app)/customers");
}

export async function seedInitialProducts() {
  return seedCollection("products", PRODUCTS_SEED_DATA, "/(app)/products");
}

export async function seedInitialSuppliers() {
  return seedCollection("suppliers", SUPPLIERS_SEED_DATA, "/(app)/suppliers");
}
