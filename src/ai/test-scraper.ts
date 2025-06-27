'use server';

/**
 * @fileOverview A standalone script for testing the web scraper flow.
 *
 * This script allows for testing the `scrapeEventDetails` AI flow from the command line
 * without needing to run the full application or have admin privileges in the UI.
 * It provides detailed debug output at each step of the process.
 *
 * It performs a "dry run" by default, meaning it logs what it would write to
 * Firestore without actually making any changes to the database.
 *
 * Usage:
 * npm run test:scraper <URL_TO_SCRAPE>
 */

import { config } from 'dotenv';
config(); // Load .env variables from the root .env file

import { scrapeEventDetails } from './flows/scrape-event-details';
import { getAllVenues, eventExists } from '../lib/data';
import type { Event } from '../lib/types';

async function runScraperTest(url: string) {
  if (!url) {
    console.error('❌ ERROR: Please provide a URL as an argument.');
    console.log('Usage: npm run test:scraper <URL>');
    process.exit(1);
  }

  console.log(`🚀 Starting scraper test for URL: ${url}`);
  console.log('--------------------------------------------------');

  try {
    console.log('🧠 [1/4] Invoking AI flow "scrapeEventDetails"...');
    const scrapedData = await scrapeEventDetails({ url });

    console.log('\n✅ [2/4] AI flow completed. Raw scraped data:');
    console.log(JSON.stringify(scrapedData, null, 2));
    console.log('--------------------------------------------------');

    if (!scrapedData.title || !scrapedData.occurrences || scrapedData.occurrences.length === 0) {
      console.log('🏁 RESULT: No upcoming events found at that URL for a known venue. Halting.');
      return;
    }

    console.log('🔎 [3/4] Validating scraped data against the database...');
    const allVenues = await getAllVenues();
    const venue = allVenues.find(v => v.name === scrapedData.venue);

    if (!venue) {
      console.error(`❌ ERROR: Scraped venue "${scrapedData.venue}" does not match any known venues.`);
      console.log('Known venues:', allVenues.map(v => v.name));
      return;
    }
    console.log(`✔️ Venue found: "${venue.name}" (ID: ${venue.id})`);

    const alreadyExists = await eventExists(scrapedData.title, venue.id);
    if (alreadyExists) {
        console.warn(`⚠️ WARNING: This event ("${scrapedData.title}" at "${venue.name}") already exists in the system. Halting.`);
        return;
    }
    console.log('✔️ Event does not already exist.');
    console.log('--------------------------------------------------');

    console.log('📝 [4/4] Preparing to write to Firestore...');
    const newEvent: Omit<Event, 'id'> = {
      title: scrapedData.title,
      description: scrapedData.description || '',
      occurrences: scrapedData.occurrences,
      venueId: venue.id,
      type: 'Special Event', // Default type for scraped events
      status: 'pending',
      url: url,
    };

    console.log('\n🏁 RESULT: Test successful! The following event data would be created:');
    console.log(JSON.stringify(newEvent, null, 2));
    console.log('\nNOTE: This was a dry run. No data was actually written to Firestore.');

  } catch (error) {
    console.error('\n❌ An unexpected error occurred during the scraper test:', error);
  }
}

// Get URL from command line arguments
const urlToScrape = process.argv[2];
runScraperTest(urlToScrape);
