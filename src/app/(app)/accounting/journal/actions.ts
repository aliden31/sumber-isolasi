"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewJournal } from "@/lib/types";

const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function addJournalEntry(journalData: NewJournal) {
  try {
    const journalsCol = collection(db, "journals");

    const journalWithTimestamp = {
      ...journalData,
      date: Timestamp.fromDate(journalData.date as Date),
    };

    const docRef = await addDoc(journalsCol, journalWithTimestamp);
    
    revalidatePath("/(app)/accounting/journal");
    revalidatePath("/(app)/accounting/ledger"); // Revalidate ledger as well
    return createResponse(null, docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
