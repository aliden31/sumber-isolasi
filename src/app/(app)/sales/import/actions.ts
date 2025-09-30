
'use server';

import {
  collection,
  doc,
  runTransaction,
  Timestamp,
  writeBatch,
  getDocs,
  getDoc,
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
    salesDiscountAccountId,
    marketplaceFeeAccountId,
    cogsAccountId,
    inventoryAccountId,
    bankAccountId, // Defaulting to bank for marketplace payouts
  } = settings;

  const requiredAccountIds = [
    salesRevenueAccountId,
    salesDiscountAccountId,
    marketplaceFeeAccountId,
    cogsAccountId,
    inventoryAccountId,
    bankAccountId,
  ];

  if (requiredAccountIds.some((id) => !id)) {
    return createResponse(
      `Gagal membuat jurnal otomatis: Pengaturan pemetaan akun belum lengkap. Mohon lengkapi di menu Pengaturan > Akuntansi.`
    );
  }

  const groupedByOrder = transactions.reduce((acc, row) => {
    if (!row.mappedProduct) return acc;
    const orderId = row.nomor_order;
    if (!acc[orderId]) {
      acc[orderId] = {
        items: [],
        total: 0,
        totalCost: 0,
        discount: 0,
        fee: 0,
        netTotal: 0,
        customerName: row.nama_pembeli,
        date: new Date(row.tanggal_order),
      };
    }
    
    // Use cost from mapped product if available, otherwise from the report
    const cost = row.mappedProduct.cost || row.cost || 0;
    const itemSubtotal = row.unit_price * row.qty;

    acc[orderId].items.push({
      productId: row.mappedProduct.id,
      productName: row.mappedProduct.name,
      quantity: row.qty,
      price: row.unit_price,
      cost: cost,
      unit: row.mappedProduct.baseUnit,
    });
    
    acc[orderId].total += itemSubtotal;
    acc[orderId].totalCost += cost * row.qty;
    acc[orderId].discount += row.discount;
    acc[orderId].fee += row.fee;
    acc[orderId].netTotal += row.net_total;

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
        discount: order.discount,
        fee: order.fee,
        netTotal: order.netTotal,
        paymentMethod: 'Transfer', // Marketplace sales are treated as transfers
        customerId: `MKT-${order.customerName}`,
        customerName: order.customerName,
        status: 'Lunas'
      };
      batch.set(newTxRef, newTransaction);

      // 2. Update Stock for each item
      const productRefs = order.items.map((item: any) => doc(db, 'products', item.productId));
      const productSnaps = await Promise.all(productRefs.map(ref => getDoc(ref)));

      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const productSnap = productSnaps[i];
        if (productSnap.exists()) {
            const currentStock = productSnap.data().stock;
            batch.update(productRefs[i], { stock: currentStock - item.quantity });
        }
      }


      // 3. Create Journal Entries
      const journalDescription = `Penjualan Marketplace #${orderId}`;
      const journalEntries: JournalEntry[] = [];
      
      // Debit entries
      if (order.netTotal > 0) journalEntries.push({ accountId: bankAccountId!, accountName: '', debit: order.netTotal, credit: 0 });
      if (order.discount > 0) journalEntries.push({ accountId: salesDiscountAccountId!, accountName: '', debit: order.discount, credit: 0 });
      if (order.fee > 0) journalEntries.push({ accountId: marketplaceFeeAccountId!, accountName: '', debit: order.fee, credit: 0 });

      // Credit sales revenue
      journalEntries.push({ accountId: salesRevenueAccountId!, accountName: '', debit: 0, credit: order.total });


      const newJournal: NewJournal = {
        date: order.date,
        description: journalDescription,
        refNumber: newId,
        entries: journalEntries,
        total: order.total,
      };
      const newJournalRef = doc(collection(db, 'journals'));
      batch.set(newJournalRef, {
        ...newJournal,
        date: Timestamp.fromDate(newJournal.date as Date),
      });
      
      // Journal for COGS
      if (order.totalCost > 0) {
          const cogsJournal: NewJournal = {
            date: order.date,
            description: `HPP untuk Penjualan Marketplace #${orderId}`,
            refNumber: newId,
            entries: [
                { accountId: cogsAccountId!, accountName: '', debit: order.totalCost, credit: 0 },
                { accountId: inventoryAccountId!, accountName: '', debit: 0, credit: order.totalCost },
            ],
            total: order.totalCost,
          };
          const newCogsJournalRef = doc(collection(db, 'journals'));
          batch.set(newCogsJournalRef, {
            ...cogsJournal,
            date: Timestamp.fromDate(cogsJournal.date as Date),
          });
      }
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

