import { collection, addDoc } from 'firebase/firestore';
import { adminDb } from './firebase-admin'; // Admin SDK for server-side functions
import type { Event, Venue, EventStatus } from './types';
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

/**
 * [SERVER-SIDE] Fetches all events using the Admin SDK.
 */
export async function getAllEvents(): Promise<Event[]> {
  const snapshot = await adminDb.collection('events').get();
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
 * [SERVER-SIDE] Fetches events by status.
 */
export async function getEventsByStatus(status: EventStatus): Promise<Event[]> {
    const allEvents = await getAllEvents();
    return allEvents.filter(event => event.status === status);
}

/**
 * [SERVER-SIDE] Fetches featured events for the homepage.
 */
export async function getFeaturedEventsFirestore(count: number): Promise<Event[]> {
    const allEvents = await getAllEvents();
    const approvedEvents = allEvents.filter(event => event.status === "approved");

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
