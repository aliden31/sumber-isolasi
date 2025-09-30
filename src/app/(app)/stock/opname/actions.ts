
"use server";

import { revalidatePath } from "next/cache";
import { collection, doc, writeBatch, Timestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, NewJournal, JournalEntry, StockOpname, StockOpnameItem as OpnameDetailItem, NewStockOpname } from "@/lib/types";
import { getAccountingSettings } from "@/app/(app)/settings/accounting/actions";
import { addJournalEntry } from "@/app/(app)/accounting/journal/actions";
import { generateDocumentId } from "@/lib/utils";

const createResponse = (error: string | null = null) => ({ error });

type OpnameItem = {
  product: Product;
  physicalCount: number;
  difference: number;
  differenceValue: number;
};

export async function processStockOpname(opnameItems: OpnameItem[], opnameDate: Date, notes: string, warehouseId: string, warehouseName: string) {
  try {
    const batch = writeBatch(db);

    const adjustedItems: OpnameDetailItem[] = opnameItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        systemStock: item.product.stock,
        physicalCount: item.physicalCount,
        difference: item.difference,
        differenceValue: item.differenceValue,
    }));

    const totalAdjustmentValue = adjustedItems.reduce((sum, item) => sum + item.differenceValue, 0);

    // Save the opname history record
    const opnameHistoryRef = doc(collection(db, 'stockOpnames'), generateDocumentId("OPN"));
    const newOpnameRecord: NewStockOpname = {
        date: Timestamp.fromDate(opnameDate),
        warehouseId,
        warehouseName,
        notes,
        items: adjustedItems,
        totalAdjustmentValue,
    };
    batch.set(opnameHistoryRef, newOpnameRecord);


    for (const item of opnameItems) {
      if (item.difference !== 0) {
        const productRef = doc(db, 'products', item.product.id);
        batch.update(productRef, { stock: item.physicalCount });
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
        // This function handles its own batching/committing, so we don't include it in the main batch
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
