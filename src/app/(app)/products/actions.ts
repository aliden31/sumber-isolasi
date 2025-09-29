
"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewProduct } from "@/lib/types";

// Helper function to return a consistent response shape
const createResponse = (error: string | null = null) => ({ error });

export async function addProduct(productData: NewProduct) {
  try {
    const productsCol = collection(db, "products");
    await addDoc(productsCol, productData);
    revalidatePath("/(app)/products");
    revalidatePath("/(app)/pos");
    return createResponse();
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateProduct(id: string, productData: Partial<NewProduct>) {
   try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, productData);
    revalidatePath("/(app)/products");
    revalidatePath("/(app)/pos");
    return createResponse();
  } catch (e) {
    console.error("Error updating document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteProduct(id: string) {
   try {
    const productRef = doc(db, "products", id);
    await deleteDoc(productRef);
    revalidatePath("/(app)/products");
    revalidatePath("/(app)/pos");
    return createResponse();
  } catch (e) {
    console.error("Error deleting document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
