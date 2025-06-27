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
import {z} from 'genkit';

const ScrapeEventDetailsInputSchema = z.object({
  url: z.string().url().describe('The URL of the event page to scrape.'),
});
export type ScrapeEventDetailsInput = z.infer<typeof ScrapeEventDetailsInputSchema>;

const ScrapeEventDetailsOutputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  occurrences: z.array(z.object({
      date: z.string().describe("The date of the performance in YYYY-MM-DD format."),
      time: z.string().describe("The time of the performance in HH:mm 24-hour format."),
  })).describe('A list of all dates and times for the event performances.'),
  venue: z.string().describe('The venue of the event.'),
  description: z.string().describe('A detailed description of the event.'),
});
export type ScrapeEventDetailsOutput = z.infer<typeof ScrapeEventDetailsOutputSchema>;

export async function scrapeEventDetails(input: ScrapeEventDetailsInput): Promise<ScrapeEventDetailsOutput> {
  return scrapeEventDetailsFlow(input);
}

const determineVenueRelevanceTool = ai.defineTool({
  name: 'determineVenueRelevance',
  description: 'Determines if the venue information on a page is relevant to the event being scraped.',
  inputSchema: z.object({
    venueName: z.string().describe('The name of the venue extracted from the page.'),
    pageContent: z.string().describe('A snippet of the page content containing the venue information.'),
  }),
  outputSchema: z.boolean().describe('True if the venue is relevant to the event, false otherwise.'),
}, async (input) => {
  // TODO: Implement the logic to determine venue relevance. This could involve checking keywords, proximity to event details, etc.
  // For now, always return true.
  return true;
});

const scrapeEventDetailsPrompt = ai.definePrompt({
  name: 'scrapeEventDetailsPrompt',
  input: {schema: ScrapeEventDetailsInputSchema},
  output: {schema: ScrapeEventDetailsOutputSchema},
  tools: [determineVenueRelevanceTool],
  prompt: `You are an expert event detail extractor.

  Given the URL for an event, extract the following details:
  - Title: The title of the event.
  - Occurrences: A list of all performance dates and times for the event. If a show has a run (e.g., Fri-Sun for 3 weeks), list out each individual date.
  - Venue: The venue of the event. Use the determineVenueRelevance tool to validate the venue.
  - Description: A detailed description of the event.

  URL: {{{url}}}

  Return the extracted details in JSON format.
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
    return output!;
  }
);
