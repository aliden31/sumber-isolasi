"use server";

import { revalidatePath } from "next/cache";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PurchaseRequestItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
};

export type PurchaseRequestInput = {
  requester: string;
  department: string;
  neededBy: string | null;
  justification?: string | null;
  items: PurchaseRequestItemInput[];
};

type ActionResponse = { error: string | null };

const createResponse = (error: string | null = null): ActionResponse => ({ error });

const sanitizeItems = (items: PurchaseRequestItemInput[]) => {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      if (!item) {
        return null;
      }

      const description = typeof item.description === "string" ? item.description.trim() : "";
      const quantity = Number((item as PurchaseRequestItemInput).quantity);
      const unitPrice = Number((item as PurchaseRequestItemInput).unitPrice);
      const notesValue = typeof item.notes === "string" ? item.notes.trim() : "";

      if (!description) {
        return null;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return null;
      }

      return {
        description,
        quantity,
        unitPrice,
        notes: notesValue ? notesValue : null,
      };
    })
    .filter((item): item is { description: string; quantity: number; unitPrice: number; notes: string | null } => item !== null);
};

export async function createPurchaseRequest(data: PurchaseRequestInput): Promise<ActionResponse> {
  try {
    const sanitizedItems = sanitizeItems(data.items);

    if (!sanitizedItems.length) {
      return createResponse("Setidaknya satu item permintaan harus diisi.");
    }

    const requester = data.requester?.trim();
    const department = data.department?.trim();
    const justification = data.justification?.trim() || null;

    if (!requester) {
      return createResponse("Nama pemohon wajib diisi.");
    }

    const neededByDate = data.neededBy ? new Date(data.neededBy) : null;
    const neededBy = neededByDate && !Number.isNaN(neededByDate.getTime()) ? Timestamp.fromDate(neededByDate) : null;

    const payload = {
      requester,
      department: department || null,
      neededBy,
      justification,
      items: sanitizedItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes,
      })),
      status: "Pending" as const,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "purchaseRequests"), payload);
    revalidatePath("/(app)/purchasing/request");
    return createResponse();
  } catch (error) {
    console.error("Error creating purchase request:", error);
    return createResponse(error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.");
  }
}
