"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewWarehouse } from "@/lib/types";

const createResponse = (error: string | null = null) => ({ error });

export async function addWarehouse(data: NewWarehouse) {
  try {
    await addDoc(collection(db, "warehouses"), data);
    revalidatePath("/(app)/stock/warehouses");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateWarehouse(id: string, data: Partial<NewWarehouse>) {
   try {
    await updateDoc(doc(db, "warehouses", id), data);
    revalidatePath("/(app)/stock/warehouses");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteWarehouse(id: string) {
   try {
    await deleteDoc(doc(db, "warehouses", id));
    revalidatePath("/(app)/stock/warehouses");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
