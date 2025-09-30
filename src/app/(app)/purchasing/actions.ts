"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewPurchaseOrder } from "@/lib/types";

const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function addPurchaseOrder(poData: NewPurchaseOrder) {
  try {
    const poCol = collection(db, "purchaseOrders");

    const poWithTimestamp = {
      ...poData,
      date: Timestamp.fromDate(poData.date as Date),
    };

    const docRef = await addDoc(poCol, poWithTimestamp);
    
    revalidatePath("/(app)/purchasing/order");
    return createResponse(null, docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
