"use server";

import { revalidatePath } from "next/cache";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  GoodsReceipt,
  GoodsReceiptItem,
  GoodsReceiptStatus,
  LocalPurchaseOrder,
  PayableSummary,
  ProcurementItem,
  PurchaseInvoice,
  PurchaseInvoiceStatus,
  PurchaseOrderStatus,
  PurchaseRequest,
  PurchaseRequestStatus,
  PurchaseReturn,
} from "@/lib/types";

const createResponse = (error: string | null = null, id?: string) => ({ error, id });

function normalizeString(value?: string | null) {
  return value?.trim() ? value.trim() : null;
}

function sanitizeItem<T extends ProcurementItem | GoodsReceiptItem>(item: T): T {
  const next: Record<string, unknown> = { ...item };
  if ("notes" in next && (!next.notes || typeof next.notes !== "string" || !next.notes.trim())) {
    delete next.notes;
  } else if (typeof next.notes === "string") {
    next.notes = next.notes.trim();
  }
  return next as T;
}

export type PurchaseRequestInput = Omit<PurchaseRequest, "id" | "createdAt"> & {
  createdAt?: Date;
};

export async function createPurchaseRequest(data: PurchaseRequestInput) {
  try {
    const now = Timestamp.fromDate(data.createdAt ? new Date(data.createdAt) : new Date());
    const neededBy = data.neededBy
      ? Timestamp.fromDate(new Date(data.neededBy))
      : null;
    const docRef = await addDoc(collection(db, "purchaseRequests"), {
      number: data.number,
      requestedBy: data.requestedBy,
      department: data.department,
      supplierId: normalizeString(data.supplierId),
      supplierName: normalizeString(data.supplierName),
      neededBy,
      notes: normalizeString(data.notes),
      status: data.status ?? ("Draft" as PurchaseRequestStatus),
      createdAt: now,
      items: data.items.map((item) => sanitizeItem(item)),
    });

    revalidatePath("/(app)/purchasing/request");
    revalidatePath("/(app)/purchasing/order");
    return createResponse(null, docRef.id);
  } catch (error) {
    console.error("createPurchaseRequest", error);
    return createResponse(error instanceof Error ? error.message : "Gagal menyimpan permintaan pembelian.");
  }
}

export async function updatePurchaseRequestStatus(id: string, status: PurchaseRequestStatus) {
  try {
    await updateDoc(doc(db, "purchaseRequests", id), { status });
    revalidatePath("/(app)/purchasing/request");
    revalidatePath("/(app)/purchasing/order");
    return createResponse();
  } catch (error) {
    console.error("updatePurchaseRequestStatus", error);
    return createResponse(error instanceof Error ? error.message : "Gagal memperbarui status permintaan.");
  }
}

export type PurchaseOrderInput = Omit<LocalPurchaseOrder, "id"> & {
  orderDate: string | Date;
  expectedDate?: string | Date;
};

export async function createPurchaseOrder(data: PurchaseOrderInput) {
  try {
    const docRef = await addDoc(collection(db, "purchaseOrders"), {
      number: data.number,
      supplierId: normalizeString(data.supplierId),
      supplierName: data.supplierName,
      requestNumber: normalizeString(data.requestNumber),
      orderDate: Timestamp.fromDate(new Date(data.orderDate)),
      expectedDate: data.expectedDate ? Timestamp.fromDate(new Date(data.expectedDate)) : null,
      status: data.status,
      notes: normalizeString(data.notes),
      items: data.items.map((item) => sanitizeItem(item)),
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
    });

    revalidatePath("/(app)/purchasing/order");
    revalidatePath("/(app)/purchasing/goods-receipt");
    return createResponse(null, docRef.id);
  } catch (error) {
    console.error("createPurchaseOrder", error);
    return createResponse(error instanceof Error ? error.message : "Gagal menyimpan pesanan pembelian.");
  }
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
  try {
    await updateDoc(doc(db, "purchaseOrders", id), { status });
    revalidatePath("/(app)/purchasing/order");
    revalidatePath("/(app)/purchasing/goods-receipt");
    return createResponse();
  } catch (error) {
    console.error("updatePurchaseOrderStatus", error);
    return createResponse(error instanceof Error ? error.message : "Gagal memperbarui status pesanan.");
  }
}

export type GoodsReceiptInput = Omit<GoodsReceipt, "id" | "status"> & {
  status?: GoodsReceiptStatus;
  receiptDate: string | Date;
};

export async function createGoodsReceipt(data: GoodsReceiptInput) {
  try {
    const docRef = await addDoc(collection(db, "goodsReceipts"), {
      number: data.number,
      supplierName: data.supplierName,
      supplierId: normalizeString(data.supplierId),
      receiptDate: Timestamp.fromDate(new Date(data.receiptDate)),
      purchaseOrderNumber: data.purchaseOrderNumber,
      status: data.status ?? ("Draft" as GoodsReceiptStatus),
      notes: normalizeString(data.notes),
      items: data.items.map((item) => sanitizeItem(item)),
    });

    revalidatePath("/(app)/purchasing/goods-receipt");
    return createResponse(null, docRef.id);
  } catch (error) {
    console.error("createGoodsReceipt", error);
    return createResponse(error instanceof Error ? error.message : "Gagal menyimpan penerimaan barang.");
  }
}

export async function postGoodsReceipt(id: string) {
  try {
    await updateDoc(doc(db, "goodsReceipts", id), { status: "Diposting" satisfies GoodsReceiptStatus });
    revalidatePath("/(app)/purchasing/goods-receipt");
    revalidatePath("/(app)/stock/warehouses");
    return createResponse();
  } catch (error) {
    console.error("postGoodsReceipt", error);
    return createResponse(error instanceof Error ? error.message : "Gagal memposting penerimaan barang.");
  }
}

export type PurchaseInvoiceInput = Omit<PurchaseInvoice, "id"> & {
  invoiceDate: string | Date;
  dueDate: string | Date;
};

export async function createPurchaseInvoice(data: PurchaseInvoiceInput) {
  try {
    const docRef = await addDoc(collection(db, "purchaseInvoices"), {
      number: data.number,
      supplierId: normalizeString(data.supplierId),
      supplierName: data.supplierName,
      invoiceDate: Timestamp.fromDate(new Date(data.invoiceDate)),
      dueDate: Timestamp.fromDate(new Date(data.dueDate)),
      referenceNumbers: data.referenceNumbers
        .map((ref) => normalizeString(ref) ?? undefined)
        .filter((value): value is string => typeof value === "string"),
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      paidAmount: data.paidAmount ?? 0,
      status: data.status,
      notes: normalizeString(data.notes),
    });

    revalidatePath("/(app)/purchasing/invoice");
    revalidatePath("/(app)/purchasing/payables");
    return createResponse(null, docRef.id);
  } catch (error) {
    console.error("createPurchaseInvoice", error);
    return createResponse(error instanceof Error ? error.message : "Gagal menyimpan faktur pemasok.");
  }
}

export async function recordInvoicePayment(invoiceId: string, amount: number) {
  try {
    await runTransaction(db, async (tx) => {
      const invoiceRef = doc(db, "purchaseInvoices", invoiceId);
      const snapshot = await tx.get(invoiceRef);
      if (!snapshot.exists()) {
        throw new Error("Faktur tidak ditemukan");
      }
      const data = snapshot.data() as PurchaseInvoice;
      const newPaid = (data.paidAmount ?? 0) + amount;
      let status: PurchaseInvoiceStatus = data.status;
      if (newPaid >= data.total) {
        status = "Lunas";
      } else if (newPaid > 0) {
        status = "Sebagian Dibayar";
      } else {
        status = "Belum Dibayar";
      }
      tx.update(invoiceRef, { paidAmount: newPaid, status });
    });

    revalidatePath("/(app)/purchasing/invoice");
    revalidatePath("/(app)/purchasing/payables");
    return createResponse();
  } catch (error) {
    console.error("recordInvoicePayment", error);
    return createResponse(error instanceof Error ? error.message : "Gagal mencatat pembayaran faktur.");
  }
}

export async function updatePurchaseInvoiceStatus(id: string, status: PurchaseInvoiceStatus) {
  try {
    await updateDoc(doc(db, "purchaseInvoices", id), { status });
    revalidatePath("/(app)/purchasing/invoice");
    revalidatePath("/(app)/purchasing/payables");
    return createResponse();
  } catch (error) {
    console.error("updatePurchaseInvoiceStatus", error);
    return createResponse(error instanceof Error ? error.message : "Gagal memperbarui status faktur.");
  }
}

export type PurchaseReturnInput = Omit<PurchaseReturn, "id"> & {
  returnDate: string | Date;
};

export async function createPurchaseReturn(data: PurchaseReturnInput) {
  try {
    const docRef = await addDoc(collection(db, "purchaseReturns"), {
      number: data.number,
      supplierId: normalizeString(data.supplierId),
      supplierName: data.supplierName,
      referenceNumber: data.referenceNumber,
      returnDate: Timestamp.fromDate(new Date(data.returnDate)),
      total: data.total,
      reason: data.reason,
      notes: normalizeString(data.notes),
    });

    revalidatePath("/(app)/purchasing/returns");
    return createResponse(null, docRef.id);
  } catch (error) {
    console.error("createPurchaseReturn", error);
    return createResponse(error instanceof Error ? error.message : "Gagal menyimpan retur pembelian.");
  }
}

export async function addPayableReminder(payable: PayableSummary & {
  reminderDate: Date;
}) {
  try {
    await addDoc(collection(db, "payableReminders"), {
      ...payable,
      reminderDate: Timestamp.fromDate(payable.reminderDate),
    });
    return createResponse();
  } catch (error) {
    console.error("addPayableReminder", error);
    return createResponse(error instanceof Error ? error.message : "Gagal membuat pengingat jatuh tempo.");
  }
}
