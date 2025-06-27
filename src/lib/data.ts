import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Event, Venue, EventStatus } from './types';
import { startOfToday, addDays } from 'date-fns';

// Collection references
const venuesCollection = collection(db, 'venues');
const eventsCollection = collection(db, 'events');

const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  // Creates a date at midnight in the server's local timezone
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


// --- Event Functions ---

export async function getAllEvents(): Promise<Event[]> {
  const snapshot = await getDocs(query(eventsCollection, orderBy("date", "desc")));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
}

export async function getEventsByStatus(status: EventStatus): Promise<Event[]> {
    const allEvents = await getAllEvents();
    const filteredByStatus = allEvents.filter(event => event.status === status);
    // We need to re-sort to maintain the ascending order for the calendar view.
    return filteredByStatus.sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());
}

export async function getFeaturedEventsFirestore(count: number): Promise<Event[]> {
    const allEvents = await getAllEvents();
    const approvedEvents = allEvents.filter(event => event.status === "approved");
    
    // Sort events by date ascending to get the soonest first
    const sortedEvents = approvedEvents.sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());

    const today = startOfToday();
    const thirtyDaysFromNow = addDays(today, 30);

    const featuredEvents = sortedEvents.filter(event => {
        try {
            const eventDate = parseDateString(event.date);
            
            // Check if the event date is between today and 30 days from now.
            return eventDate >= today && eventDate <= thirtyDaysFromNow;
        } catch (e) {
            console.error(`Invalid date format for event ${event.id}: ${event.date}`);
            return false;
        }
    });

    return featuredEvents.slice(0, count);
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
