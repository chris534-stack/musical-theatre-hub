import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, deleteDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Event, Venue, EventStatus } from './types';

const venuesCollection = collection(db, 'venues');
const eventsCollection = collection(db, 'events');

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
    // Original query sorted by date ascending, but getAllEvents sorts descending.
    // We need to re-sort to maintain the ascending order for the calendar view.
    return filteredByStatus.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getFeaturedEventsFirestore(count: number): Promise<Event[]> {
    const allEvents = await getAllEvents();
    const approvedEvents = allEvents.filter(event => event.status === "approved");
     // Original query sorted by date ascending, but getAllEvents sorts descending.
    // We re-sort to get the soonest upcoming events first.
    const sortedEvents = approvedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedEvents.slice(0, count);
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
