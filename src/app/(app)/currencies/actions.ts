"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewCurrency } from "@/lib/types";

const createResponse = (error: string | null = null) => ({ error });

export async function addCurrency(data: NewCurrency) {
  try {
    await addDoc(collection(db, "currencies"), data);
    revalidatePath("/(app)/currencies");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateCurrency(id: string, data: Partial<NewCurrency>) {
   try {
    await updateDoc(doc(db, "currencies", id), data);
    revalidatePath("/(app)/currencies");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteCurrency(id: string) {
   try {
    await deleteDoc(doc(db, "currencies", id));
    revalidatePath("/(app)/currencies");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
