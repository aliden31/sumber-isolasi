
"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewCustomer } from "@/lib/types";

// Helper function to return a consistent response shape
const createResponse = (error: string | null = null) => ({ error });

export async function addCustomer(customerData: NewCustomer) {
  try {
    const customersCol = collection(db, "customers");
    await addDoc(customersCol, customerData);
    revalidatePath("/(app)/customers");
    return createResponse();
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateCustomer(id: string, customerData: Partial<NewCustomer>) {
   try {
    const customerRef = doc(db, "customers", id);
    await updateDoc(customerRef, customerData);
    revalidatePath("/(app)/customers");
    return createResponse();
  } catch (e) {
    console.error("Error updating document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteCustomer(id: string) {
   try {
    const customerRef = doc(db, "customers", id);
    await deleteDoc(customerRef);
    revalidatePath("/(app)/customers");
    return createResponse();
  } catch (e) {
    console.error("Error deleting document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

