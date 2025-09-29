'use server';

/**
 * @fileOverview AI tool that provides suggestions and helps predict the optimal stock quantity for a product.
 *
 * - estimateStockQuantity - A function that estimates the optimal stock quantity for a product.
 * - EstimateStockQuantityInput - The input type for the estimateStockQuantity function.
 * - EstimateStockQuantityOutput - The return type for the estimateStockQuantity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateStockQuantityInputSchema = z.object({
  productName: z.string().describe('Nama produk yang akan diestimasi kuantitas stoknya.'),
  historicalSalesData: z
    .string()
    .describe(
      'Data penjualan historis untuk produk, termasuk tanggal dan jumlah terjual. Direpresentasikan sebagai larik JSON dari objek.'
    ),
  currentStockLevel: z.number().describe('Tingkat stok produk saat ini.'),
  leadTimeDays: z.number().describe('Waktu tunggu dalam hari untuk restock produk.'),
  storageCapacity: z
    .number()
    .describe(
      'Kapasitas penyimpanan yang tersedia untuk produk, membatasi tingkat stok maksimum.'
    ),
  seasonalTrends: z
    .string()
    .optional()
    .describe(
      'Data opsional tentang tren musiman yang memengaruhi penjualan produk, jika berlaku. Direpresentasikan sebagai larik JSON dari objek.'
    ),
});
export type EstimateStockQuantityInput = z.infer<typeof EstimateStockQuantityInputSchema>;

const EstimateStockQuantityOutputSchema = z.object({
  estimatedQuantity: z
    .number()
    .describe(
      'Estimasi kuantitas stok optimal untuk produk, mempertimbangkan semua faktor input.'
    ),
  reasoning: z
    .string()
    .describe(
      'Penjelasan rinci di balik jumlah yang diestimasi, menjelaskan faktor-faktor yang dipertimbangkan dan perhitungan yang dibuat.'
    ),
});
export type EstimateStockQuantityOutput = z.infer<typeof EstimateStockQuantityOutputSchema>;

export async function estimateStockQuantity(
  input: EstimateStockQuantityInput
): Promise<EstimateStockQuantityOutput> {
  return estimateStockQuantityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateStockQuantityPrompt',
  input: {schema: EstimateStockQuantityInputSchema},
  output: {schema: EstimateStockQuantityOutputSchema},
  prompt: `Anda adalah asisten AI yang membantu manajer toko memperkirakan jumlah stok optimal untuk suatu produk.

  Pertimbangkan faktor-faktor berikut untuk menentukan perkiraan kuantitas:
  - Nama Produk: {{{productName}}}
  - Data Penjualan Historis: {{{historicalSalesData}}}
  - Tingkat Stok Saat Ini: {{{currentStockLevel}}}
  - Waktu Tunggu (hari): {{{leadTimeDays}}}
  - Kapasitas Penyimpanan: {{{storageCapacity}}}
  - Tren Musiman (jika tersedia): {{{seasonalTrends}}}

  Berikan perkiraan kuantitas dan alasan terperinci yang menjelaskan keputusan Anda. Sertakan perhitungan yang dibuat untuk mendukung angka optimal, pertimbangkan tren dari data penjualan, waktu tunggu, dan musiman apa pun.
  Pastikan tingkat stok yang disarankan tidak melebihi kapasitas penyimpanan.
  Gunakan format JSON untuk merepresentasikan historicalSalesData dan seasonalTrends agar mudah diurai.
  Patuhi skema yang diberikan secara ketat saat merespons.
  `,
});

const estimateStockQuantityFlow = ai.defineFlow(
  {
    name: 'estimateStockQuantityFlow',
    inputSchema: EstimateStockQuantityInputSchema,
    outputSchema: EstimateStockQuantityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
