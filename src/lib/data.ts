import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Event, Venue, EventStatus } from './types';
import { startOfToday, addDays } from 'date-fns';

// Collection references
const venuesCollection = collection(db, 'venues');
const eventsCollection = collection(db, 'events');

const parseDateString = (dateString: string): Date => {
  // Manually parse date components to avoid timezone shift issues.
  // new Date('YYYY-MM-DD') can be interpreted as UTC midnight.
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// --- Venue Functions ---

export async function getAllVenues(): Promise<Venue[]> {
  const snapshot = await getDocs(venuesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue));
}

export async function getVenue(id: string): Promise<Venue | undefined> {
    const docRef = doc(db, 'venues', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Venue;
    }
    return undefined;
}

export async function updateVenue(id: string, updates: Partial<Omit<Venue, 'id'>>): Promise<void> {
  const venueDoc = doc(db, 'venues', id);
  await updateDoc(venueDoc, updates);
}


// --- Event Functions ---

export async function getAllEvents(): Promise<Event[]> {
  const snapshot = await getDocs(eventsCollection);
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

export async function getEventsByStatus(status: EventStatus): Promise<Event[]> {
    const allEvents = await getAllEvents();
    return allEvents.filter(event => event.status === status);
}

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


export async function addEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
  const docRef = await addDoc(eventsCollection, eventData);
  return { id: docRef.id, ...eventData };
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  const eventDoc = doc(db, 'events', id);
  await updateDoc(eventDoc, updates);
}

export async function deleteEvent(id: string): Promise<void> {
  const eventDoc = doc(db, 'events', id);
  await deleteDoc(eventDoc);
}
