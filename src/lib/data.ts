
import { adminDb } from './firebase-admin'; // Admin SDK for server-side functions
import type { Event, Venue, EventStatus, NewsArticle, Review } from './types';
import { startOfToday, addDays } from 'date-fns';

const parseDateString = (dateString: string): Date => {
  // Manually parse date components to avoid timezone shift issues.
  // new Date('YYYY-MM-DD') can be interpreted as UTC midnight.
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// --- Venue Functions ---

/**
 * [SERVER-SIDE] Fetches all venues using the Admin SDK.
 */
export async function getAllVenues(): Promise<Venue[]> {
  const snapshot = await adminDb.collection('venues').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue));
}


// --- Event Functions ---

interface GetAllEventsOptions {
  includeOccurrences?: boolean;
}

/**
 * [SERVER-SIDE] Fetches all events using the Admin SDK.
 * Can optionally exclude the 'occurrences' field for performance.
 */
export async function getAllEvents(options: GetAllEventsOptions = { includeOccurrences: true }): Promise<Event[]> {
  let query = adminDb.collection('events').select(
    'id', 'title', 'description', 'venueId', 'type', 'status', 'url'
  );

  // Only add 'occurrences' to the select statement if needed
  if (options.includeOccurrences) {
    query = adminDb.collection('events').select(
        'id', 'title', 'description', 'venueId', 'type', 'status', 'url', 'occurrences'
    );
  }

  const snapshot = await adminDb.collection('events').get();
  
  const events = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      venueId: data.venueId,
      type: data.type,
      status: data.status,
      url: data.url,
      // Conditionally include occurrences, defaulting to an empty array if not present
      occurrences: options.includeOccurrences ? (data.occurrences || []) : [],
    } as Event;
  });
  
  // Sort events by the date of their first occurrence if available
  if (options.includeOccurrences) {
      events.sort((a, b) => {
        if (!a.occurrences || a.occurrences.length === 0) return 1;
        if (!b.occurrences || b.occurrences.length === 0) return -1;
        const dateA = parseDateString(a.occurrences[0].date);
        const dateB = parseDateString(b.occurrences[0].date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  return events;
}

/**
 * [SERVER-SIDE] Fetches events by status.
 */
export async function getEventsByStatus(status: EventStatus): Promise<Event[]> {
    const q = adminDb.collection('events').where('status', '==', status);
    const snapshot = await q.get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

    // Sort events by the date of their first occurrence
    events.sort((a, b) => {
        if (!a.occurrences || a.occurrences.length === 0) return 1;
        if (!b.occurrences || b.occurrences.length === 0) return -1;
        const dateA = parseDateString(a.occurrences[0].date);
        const dateB = parseDateString(b.occurrences[0].date);
        return dateA.getTime() - dateB.getTime();
    });

    return events;
}

/**
 * [SERVER-SIDE] Fetches featured events for the homepage.
 */
export async function getFeaturedEventsFirestore(count: number): Promise<Event[]> {
    const approvedEvents = await getEventsByStatus("approved");

    const today = startOfToday();
    const thirtyDaysFromNow = addDays(today, 30);

    const eventsWithUpcomingOccurrences = approvedEvents
        .map(event => {
            if (!event.occurrences || event.occurrences.length === 0) {
                return null;
            }
            
            const upcomingOccurrences = event.occurrences.filter(occ => {
                try {
                    const eventDate = parseDateString(occ.date);
                    return eventDate >= today && eventDate <= thirtyDaysFromNow;
                } catch (e) {
                    return false;
                }
            });

            if (upcomingOccurrences.length > 0) {
                // Sort the occurrences for this event to find the soonest one
                upcomingOccurrences.sort((a, b) => {
                    const timeA = parseDateString(a.date).getTime();
                    const timeB = parseDateString(b.date).getTime();
                    if (timeA === timeB) {
                        return (a.time || '').localeCompare(b.time || '');
                    }
                    return timeA - timeB;
                });
                // Return a new event object with only the upcoming occurrences
                return { ...event, occurrences: upcomingOccurrences };
            }
            return null;
        })
        .filter((event): event is Event => event !== null);

    // Sort the events themselves by their soonest upcoming occurrence
    eventsWithUpcomingOccurrences.sort((a, b) => {
        // We know occurrences exist and are sorted from the step above.
        const firstDateA = parseDateString(a.occurrences[0].date);
        const firstDateB = parseDateString(b.occurrences[0].date);
        return firstDateA.getTime() - firstDateB.getTime();
    });

    return eventsWithUpcomingOccurrences.slice(0, count);
}

/**
 * [SERVER-SIDE] Adds a new event document using the Admin SDK.
 */
export async function addEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
  const docRef = await adminDb.collection('events').add(eventData);
  return { id: docRef.id, ...eventData };
}

/**
 * [SERVER-SIDE] Checks if an event already exists using the Admin SDK.
 */
export async function eventExists(title: string, venueId: string): Promise<boolean> {
  if (!venueId) return false;

  const q = adminDb.collection('events')
    .where('title', '==', title)
    .where('venueId', '==', venueId);
  
  const snapshot = await q.count().get();
  return snapshot.data().count > 0;
}


// --- News Article Functions ---
/**
 * [SERVER-SIDE] Adds a new news article document.
 */
export async function addNewsArticle(articleData: Omit<NewsArticle, 'id'>): Promise<NewsArticle> {
    const docRef = await adminDb.collection('news').add(articleData);
    return { id: docRef.id, ...articleData };
}

/**
 * [SERVER-SIDE] Fetches all news articles using the Admin SDK, ordered by creation date.
 */
export async function getAllNewsArticles(): Promise<NewsArticle[]> {
    const snapshot = await adminDb.collection('news').get();
    
    const articles = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            order: data.order, // This might be undefined for old articles
        } as NewsArticle;
    });

    // Custom sort: items with an 'order' value come first, sorted by that order.
    // Items without 'order' come next, sorted by their creation date.
    articles.sort((a, b) => {
        const aHasOrder = a.order !== undefined && a.order !== null;
        const bHasOrder = b.order !== undefined && b.order !== null;

        if (aHasOrder && bHasOrder) {
            return a.order - b.order;
        }
        if (aHasOrder) {
            return -1; // a comes first
        }
        if (bHasOrder) {
            return 1; // b comes first
        }
        // Neither has an order, so sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return articles;
}


// --- Review Functions ---

/**
 * [SERVER-SIDE] Fetches all reviews using the Admin SDK, sorted by creation date.
 */
export async function getAllReviews(): Promise<Review[]> {
  const snapshot = await adminDb.collection('reviews').orderBy('createdAt', 'desc').get();
  const reviews = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
    } as Review;
  });
  return reviews;
}
