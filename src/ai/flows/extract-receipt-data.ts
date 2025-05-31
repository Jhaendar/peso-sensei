
'use server';
/**
 * @fileOverview Extracts data from a receipt image using GenAI.
 *
 * - extractReceiptData - A function that handles the receipt data extraction process.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractReceiptDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  availableCategoryNames: z.array(z.string()).describe("A list of available category names for the AI to choose from."),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ExtractReceiptDataOutputSchema = z.object({
  title: z.string().describe('A concise title summarizing the receipt (e.g., "Grocery Purchase", "Restaurant Bill").'),
  amount: z.number().describe('The total amount on the receipt.'),
  date: z.string().describe('The date on the receipt (YYYY-MM-DD).'),
  category: z.string().describe('The suggested category of the expense on the receipt, chosen from the provided list or "Other".'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractReceiptDataPrompt',
  model: 'googleai/gemini-2.5-flash', // Specify Gemini 2.5 Flash for this prompt
  input: {schema: ExtractReceiptDataInputSchema},
  output: {schema: ExtractReceiptDataOutputSchema},
  prompt: `You are an expert at extracting data from receipts and categorizing expenses.

You will be given a photo of a receipt and a list of available expense categories.
Extract the following information:
- A concise title summarizing the receipt (e.g., "Grocery Purchase", "Restaurant Bill", "Online Subscription").
- The total amount on the receipt.
- The date on the receipt (in YYYY-MM-DD format).
- The most appropriate category for the expense from the provided list.

Available Categories:
{{#each availableCategoryNames}}
- {{this}}
{{/each}}

If none of the provided categories seem appropriate, suggest "Other" as the category.
Return the data in JSON format.

Receipt Photo: {{media url=photoDataUri}}`,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async input => {
    // Ensure availableCategoryNames is not empty, provide a default if it is
    const flowInput = {
      ...input,
      availableCategoryNames: input.availableCategoryNames.length > 0 ? input.availableCategoryNames : ["General Expense", "Miscellaneous", "Other"],
    };
    const {output} = await prompt(flowInput);
    return output!;
  }
);
