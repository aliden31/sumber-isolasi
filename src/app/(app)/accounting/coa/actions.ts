"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc, writeBatch, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewAccount } from "@/lib/types";
import { COA_SEED_DATA } from "@/lib/coa-seed";

const createResponse = (error: string | null = null) => ({ error });

export async function addAccount(accountData: NewAccount) {
  try {
    const coaCol = collection(db, "coa");
    await addDoc(coaCol, accountData);
    revalidatePath("/(app)/accounting/coa");
    return createResponse();
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateAccount(id: string, accountData: Partial<NewAccount>) {
   try {
    const accountRef = doc(db, "coa", id);
    await updateDoc(accountRef, accountData);
    revalidatePath("/(app)/accounting/coa");
    return createResponse();
  } catch (e) {
    console.error("Error updating document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteAccount(id: string) {
   try {
    const accountRef = doc(db, "coa", id);
    await deleteDoc(accountRef);
    revalidatePath("/(app)/accounting/coa");
    return createResponse();
  } catch (e) {
    console.error("Error deleting document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}


export async function seedInitialAccounts() {
  try {
    const coaCol = collection(db, "coa");
    const snapshot = await getDocs(query(coaCol));
    if (!snapshot.empty) {
      return createResponse("Bagan Akun sudah berisi data. Proses seed dibatalkan.");
    }
    
    const batch = writeBatch(db);
    
    COA_SEED_DATA.forEach(account => {
      const docRef = doc(coaCol);
      batch.set(docRef, account);
    });

    await batch.commit();

    revalidatePath("/(app)/accounting/coa");
    return createResponse();
  } catch(e) {
    console.error("Error seeding documents: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}