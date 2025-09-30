'use server';

import {
  collection,
  doc,
  runTransaction,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  NewTransaction,
  Product,
  JournalEntry,
  NewJournal,
  MappedRow,
} from '@/lib/types';
import { addJournalEntry } from '@/app/(app)/accounting/journal/actions';
import { getAccountingSettings } from '@/app/(app)/settings/accounting/actions';
import { generateDocumentId } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

const createResponse = (
  error: string | null = null,
  id: string | null = null
) => ({ error, id });

export async function importMarketplaceTransactions(
  transactions: MappedRow[]
) {
  if (!transactions || transactions.length === 0) {
    return createResponse('Tidak ada transaksi untuk diimpor.');
  }

  const settings = await getAccountingSettings();
  const {
    salesRevenueAccountId,
    cogsAccountId,
    inventoryAccountId,
    bankAccountId, // Defaulting to bank for marketplace payouts
  } = settings;

  const requiredAccountIds = [
    salesRevenueAccountId,
    cogsAccountId,
    inventoryAccountId,
    bankAccountId,
  ];

  if (requiredAccountIds.some((id) => !id)) {
    return createResponse(
      `Gagal membuat jurnal otomatis: Pengaturan pemetaan akun belum lengkap. Mohon lengkapi di menu Pengaturan > Akuntansi.`
    );
  }

  const newTransactionsData: (NewTransaction & { totalCost: number })[] = [];
  const groupedByOrder = transactions.reduce((acc, row) => {
    if (!row.mappedProduct) return acc;
    const orderId = row.nomor_order;
    if (!acc[orderId]) {
      acc[orderId] = {
        items: [],
        total: 0,
        totalCost: 0,
        customerName: row.nama_pembeli,
        date: new Date(row.tanggal_order),
      };
    }
    const cost = row.mappedProduct.cost || 0;
    const itemTotal = row.unit_price * row.qty;

    acc[orderId].items.push({
      productId: row.mappedProduct.id,
      productName: row.mappedProduct.name,
      quantity: row.qty,
      price: row.unit_price,
      cost: cost,
      unit: row.mappedProduct.baseUnit,
    });
    acc[orderId].total += itemTotal;
    acc[orderId].totalCost += cost * row.qty;

    return acc;
  }, {} as Record<string, any>);

  try {
    const batch = writeBatch(db);

    for (const orderId in groupedByOrder) {
      const order = groupedByOrder[orderId];
      const newId = generateDocumentId('MKT');
      const newTxRef = doc(db, 'transactions', newId);

      // 1. Create Transaction Document
      const newTransaction: NewTransaction = {
        date: Timestamp.fromDate(order.date),
        items: order.items,
        total: order.total,
        paymentMethod: 'Transfer', // Marketplace sales are treated as transfers
        status: 'Lunas',
        customerId: `MKT-${order.customerName}`,
        customerName: order.customerName,
      };
      batch.set(newTxRef, newTransaction);

      // 2. Update Stock
      for (const item of order.items) {
        const productRef = doc(db, 'products', item.productId);
        // Firestore Transaction would be safer here, but for batching this is simpler.
        // Consider moving to a transaction per order if high concurrency is an issue.
        batch.update(productRef, { stock: -item.quantity });
      }

      // 3. Create Journal Entries
      const journalDescription = `Penjualan Marketplace #${orderId}`;
      const journalEntries: JournalEntry[] = [
        {
          accountId: bankAccountId!,
          accountName: '',
          debit: order.total,
          credit: 0,
        },
        {
          accountId: salesRevenueAccountId!,
          accountName: '',
          debit: 0,
          credit: order.total,
        },
      ];

      if (order.totalCost > 0) {
        journalEntries.push({
          accountId: cogsAccountId!,
          accountName: '',
          debit: order.totalCost,
          credit: 0,
        });
        journalEntries.push({
          accountId: inventoryAccountId!,
          accountName: '',
          debit: 0,
          credit: order.totalCost,
        });
      }

      const newJournal: NewJournal = {
        date: order.date,
        description: journalDescription,
        refNumber: newId,
        entries: journalEntries,
        total: order.total,
      };
      const newJournalRef = doc(db, 'journals', generateDocumentId('JNL'));
      batch.set(newJournalRef, {
        ...newJournal,
        date: Timestamp.fromDate(newJournal.date as Date),
      });
    }

    await batch.commit();

    revalidatePath('/(app)/transactions');
    revalidatePath('/(app)/products');
    revalidatePath('/(app)/dashboard');
    revalidatePath('/(app)/accounting/ledger');

    return createResponse(null, `${Object.keys(groupedByOrder).length}`);
  } catch (e) {
    console.error('Error importing marketplace transactions: ', e);
    return createResponse(
      e instanceof Error ? e.message : 'An unknown error occurred.'
    );
  }
}
