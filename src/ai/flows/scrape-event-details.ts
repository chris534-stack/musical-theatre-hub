
'use server';

/**
 * @fileOverview This file defines a Genkit flow for automatically extracting event details from a user-provided screenshot.
 *
 * It uses a combination of web scraping and AI to extract information about events from various sources.
 * The flow takes a URL and a screenshot data URI as input and returns a structured object containing event details.
 *
 * @file scrapeEventDetails - A function that scrapes event details from a given URL and screenshot.
 * @file ScrapeEventDetailsInput - The input type for the scrapeEventDetails function.
 * @file ScrapeEventDetailsOutput - The output type for the scrapeEventDetails function, containing event details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getAllVenues } from '@/lib/data';

const ScrapeEventDetailsInputSchema = z.object({
  url: z.string().url().optional().describe('The URL of the event page to scrape.'),
  screenshotDataUri: z.string().describe("A screenshot of the page as a Base64 data URI."),
});
export type ScrapeEventDetailsInput = z.infer<typeof ScrapeEventDetailsInputSchema>;

const ScrapeEventDetailsOutputSchema = z.object({
  title: z.string().optional().describe('The title of the event.'),
  occurrences: z.array(z.object({
      date: z.string().describe("The date of the performance in YYYY-MM-DD format."),
      time: z.string().describe("The time of the performance in HH:mm 24-hour format."),
  })).optional().describe('A list of all dates and times for the event performances. Only include performances that have not yet occurred.'),
  venue: z.string().nullable().optional().describe('The venue of the event. Must match a name from the getKnownVenues tool.'),
  description: z.string().optional().describe('A detailed description of the event.'),
});
export type ScrapeEventDetailsOutput = z.infer<typeof ScrapeEventDetailsOutputSchema>;

export async function scrapeEventDetails(input: ScrapeEventDetailsInput): Promise<ScrapeEventDetailsOutput> {
  return scrapeEventDetailsFlow(input);
}

const getKnownVenuesTool = ai.defineTool({
  name: 'getKnownVenues',
  description: 'Gets a list of all known theatre venues that the website tracks.',
  inputSchema: z.object({}),
  outputSchema: z.array(z.string()).describe('An array of known venue names.'),
}, async () => {
  const venues = await getAllVenues();
  return venues.map(v => v.name);
});

const scrapeEventDetailsPrompt = ai.definePrompt({
  name: 'scrapeEventDetailsPrompt',
  input: {schema: ScrapeEventDetailsInputSchema},
  output: {schema: ScrapeEventDetailsOutputSchema},
  tools: [getKnownVenuesTool],
  prompt: `You are an expert assistant for the 'Our Stage, Eugene' website. Your task is to analyze an image provided by an administrator and extract event details into a structured JSON format.

Here is the image to analyze:
{{media url=screenshotDataUri}}

{{#if url}}
The image is a screenshot from the following URL: {{url}}
{{/if}}

Please answer the following questions based on the image and provide your final answer as a single JSON object.

- **What is the title of the event?** If this is for an audition, the title should be the name of the show they are auditioning for.

- **What is the venue for this event?** To answer this, you MUST first call the \`getKnownVenues\` tool to get a list of approved theatre names. Then, compare the names from the tool with the text in the image. The venue you provide in the JSON must be an *exact, case-sensitive match* from the tool's list. IMPORTANT: Even if you cannot find a matching venue and must set the 'venue' field to null, you must still extract all other details like the title, description, and dates.

- **What are the dates and times of the performances or auditions?** Please list all of them. Important: Only include dates that are in the future. If a year isn't specified, assume the current year. For a show with a run (e.g., Friday-Sunday for three weeks), list out each individual performance date and time. If no upcoming dates are found, return an empty array for this field.

- **What is the description of the event?** Provide a detailed summary. If it's an audition, please make that clear in the description.

Remember, your final output must be only the JSON object with the extracted details.
  `,
});

const scrapeEventDetailsFlow = ai.defineFlow(
  {
    name: 'scrapeEventDetailsFlow',
    inputSchema: ScrapeEventDetailsInputSchema,
    outputSchema: ScrapeEventDetailsOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await scrapeEventDetailsPrompt(input);
        
        console.log('AI Model Response:', JSON.stringify(output, null, 2));
        
        if (!output) {
          throw new Error('AI model did not return a valid output. The response may have been empty or blocked by safety settings.');
        }

        return output;
    } catch (e: any) {
        console.error("Error calling scrapeEventDetailsPrompt:", e);
        throw new Error(`The AI model failed to process the request. Raw error: ${e.message}`);
    }
  }
);
