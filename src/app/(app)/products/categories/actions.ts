"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewProductCategory } from "@/lib/types";

const createResponse = (error: string | null = null) => ({ error });

export async function addCategory(categoryData: NewProductCategory) {
  try {
    const catCol = collection(db, "productCategories");
    await addDoc(catCol, categoryData);
    revalidatePath("/(app)/products/categories");
    revalidatePath("/(app)/products");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateCategory(id: string, categoryData: Partial<NewProductCategory>) {
   try {
    const catRef = doc(db, "productCategories", id);
    await updateDoc(catRef, categoryData);
    revalidatePath("/(app)/products/categories");
    revalidatePath("/(app)/products");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteCategory(id: string) {
   try {
    const catRef = doc(db, "productCategories", id);
    await deleteDoc(catRef);
    revalidatePath("/(app)/products/categories");
    revalidatePath("/(app)/products");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
