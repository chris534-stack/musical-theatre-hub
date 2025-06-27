
'use server';

import { revalidatePath } from 'next/cache';
import { addEvent, eventExists, addNewsArticle } from '@/lib/data';
import { adminDb } from '@/lib/firebase-admin';
import type { Event, EventOccurrence, NewsArticle } from '@/lib/types';
import { scrapeEventDetails } from '@/ai/flows/scrape-event-details';
import { scrapeArticle } from '@/ai/flows/scrape-article';


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

export async function scrapeArticleAction(url: string) {
    try {
        const articleData = await scrapeArticle({ url });

        if (!articleData.title || !articleData.summary) {
            return { success: false, message: 'The AI could not extract a title and summary from the article.' };
        }
        
        return { success: true, data: { ...articleData, url } };

    } catch (error) {
        console.error('Failed to scrape article:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

interface ArticleFormData {
  url: string;
  title: string;
  summary: string;
  imageUrl?: string;
}

export async function saveNewsArticleAction(data: ArticleFormData) {
    try {
        const newsCollection = adminDb.collection('news');
        const snapshot = await newsCollection.count().get();
        const articleCount = snapshot.data().count;

        await addNewsArticle({
            ...data,
            createdAt: new Date(),
            order: articleCount,
        });
        revalidatePath('/news');
        return { success: true, message: 'Article added successfully.' };
    } catch (error) {
        console.error('Failed to add news article:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function updateNewsArticleOrderAction(orderedArticleIds: string[]) {
    try {
        const batch = adminDb.batch();
        const newsCollection = adminDb.collection('news');

        orderedArticleIds.forEach((id, index) => {
            const docRef = newsCollection.doc(id);
            batch.update(docRef, { order: index });
        });

        await batch.commit();
        revalidatePath('/news');
        return { success: true, message: 'Article order updated.' };
    } catch (error) {
        console.error('Failed to update article order:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}

export async function addListingRequestAction(data: {
    organizationName: string;
    contactName: string;
    contactEmail: string;
    websiteUrl?: string;
    message?: string;
}) {
    try {
        const requestData = {
            ...data,
            status: 'new',
            createdAt: new Date(),
        };

        await adminDb.collection('listingRequests').add(requestData);
        
        return { success: true, message: 'Request submitted successfully.' };

    } catch (error) {
        console.error('Failed to submit listing request:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `An unexpected error occurred. Error: ${errorMessage}` };
    }
}
