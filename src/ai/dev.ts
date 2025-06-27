import { config } from 'dotenv';
config();

import '@/ai/flows/extract-venue-name.ts';
import '@/ai/flows/scrape-event-details.ts';
import '@/ai/flows/scrape-article.ts';
