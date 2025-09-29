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
  productName: z.string().describe('The name of the product to estimate stock quantity for.'),
  historicalSalesData: z
    .string()
    .describe(
      'Historical sales data for the product, including dates and quantities sold. Represented as a JSON array of objects.'
    ),
  currentStockLevel: z.number().describe('The current stock level of the product.'),
  leadTimeDays: z.number().describe('The lead time in days for restocking the product.'),
  storageCapacity: z
    .number()
    .describe(
      'The available storage capacity for the product, limiting the maximum stock level.'
    ),
  seasonalTrends: z
    .string()
    .optional()
    .describe(
      'Optional data on seasonal trends affecting the product sales, if applicable. Represented as a JSON array of objects.'
    ),
});
export type EstimateStockQuantityInput = z.infer<typeof EstimateStockQuantityInputSchema>;

const EstimateStockQuantityOutputSchema = z.object({
  estimatedQuantity: z
    .number()
    .describe(
      'The estimated optimal stock quantity for the product, considering all input factors.'
    ),
  reasoning: z
    .string()
    .describe(
      'The detailed reasoning behind the estimated quantity, explaining the factors considered and the calculations made.'
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
  prompt: `You are an AI assistant helping store managers estimate the optimal stock quantity for a product.

  Consider the following factors to determine the estimated quantity:
  - Product Name: {{{productName}}}
  - Historical Sales Data: {{{historicalSalesData}}}
  - Current Stock Level: {{{currentStockLevel}}}
  - Lead Time (days): {{{leadTimeDays}}}
  - Storage Capacity: {{{storageCapacity}}}
  - Seasonal Trends (if available): {{{seasonalTrends}}}

  Provide the estimated quantity and a detailed reasoning explaining your decision. Include calculations made to support the optimal number, consider trends from sales data, lead time and any seasonality.
  Ensure the suggested stock level does not exceed the storage capacity.
  Use JSON format to represent historicalSalesData and seasonalTrends for easy parsing.
  Strictly adhere to provided schema when responding.
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
