"use server";

import { revalidatePath } from "next/cache";
import { addDoc, collection, doc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type PurchaseOrderStatus =
  | "Draft"
  | "Issued"
  | "Sent"
  | "Partially Received"
  | "Received"
  | "Closed"
  | "Cancelled";

export type PurchaseOrderLineInput = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type CreatePurchaseOrderInput = {
  poNumber: string;
  supplierId?: string | null;
  supplierName: string;
  requestId?: string | null;
  requestNumber?: string | null;
  issueDate: Date;
  expectedDate?: Date | null;
  notes?: string;
  items: PurchaseOrderLineInput[];
  status?: PurchaseOrderStatus;
};

const createResponse = (error: string | null = null, id: string | null = null) => ({
  error,
  id,
});

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  try {
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const purchaseOrdersCol = collection(db, "purchaseOrders");
    const now = new Date();

    const docRef = await addDoc(purchaseOrdersCol, {
      poNumber: input.poNumber,
      supplierId: input.supplierId ?? null,
      supplierName: input.supplierName,
      requestId: input.requestId ?? null,
      requestNumber: input.requestNumber ?? null,
      issueDate: Timestamp.fromDate(input.issueDate),
      expectedDate: input.expectedDate ? Timestamp.fromDate(input.expectedDate) : null,
      notes: input.notes ?? "",
      items: input.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
      })),
      subtotal,
      status: input.status ?? "Issued",
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    if (input.requestId) {
      const requestRef = doc(db, "purchaseRequests", input.requestId);
      try {
        await updateDoc(requestRef, {
          status: "Converted to PO",
          updatedAt: Timestamp.fromDate(now),
          linkedPoId: docRef.id,
          linkedPoNumber: input.poNumber,
        });
      } catch (error) {
        console.warn("Failed to update purchase request status", error);
      }
    }

    revalidatePath("/(app)/purchasing/order");

    return createResponse(null, docRef.id);
  } catch (error) {
    console.error("Failed to create purchase order", error);
    return createResponse(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menyimpan pesanan pembelian."
    );
  }
}
