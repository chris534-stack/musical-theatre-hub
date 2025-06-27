
'use server';

import { revalidatePath } from 'next/cache';
import { addEvent, eventExists } from '@/lib/data';
import { adminDb } from '@/lib/firebase-admin';
import type { Event, EventOccurrence } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';


export async function revalidateAdminPaths() {
  revalidatePath('/admin');
  revalidatePath('/calendar');
  revalidatePath('/');
}

export async function scrapeEventAction(url: string | undefined, screenshotDataUri: string) {
  try {
    const scrapedData = await scrapeEventDetails({ url, screenshotDataUri });
    return { success: true, data: { ...scrapedData, sourceUrl: url } };
  } catch (error) {
    console.error('Scraping failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `An unexpected error occurred while scraping the event details. Error: ${errorMessage}` };
  }
}

interface EventFormData {
  title: string;
  description?: string;
  url?: string;
  venueId: string;
  type: string;
  occurrences: EventOccurrence[];
}

export async function addEventFromFormAction(data: EventFormData) {
  try {
    const { title, venueId } = data;
    const alreadyExists = await eventExists(title, venueId);
    if (alreadyExists) {
        return { success: false, message: `This event ("${title}") already exists in the system for this venue.` };
    }

    const newEvent: Omit<Event, 'id'> = {
      ...data,
      description: data.description || '',
      status: 'approved',
    };

    await addEvent(newEvent);
    await revalidateAdminPaths();
    return { success: true, message: 'Event added and approved successfully.' };

  } catch (error) {
    console.error('Failed to add event:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
  }
}


export async function updateEventAction(eventId: string, data: EventFormData) {
  try {
    const eventUpdateData = {
      ...data,
      description: data.description || '',
    };
    
    const eventRef = adminDb.collection('events').doc(eventId);
    await eventRef.update(eventUpdateData);

    await revalidateAdminPaths();
    return { success: true, message: 'Event updated successfully.' };

  } catch (error) {
    console.error('Failed to update event:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
  }
}
