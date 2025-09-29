"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewSupplier } from "@/lib/types";

// Helper function to return a consistent response shape
const createResponse = (error: string | null = null) => ({ error });

export async function addSupplier(supplierData: NewSupplier) {
  try {
    const suppliersCol = collection(db, "suppliers");
    await addDoc(suppliersCol, supplierData);
    revalidatePath("/(app)/suppliers");
    return createResponse();
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateSupplier(id: string, supplierData: Partial<NewSupplier>) {
   try {
    const supplierRef = doc(db, "suppliers", id);
    await updateDoc(supplierRef, supplierData);
    revalidatePath("/(app)/suppliers");
    return createResponse();
  } catch (e) {
    console.error("Error updating document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteSupplier(id: string) {
   try {
    const supplierRef = doc(db, "suppliers", id);
    await deleteDoc(supplierRef);
    revalidatePath("/(app)/suppliers");
    return createResponse();
  } catch (e) {
    console.error("Error deleting document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
