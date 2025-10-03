
"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, Timestamp, doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewJournal, Account } from "@/lib/types";

const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function addJournalEntry(journalData: NewJournal) {
  try {
    const journalsCol = collection(db, "journals");

    // Fetch account names dynamically instead of relying on passed values
    const entriesWithFetchedNames = await Promise.all(
      journalData.entries.map(async (entry) => {
        if (entry.accountName) return entry; // Use provided name if it exists
        try {
          const accountRef = doc(db, "coa", entry.accountId);
          const accountSnap = await getDoc(accountRef);
          const accountName = accountSnap.exists() ? (accountSnap.data() as Account).name : 'Akun Tidak Ditemukan';
          return { ...entry, accountName };
        } catch (e) {
            console.error(`Failed to fetch account name for ID ${entry.accountId}`, e);
            return { ...entry, accountName: 'Gagal Mengambil Nama Akun' };
        }
      })
    );
    
    const journalWithTimestamp = {
      ...journalData,
      entries: entriesWithFetchedNames,
      date: Timestamp.fromDate(journalData.date as Date),
    };

    const docRef = await addDoc(journalsCol, journalWithTimestamp);
    
    revalidatePath("/(app)/accounting/journal");
    revalidatePath("/(app)/accounting/ledger");
    revalidatePath("/(app)/reports/financial");
    revalidatePath("/(app)/dashboard");
    revalidatePath("/(app)/cash/in");
    revalidatePath("/(app)/cash/out");
    return createResponse(null, docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteJournalEntry(id: string) {
    try {
        const journalRef = doc(db, 'journals', id);
        await deleteDoc(journalRef);

        revalidatePath("/(app)/accounting/journal");
        revalidatePath("/(app)/accounting/ledger");
        revalidatePath("/(app)/reports/financial");
        revalidatePath("/(app)/dashboard");
        revalidatePath("/(app)/cash/in");
        revalidatePath("/(app)/cash/out");
        
        return createResponse(null, id);
    } catch (e) {
        console.error("Error deleting journal: ", e);
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}
