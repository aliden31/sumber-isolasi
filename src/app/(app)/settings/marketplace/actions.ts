
"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewMarketplaceStore } from "@/lib/types";

const createResponse = (error: string | null = null) => ({ error });

export async function addMarketplaceStore(data: NewMarketplaceStore) {
  try {
    await addDoc(collection(db, "marketplaceStores"), data);
    revalidatePath("/(app)/settings/marketplace");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateMarketplaceStore(id: string, data: Partial<NewMarketplaceStore>) {
   try {
    await updateDoc(doc(db, "marketplaceStores", id), data);
    revalidatePath("/(app)/settings/marketplace");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteMarketplaceStore(id: string) {
   try {
    await deleteDoc(doc(db, "marketplaceStores", id));
    revalidatePath("/(app)/settings/marketplace");
    return createResponse();
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
