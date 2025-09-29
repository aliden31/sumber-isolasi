"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewAccount } from "@/lib/types";

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
