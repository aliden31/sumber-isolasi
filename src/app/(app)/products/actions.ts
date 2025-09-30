
"use server";

import { revalidatePath } from "next/cache";
import { collection, addDoc, doc, updateDoc, deleteDoc, writeBatch, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { NewProduct, Product } from "@/lib/types";

// Helper function to return a consistent response shape
const createResponse = (error: string | null = null) => ({ error });

export async function addProduct(productData: NewProduct) {
  try {
    const productsCol = collection(db, "products");
    await addDoc(productsCol, productData);
    revalidatePath("/(app)/products");
    revalidatePath("/(app)/pos");
    return createResponse();
  } catch (e) {
    console.error("Error adding document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function updateProduct(id: string, productData: Partial<NewProduct>) {
   try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, productData);
    revalidatePath("/(app)/products");
    revalidatePath("/(app)/pos");
    return createResponse();
  } catch (e) {
    console.error("Error updating document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function deleteProduct(id: string) {
   try {
    const productRef = doc(db, "products", id);
    await deleteDoc(productRef);
    revalidatePath("/(app)/products");
    revalidatePath("/(app)/pos");
    return createResponse();
  } catch (e) {
    console.error("Error deleting document: ", e);
    return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}


export async function batchImportProducts(products: NewProduct[]) {
  const batch = writeBatch(db);
  const productsCol = collection(db, "products");

  products.forEach((product) => {
    const docRef = doc(productsCol);
    batch.set(docRef, product);
  });

  try {
    await batch.commit();
    revalidatePath("/(app)/products");
    return createResponse();
  } catch (e) {
     return createResponse(e instanceof Error ? e.message : "An unknown error occurred.");
  }
}

export async function getProductsForExport(): Promise<{data: Product[] | null, error: string | null}> {
    try {
        const productsCol = collection(db, 'products');
        const productSnapshot = await getDocs(productsCol);
        const productList = productSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
            id: doc.id,
            name: data.name,
            sku: data.sku,
            stock: data.stock,
            category: data.category,
            cost: data.cost,
            units: data.units || [],
            baseUnit: data.baseUnit,
            minStockThreshold: data.minStockThreshold,
            } as Product;
        });
        return { data: productList, error: null };
    } catch (e) {
        return { data: null, error: e instanceof Error ? e.message : "An unknown error occurred." };
    }
}
