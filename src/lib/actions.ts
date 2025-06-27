'use server';

import { revalidatePath } from 'next/cache';
import { addEvent, updateEvent, getAllVenues } from '@/lib/data';
import type { Event, EventStatus } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';

export async function updateEventStatusAction(eventId: string, status: EventStatus) {
  try {
    await updateEvent(eventId, { status });
    revalidatePath('/admin');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to update event status.' };
  }
}

export async function updateEventAction(eventId: string, data: Partial<Omit<Event, 'id' | 'status'>>) {
  try {
    await updateEvent(eventId, data);
    revalidatePath('/admin');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to update event.' };
  }
}

export async function scrapeEventAction(url: string) {
  try {
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
    return { success: false, message: 'Failed to scrape event details from the URL.' };
  }
}
