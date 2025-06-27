'use server';

import { revalidatePath } from 'next/cache';
import { addEvent, getAllVenues, eventExists } from '@/lib/data';
import type { Event } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';


export async function revalidateAdminPaths() {
  revalidatePath('/admin');
  revalidatePath('/calendar');
  revalidatePath('/');
}

export async function scrapeEventAction(url: string) {
  try {
    const scrapedData = await scrapeEventDetails({ url });

    if (!scrapedData.title || scrapedData.occurrences.length === 0) {
      return { success: false, message: 'No upcoming events found at that URL for a known venue.' };
    }

    const allVenues = await getAllVenues();
    
    const venue = allVenues.find(v => v.name === scrapedData.venue);
    
    if (!venue) {
      return { success: false, message: `Scraped venue "${scrapedData.venue}" does not match any known venues.` };
    }
    const venueId = venue.id;

    const alreadyExists = await eventExists(scrapedData.title, venueId);
    if (alreadyExists) {
        return { success: false, message: `This event ("${scrapedData.title}" at "${venue.name}") already exists in the system.` };
    }

    const newEvent: Omit<Event, 'id'> = {
      title: scrapedData.title,
      description: scrapedData.description,
      occurrences: scrapedData.occurrences,
      venueId: venueId,
      type: 'Special Event',
      status: 'pending',
      url: url,
    };

    await addEvent(newEvent);
    await revalidateAdminPaths();
    return { success: true, message: 'Event scraped successfully and is pending review.' };
  } catch (error) {
    console.error('Scraping failed:', error);
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        return { success: false, message: 'Permission denied. The scraper is not yet configured with admin rights.' };
    }
    return { success: false, message: 'An unexpected error occurred while scraping the event details.' };
  }
}
