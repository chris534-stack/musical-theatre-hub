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
  url: z.string().url().describe('The URL of the event page to scrape.'),
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
Your goal is to analyze the provided screenshot from a web page to determine if there are upcoming, relevant events to add to the website's calendar.

Analyze the screenshot provided from {{url}}:
{{media url=screenshotDataUri}}

Here are the steps you must follow:
1.  Use the getKnownVenues tool to get a list of all theatre venues the website is interested in.
2.  Analyze the provided screenshot. Look for posters, banners, calendars, or text that describes an event.
3.  Based on the image, extract the following details for any valid, upcoming events.
    - Title: The title of the event.
    - Occurrences: A list of all performance dates and times. IMPORTANT: Only extract dates and times that are in the future. Ignore any past performances. If a show has a run (e.g., Fri-Sun for 3 weeks), list out each individual performance date. If no upcoming performances are found, return an empty array for occurrences.
    - Venue: Find the best match for the venue from the list provided by the getKnownVenues tool. It is critical that the returned venue name is an EXACT match from the list.
    - Description: A detailed description of the event.
4.  If the page does not contain information about an event at one of the known venues, or if all events listed are in the past, you must return an empty object: {}.
  `,
});

const scrapeEventDetailsFlow = ai.defineFlow(
  {
    name: 'scrapeEventDetailsFlow',
    inputSchema: ScrapeEventDetailsInputSchema,
    outputSchema: ScrapeEventDetailsOutputSchema,
  },
  async (input) => {
    // The screenshot is now provided directly by the user.
    // Call the prompt with the URL and the screenshot data.
    const {output} = await scrapeEventDetailsPrompt(input);
    
    console.log('AI Model Response:', JSON.stringify(output, null, 2));
    
    if (!output) {
      throw new Error('AI model did not return a valid output object.');
    }

    return output;
  }
);
