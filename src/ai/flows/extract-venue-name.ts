'use server';

/**
 * @fileOverview A Genkit flow that extracts the theatre venue name from unstructured text.
 *
 * - extractVenueName - A function that extracts the theatre venue name.
 * - ExtractVenueNameInput - The input type for the extractVenueName function.
 * - ExtractVenueNameOutput - The return type for the extractVenueName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractVenueNameInputSchema = z.object({
  text: z.string().describe('The unstructured text to extract the venue name from.'),
});
export type ExtractVenueNameInput = z.infer<typeof ExtractVenueNameInputSchema>;

const ExtractVenueNameOutputSchema = z.object({
  venueName: z.string().describe('The extracted theatre venue name.'),
});
export type ExtractVenueNameOutput = z.infer<typeof ExtractVenueNameOutputSchema>;

export async function extractVenueName(input: ExtractVenueNameInput): Promise<ExtractVenueNameOutput> {
  return extractVenueNameFlow(input);
}

const extractVenueNamePrompt = ai.definePrompt({
  name: 'extractVenueNamePrompt',
  input: {schema: ExtractVenueNameInputSchema},
  output: {schema: ExtractVenueNameOutputSchema},
  prompt: `You are an expert at extracting theatre venue names from unstructured text.  Read the provided text and extract the name of the venue.

Text: {{{text}}}`,
});

const extractVenueNameFlow = ai.defineFlow(
  {
    name: 'extractVenueNameFlow',
    inputSchema: ExtractVenueNameInputSchema,
    outputSchema: ExtractVenueNameOutputSchema,
  },
  async input => {
    const {output} = await extractVenueNamePrompt(input);
    return output!;
  }
);
