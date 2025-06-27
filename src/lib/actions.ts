'use server';

import { revalidatePath } from 'next/cache';
import { addEvent, getAllVenues } from '@/lib/data';
import type { Event } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';


export async function revalidateAdminPaths() {
  revalidatePath('/admin');
  revalidatePath('/calendar');
  revalidatePath('/');
}

export async function scrapeEventAction(url: string) {
  try {
    // This action will likely fail due to the same permissions issue.
    // It requires a different solution using the Firebase Admin SDK.
    // For now, focusing on fixing the update/delete functionality.
    const scrapedData = await scrapeEventDetails({ url });
    const allVenues = await getAllVenues();
    
    let venueId = '';
    const venueNameLower = scrapedData.venue.toLowerCase();
    for (const venue of allVenues) {
      if (venue.name.toLowerCase().includes(venueNameLower) || venueNameLower.includes(venue.name.toLowerCase())) {
        venueId = venue.id;
        break;
      }
    }
    
    if (!venueId) {
      console.warn(`Venue "${scrapedData.venue}" not found. Event will be unlinked.`);
    }

    const newEvent: Omit<Event, 'id'> = {
      title: scrapedData.title,
      description: scrapedData.description,
      occurrences: scrapedData.occurrences,
      venueId: venueId,
      type: 'Special Event', // Default type, admin can change it later
      status: 'pending',
      url: url,
    };

    await addEvent(newEvent);
    revalidatePath('/admin');
    return { success: true, message: 'Event scraped successfully and is pending review.' };
  } catch (error) {
    console.error('Scraping failed:', error);
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        return { success: false, message: 'Permission denied. The scraper is not yet configured with admin rights.' };
    }
    return { success: false, message: 'Failed to scrape event details from the URL.' };
  }
}
