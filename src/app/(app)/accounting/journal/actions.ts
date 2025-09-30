"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewJournal } from "@/lib/types";

const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function addJournalEntry(journalData: NewJournal) {
  try {
    const journalsCol = collection(db, "journals");

    // Ensure all entries have accountName, even if empty
    const entriesWithNames = journalData.entries.map(entry => ({
        ...entry,
        accountName: entry.accountName || 'Nama Akun Belum Ada',
    }));

    const journalWithTimestamp = {
      ...journalData,
      entries: entriesWithNames,
      date: Timestamp.fromDate(journalData.date as Date),
    };

    const docRef = await addDoc(journalsCol, journalWithTimestamp);
    
    revalidatePath("/(app)/accounting/journal");
    revalidatePath("/(app)/accounting/ledger");
    revalidatePath("/(app)/reports/financial");
    revalidatePath("/(app)/dashboard");
    return createResponse(null, docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
