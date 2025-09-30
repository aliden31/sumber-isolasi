"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, Timestamp, runTransaction, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewPurchaseOrder, NewGoodsReceipt, Product, JournalEntry, NewJournal, GoodsReceipt, NewSupplierInvoice, NewPurchasePayment, SupplierInvoice } from "@/lib/types";
import { addJournalEntry } from "@/app/(app)/accounting/journal/actions";
import { getAccountingSettings } from "@/app/(app)/settings/accounting/actions";

const createResponse = (error: string | null = null, id: string | null = null) => ({ error, id });

export async function addPurchaseOrder(poData: NewPurchaseOrder) {
  try {
    const poCol = collection(db, "purchaseOrders");
    const poWithTimestamp = { ...poData, date: Timestamp.fromDate(poData.date as Date) };
    const docRef = await addDoc(poCol, poWithTimestamp);
    revalidatePath("/(app)/purchasing/order");
    return createResponse(null, docRef.id);
  } catch (e) {
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updatePurchaseOrderStatus(poId: string, status: PurchaseOrder['status']) {
    try {
        const poRef = doc(db, "purchaseOrders", poId);
        await updateDoc(poRef, { status });
        revalidatePath("/(app)/purchasing/order");
        revalidatePath("/(app)/purchasing/goods-receipt");
        return createResponse();
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}


export async function addGoodsReceipt(grData: NewGoodsReceipt, poId: string) {
    try {
        const newGRRef = await runTransaction(db, async (transaction) => {
            const grCol = collection(db, "goodsReceipts");
            const newDocRef = doc(grCol);
            transaction.set(newDocRef, { ...grData, date: Timestamp.fromDate(grData.date as Date), status: 'Pending Invoice' });

            let totalValueReceived = 0;
            for (const item of grData.items) {
                const productRef = doc(db, "products", item.productId);
                const productSnap = await transaction.get(productRef);
                if (!productSnap.exists()) throw new Error(`Produk ${item.productName} tidak ditemukan.`);
                const productData = productSnap.data() as Product;
                const newStock = productData.stock + item.receivedQuantity;
                transaction.update(productRef, { stock: newStock });
                totalValueReceived += (item.cost || 0) * item.receivedQuantity;
            }

            const poRef = doc(db, "purchaseOrders", poId);
            transaction.update(poRef, { status: 'Completed' });

            return { ref: newDocRef, totalValueReceived };
        });

        const { totalValueReceived } = newGRRef;
        const settings = await getAccountingSettings();
        const { inventoryAccountId, accruedPayableAccountId } = settings;

        if (!inventoryAccountId || !accruedPayableAccountId) {
            throw new Error('Akun Persediaan atau Utang Barang Diterima belum diatur di Pengaturan Akuntansi.');
        }

        const journalDescription = `Penerimaan Barang dari PO #${poId} (GRN: ${newGRRef.ref.id})`;
        const journalEntries: JournalEntry[] = [
            { accountId: inventoryAccountId, accountName: '', debit: totalValueReceived, credit: 0 },
            { accountId: accruedPayableAccountId, accountName: '', debit: 0, credit: totalValueReceived }
        ];

        const newJournal: NewJournal = {
            date: grData.date, description: journalDescription, refNumber: newGRRef.ref.id,
            entries: journalEntries, total: totalValueReceived
        };

        await addJournalEntry(newJournal);

        revalidatePath("/(app)/purchasing/goods-receipt");
        revalidatePath("/(app)/purchasing/order");
        revalidatePath("/(app)/products");
        revalidatePath("/(app)/accounting/ledger");
        revalidatePath("/(app)/dashboard");

        return createResponse(null, newGRRef.ref.id);
    } catch (e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}

export async function addSupplierInvoice(invoiceData: NewSupplierInvoice) {
    try {
        const batch = writeBatch(db);
        
        const invoiceCol = collection(db, "supplierInvoices");
        const newInvoiceRef = doc(invoiceCol);
        batch.set(newInvoiceRef, { ...invoiceData, date: Timestamp.fromDate(invoiceData.date as Date), status: 'Unpaid' });

        const grRef = doc(db, "goodsReceipts", invoiceData.goodsReceiptId);
        batch.update(grRef, { status: 'Invoiced' });

        const settings = await getAccountingSettings();
        const { accruedPayableAccountId, accountsPayableAccountId } = settings;
        if (!accruedPayableAccountId || !accountsPayableAccountId) {
            throw new Error('Akun Utang Barang Diterima atau Utang Usaha belum diatur.');
        }

        const journalDescription = `Faktur Pemasok #${invoiceData.invoiceNumber} dari ${invoiceData.supplierName}`;
        const journalEntries: JournalEntry[] = [
            { accountId: accruedPayableAccountId, accountName: '', debit: invoiceData.total, credit: 0 },
            { accountId: accountsPayableAccountId, accountName: '', debit: 0, credit: invoiceData.total }
        ];

        const newJournal: NewJournal = {
            date: invoiceData.date, description: journalDescription, refNumber: newInvoiceRef.id,
            entries: journalEntries, total: invoiceData.total
        };
        
        const journalsCol = collection(db, "journals");
        const newJournalRef = doc(journalsCol);
        batch.set(newJournalRef, { ...newJournal, date: Timestamp.fromDate(newJournal.date as Date) });

        await batch.commit();

        revalidatePath("/(app)/purchasing/invoice");
        revalidatePath("/(app)/purchasing/payables");
        revalidatePath("/(app)/accounting/ledger");
        return createResponse(null, newInvoiceRef.id);
    } catch (e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}

export async function paySupplierInvoice(paymentData: NewPurchasePayment) {
    try {
        const batch = writeBatch(db);

        const paymentCol = collection(db, "purchasePayments");
        const newPaymentRef = doc(paymentCol);
        batch.set(newPaymentRef, { ...paymentData, date: Timestamp.fromDate(paymentData.date as Date) });

        const invoiceRef = doc(db, "supplierInvoices", paymentData.invoiceId);
        batch.update(invoiceRef, { status: 'Paid' });

        const settings = await getAccountingSettings();
        const { accountsPayableAccountId } = settings;
        if (!accountsPayableAccountId) {
            throw new Error('Akun Utang Usaha belum diatur.');
        }

        const journalDescription = `Pembayaran Faktur Pemasok #${paymentData.invoiceNumber}`;
        const journalEntries: JournalEntry[] = [
            { accountId: accountsPayableAccountId, accountName: '', debit: paymentData.amount, credit: 0 },
            { accountId: paymentData.paymentAccountId, accountName: '', debit: 0, credit: paymentData.amount }
        ];

        const newJournal: NewJournal = {
            date: paymentData.date, description: journalDescription, refNumber: newPaymentRef.id,
            entries: journalEntries, total: paymentData.amount
        };

        const journalsCol = collection(db, "journals");
        const newJournalRef = doc(journalsCol);
        batch.set(newJournalRef, { ...newJournal, date: Timestamp.fromDate(newJournal.date as Date) });
        
        await batch.commit();

        revalidatePath("/(app)/purchasing/payables");
        revalidatePath("/(app)/accounting/ledger");
        return createResponse(null, newPaymentRef.id);
    } catch(e) {
        return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
    }
}
