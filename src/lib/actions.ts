'use server';

import { revalidatePath } from 'next/cache';
import { addEvent, updateEvent, getAllVenues, updateVenue, deleteVenue, deleteEvent } from '@/lib/data';
import type { Event, EventStatus, Venue } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';

export async function deleteVenueAction(venueId: string) {
  try {
    // This does not delete associated events, they will be orphaned.
    // This is a design choice to prevent accidental mass-deletion.
    await deleteVenue(venueId);
    revalidatePath('/admin');
    revalidatePath('/calendar');
    revalidatePath('/');
    return { success: true, message: 'Venue deleted successfully.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to delete venue.' };
  }
}

export async function deleteEventAction(eventId: string) {
  try {
    await deleteEvent(eventId);
    revalidatePath('/admin');
    revalidatePath('/calendar');
    return { success: true, message: 'Event deleted successfully.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to delete event.' };
  }
}

export async function updateVenueAction(venueId: string, data: Partial<Omit<Venue, 'id'>>) {
  try {
    await updateVenue(venueId, data);
    revalidatePath('/admin');
    revalidatePath('/calendar');
    revalidatePath('/'); // Revalidate homepage in case venue colors change there
    return { success: true, message: 'Venue updated successfully.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to update venue.' };
  }
}

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
