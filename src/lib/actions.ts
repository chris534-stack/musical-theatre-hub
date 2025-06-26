'use server';

import { revalidatePath } from 'next/cache';
import { events, venues, addEvent, updateEvent } from '@/lib/data';
import type { Event, EventStatus } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';

export async function updateEventStatusAction(eventId: string, status: EventStatus) {
  try {
    updateEvent(eventId, { status });
    revalidatePath('/admin');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to update event status.' };
  }
}

export async function updateEventAction(eventId: string, data: Partial<Omit<Event, 'id' | 'status'>>) {
  try {
    updateEvent(eventId, data);
    revalidatePath('/admin');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to update event.' };
  }
}

export async function scrapeEventAction(url: string) {
  try {
    const scrapedData = await scrapeEventDetails({ url });
    
    let venueId = '';
    const venueNameLower = scrapedData.venue.toLowerCase();
    for (const [id, venue] of venues.entries()) {
      if (venue.name.toLowerCase().includes(venueNameLower) || venueNameLower.includes(venue.name.toLowerCase())) {
        venueId = id;
        break;
      }
    }
    
    if (!venueId) {
      console.warn(`Venue "${scrapedData.venue}" not found. Event will be unlinked.`);
    }

    const newEvent: Omit<Event, 'id'> = {
      title: scrapedData.title,
      description: scrapedData.description,
      // Basic date parsing, assuming a parsable format. A real app would need more robust parsing.
      date: new Date(scrapedData.date).toISOString().split('T')[0],
      time: scrapedData.time,
      venueId: venueId,
      type: 'Special Event', // Default type, admin can change it later
      status: 'pending',
      url: url,
    };

    addEvent(newEvent);
    revalidatePath('/admin');
    return { success: true, message: 'Event scraped successfully and is pending review.' };
  } catch (error) {
    console.error('Scraping failed:', error);
    return { success: false, message: 'Failed to scrape event details from the URL.' };
  }
}
