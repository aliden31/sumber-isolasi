"use server";

import { revalidatePath } from "next/cache";
import { collection, doc, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, NewJournal, JournalEntry } from "@/lib/types";
import { getAccountingSettings } from "@/app/(app)/settings/accounting/actions";
import { addJournalEntry } from "@/app/(app)/accounting/journal/actions";

const createResponse = (error: string | null = null) => ({ error });

type OpnameItem = {
  product: Product;
  physicalCount: number;
  difference: number;
  differenceValue: number;
};

export async function processStockOpname(opnameItems: OpnameItem[], opnameDate: Date, notes: string) {
  try {
    const batch = writeBatch(db);
    let totalAdjustmentValue = 0;

    for (const item of opnameItems) {
      if (item.difference !== 0) {
        const productRef = doc(db, 'products', item.product.id);
        batch.update(productRef, { stock: item.physicalCount });
        totalAdjustmentValue += item.differenceValue;
      }
    }

    if (totalAdjustmentValue !== 0) {
        const settings = await getAccountingSettings();
        const { inventoryAccountId, cogsAccountId } = settings; // Using COGS for adjustments, ideally a dedicated account.

        if (!inventoryAccountId || !cogsAccountId) {
            throw new Error("Akun Persediaan atau HPP belum diatur di Pengaturan Akuntansi.");
        }

        const journalDescription = `Penyesuaian Stok (Stock Opname) - ${notes || opnameDate.toLocaleDateString()}`;
        const journalEntries: JournalEntry[] = [];
        
        if (totalAdjustmentValue > 0) { // Stock increased
            journalEntries.push({ accountId: inventoryAccountId, accountName: '', debit: totalAdjustmentValue, credit: 0 });
            journalEntries.push({ accountId: cogsAccountId, accountName: '', debit: 0, credit: totalAdjustmentValue }); // Credit COGS/Adjustment account
        } else { // Stock decreased
            journalEntries.push({ accountId: cogsAccountId, accountName: '', debit: -totalAdjustmentValue, credit: 0 }); // Debit COGS/Adjustment account
            journalEntries.push({ accountId: inventoryAccountId, accountName: '', debit: 0, credit: -totalAdjustmentValue });
        }
        
        const newJournal: NewJournal = {
            date: opnameDate,
            description: journalDescription,
            refNumber: `OPN-${opnameDate.getTime()}`,
            entries: journalEntries,
            total: Math.abs(totalAdjustmentValue)
        };
        await addJournalEntry(newJournal);
    }
    
    await batch.commit();

    revalidatePath("/(app)/stock/opname");
    revalidatePath("/(app)/products");
    revalidatePath("/(app)/accounting/ledger");
    
    return createResponse();

  } catch (e) {
    console.error("Error processing stock opname: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}
