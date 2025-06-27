
'use server';
/**
 * @fileOverview A Genkit flow that scrapes a news article from a URL.
 *
 * - scrapeArticle - A function that scrapes the article.
 * - ScrapeArticleInput - The input type for the scrapeArticle function.
 * - ScrapeArticleOutput - The return type for the scrapeArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScrapeArticleInputSchema = z.object({
    url: z.string().url().describe('The URL of the news article to scrape.'),
});
export type ScrapeArticleInput = z.infer<typeof ScrapeArticleInputSchema>;

const ScrapeArticleOutputSchema = z.object({
    title: z.string().describe('The main title of the article.'),
    summary: z.string().describe('A concise, one or two-sentence summary of the article content.'),
    imageUrl: z.string().optional().describe('The URL of the most relevant image from the article. This should be a direct link to an image file (e.g., .jpg, .png).'),
});
export type ScrapeArticleOutput = z.infer<typeof ScrapeArticleOutputSchema>;

export async function scrapeArticle(input: ScrapeArticleInput): Promise<ScrapeArticleOutput> {
    return scrapeArticleFlow(input);
}

const scrapeArticlePrompt = ai.definePrompt({
    name: 'scrapeArticlePrompt',
    input: {schema: ScrapeArticleInputSchema},
    output: {schema: ScrapeArticleOutputSchema},
    prompt: `You are an expert at extracting key information from online news articles and reviews. Analyze the content at the given URL.

URL: {{{url}}}

From the article, please extract the following information and provide it in a structured JSON format:

- **Title**: The main headline of the article.
- **Summary**: A brief, engaging summary of the article, about one to two sentences long.
- **Image URL**: Find the most prominent and relevant image in the article. Provide a direct URL to the image file (e.g., ending in .jpg, .png, .webp). If no suitable image is found, you can omit this field.`,
});

const scrapeArticleFlow = ai.defineFlow(
{
    name: 'scrapeArticleFlow',
    inputSchema: ScrapeArticleInputSchema,
    outputSchema: ScrapeArticleOutputSchema,
},
async input => {
    const {output} = await scrapeArticlePrompt(input);
    if (!output) {
        throw new Error('AI model did not return a valid output.');
    }
    return output;
}
);
