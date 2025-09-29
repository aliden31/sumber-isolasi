"use server";

import {
  estimateStockQuantity,
  type EstimateStockQuantityInput,
  type EstimateStockQuantityOutput
} from "@/ai/flows/estimate-stock-quantity";

export async function handleStockEstimation(
  input: EstimateStockQuantityInput
): Promise<{ data: EstimateStockQuantityOutput | null; error: string | null }> {
  try {
    const output = await estimateStockQuantity(input);
    return { data: output, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { data: null, error: `Gagal mendapatkan estimasi dari AI: ${errorMessage}` };
  }
}
