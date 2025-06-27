
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
  venue: z.string().optional().describe('The venue of the event. Must match a name from the getKnownVenues tool.'),
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
Your goal is to analyze the provided image to extract details for any upcoming events, auditions, or performances. An administrator has provided this image because they believe it contains a valid event.

{{#if url}}
The image is a screenshot from the following URL: {{url}}
{{/if}}

Analyze the image:
{{media url=screenshotDataUri}}

Follow these steps:
1.  Use the getKnownVenues tool to get a list of all theatre venues the website is interested in.
2.  Analyze the provided image for posters, banners, calendars, or text that describes an event, audition, or performance. It is very important that you extract the information.
3.  Based on the image, extract the following details:
    - Title: The title of the event or the show it's for. For auditions, this should be the name of the show.
    - Occurrences: A list of all dates and times. This can be for auditions or performances. IMPORTANT: Only extract dates and times that are in the future. If a show has a run (e.g., Fri-Sun for 3 weeks), list out each individual performance date. If no upcoming dates are found, return an empty array.
    - Venue: Find the best match for the venue from the list provided by the getKnownVenues tool. It is critical that the returned venue name is an EXACT match from the list.
    - Description: A detailed description of the event. If it's an audition, mention that in the description (e.g., "Auditions for the musical...").
4.  If you cannot find a venue in the image that matches the provided list of known venues, you must return an empty object: {}. Do not make up a venue name. If the image is for an event but the venue isn't in the list, return an empty object.
  `,
});

const scrapeEventDetailsFlow = ai.defineFlow(
  {
    name: 'scrapeEventDetailsFlow',
    inputSchema: ScrapeEventDetailsInputSchema,
    outputSchema: ScrapeEventDetailsOutputSchema,
  },
  async (input) => {
    const {output} = await scrapeEventDetailsPrompt(input);
    
    console.log('AI Model Response:', JSON.stringify(output, null, 2));
    
    if (!output) {
      throw new Error('AI model did not return a valid output object.');
    }

    return output;
  }
);
