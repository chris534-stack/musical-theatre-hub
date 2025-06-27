
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
  prompt: `You are an expert event detail extractor for the 'Our Stage, Eugene' website.
Your goal is to analyze the provided image to extract details for an event. An administrator has provided this image because they believe it contains a valid event.

Analyze the image:
{{media url=screenshotDataUri}}

{{#if url}}
The image is a screenshot from the following URL: {{url}}
{{/if}}

Your task is to populate a JSON object with the event details. Follow these steps precisely:

1.  **Call the 'getKnownVenues' tool.** This tool will give you a definitive list of all theatre venues that our website tracks. This is your list of approved venues.

2.  **Thoroughly examine the image for event information.** Look for posters, banners, calendars, or text that describes a show, audition, or performance.

3.  **Identify the Venue.** Scan the image for any text that could be a venue name. Compare any names you find against the list from the 'getKnownVenues' tool.
    - If you find a name in the image that is an **EXACT, case-sensitive match** to a name in the tool's list, use that name for the 'venue' field.
    - If you cannot find an exact match, you **MUST OMIT** the 'venue' field from your response. Do not guess or use a partial match.

4.  **Extract Other Details.** Based on the image, extract the following:
    - **Title**: The title of the event or the show it's for. For auditions, this should be the name of the show.
    - **Occurrences**: A list of all dates and times for performances or auditions. IMPORTANT: Only extract dates and times that are in the future. If a year is not specified, assume the current year. If a show has a run (e.g., Fri-Sun for 3 weeks), list out each individual performance date. If no upcoming dates are found, return an empty array for this field.
    - **Description**: A detailed description of the event. If it's an audition, make sure to mention that in the description (e.g., "Auditions for the musical...").

It is critical that the 'venue' field is handled correctly as described in step 3.
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
