'use server';

/**
 * @fileOverview This file defines a Genkit flow for automatically extracting event details from web pages.
 *
 * It uses a combination of web scraping and AI to extract information about events from various sources.
 * The flow takes a URL as input and returns a structured object containing event details.
 *
 * @file scrapeEventDetails - A function that scrapes event details from a given URL.
 * @file ScrapeEventDetailsInput - The input type for the scrapeEventDetails function, which is a URL string.
 * @file ScrapeEventDetailsOutput - The output type for the scrapeEventDetails function, containing event details like title, all occurrences, venue, and description.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getAllVenues } from '@/lib/data';

const ScrapeEventDetailsInputSchema = z.object({
  url: z.string().url().describe('The URL of the event page to scrape.'),
});
export type ScrapeEventDetailsInput = z.infer<typeof ScrapeEventDetailsInputSchema>;

const ScrapeEventDetailsOutputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  occurrences: z.array(z.object({
      date: z.string().describe("The date of the performance in YYYY-MM-DD format."),
      time: z.string().describe("The time of the performance in HH:mm 24-hour format."),
  })).describe('A list of all dates and times for the event performances. Only include performances that have not yet occurred.'),
  venue: z.string().describe('The venue of the event. Must match a name from the getKnownVenues tool.'),
  description: z.string().describe('A detailed description of the event.'),
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
Your goal is to analyze the provided URL and determine if there are upcoming, relevant events to add to the website's calendar.

Here are the steps you must follow:
1.  Use the getKnownVenues tool to get a list of all theatre venues the website is interested in.
2.  Visually analyze the fully rendered page at the provided URL. Your analysis must include all text and, most importantly, all images, such as posters or banners. URL: {{url}}
3.  Based on the content from both text and images, extract the following details for any valid, upcoming events.
    - Title: The title of the event. Look for titles in prominent text or within images related to the event (e.g., event posters).
    - Occurrences: A list of all performance dates and times. Pay close attention to dates and times mentioned in text and **dates and times displayed in images**. IMPORTANT: Only extract dates and times that are in the future. Ignore any past performances. If a show has a run (e.g., Fri-Sun for 3 weeks), list out each individual performance date. If no upcoming performances are found, return an empty array for occurrences.
    - Venue: The name of the event's venue. This MUST EXACTLY match one of the venue names provided by the getKnownVenues tool. Look for venue names in text and **potentially in images (e.g., venue logos or names on posters)**.
    - Description: A detailed description of the event. Combine information from text and any descriptive text found in images.
4.  If the page does not contain information about an event at one of the known venues, or if all events listed are in the past, you should return an object with empty strings for 'title' and 'description', and an empty array for 'occurrences'.
  `,
});

const scrapeEventDetailsFlow = ai.defineFlow(
  {
    name: 'scrapeEventDetailsFlow',
    inputSchema: ScrapeEventDetailsInputSchema,
    outputSchema: ScrapeEventDetailsOutputSchema,
  },
  async input => {
    const {output} = await scrapeEventDetailsPrompt(input);
    console.log('AI Model Response:', JSON.stringify(output, null, 2));
    
    if (!output) {
      throw new Error('AI model did not return a valid output object.');
    }

    return output;
  }
);