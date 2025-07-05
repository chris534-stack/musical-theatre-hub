

import { adminDb, admin } from './firebase-admin'; // Admin SDK for server-side functions
import type { Event, Venue, EventStatus, NewsArticle, Review, UserProfile } from './types';
import { startOfToday, addDays } from 'date-fns';
import type { UserRecord } from 'firebase-admin/auth';

const parseDateString = (dateString: string): Date => {
  // Manually parse date components to avoid timezone shift issues.
  // new Date('YYYY-MM-DD') can be interpreted as UTC midnight.
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * [SERVER-SIDE] Safely converts a Firestore Timestamp, Date object, or string into a serializable ISO string.
 * Returns a default epoch date string if the input is invalid or null.
 */
function safeToISOString(dateValue: any): string {
    if (!dateValue) {
        return new Date(0).toISOString();
    }
    // Handle Firestore Timestamp
    if (typeof dateValue.toDate === 'function') {
        try {
            return dateValue.toDate().toISOString();
        } catch {
            return new Date(0).toISOString();
        }
    }
    // Handle JS Date object
    if (dateValue instanceof Date) {
        if (!isNaN(dateValue.getTime())) {
            return dateValue.toISOString();
        }
        return new Date(0).toISOString();
    }
    // Handle string or number
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        try {
            const d = new Date(dateValue);
            if (!isNaN(d.getTime())) {
                return d.toISOString();
            }
        } catch {
            // new Date() can throw, so we catch it.
        }
    }
    // Fallback for any other type or invalid value
    return new Date(0).toISOString();
}


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
    'id', 'title', 'description', 'venueId', 'type', 'tags', 'status', 'url'
  );

  // Only add 'occurrences' to the select statement if needed
  if (options.includeOccurrences) {
    query = adminDb.collection('events').select(
        'id', 'title', 'description', 'venueId', 'type', 'tags', 'status', 'url', 'occurrences'
    );
  }

  const snapshot = await adminDb.collection('events').get();
  
  const events = snapshot.docs.map(doc => {
    const data = doc.data();
    // Defensively map occurrences to ensure time is always a string.
    const occurrences = (options.includeOccurrences && data.occurrences) 
      ? data.occurrences.map((o: any) => ({ date: o.date, time: o.time || '' })) 
      : [];

    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      venueId: data.venueId,
      type: data.type,
      tags: data.tags || [],
      status: data.status,
      url: data.url,
      occurrences: occurrences,
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
    const events = snapshot.docs.map(doc => {
        const data = doc.data();
        // Defensively map occurrences to ensure time is always a string.
        const occurrences = (data.occurrences || []).map((o: any) => ({ date: o.date, time: o.time || ''}));
        return { id: doc.id, ...data, tags: data.tags || [], occurrences } as Event
    });

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
    const doc = await docRef.get();
    const data = doc.data();

    return { 
        id: doc.id, 
        ...data,
        createdAt: safeToISOString(data?.createdAt),
    } as NewsArticle;
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
            createdAt: safeToISOString(data.createdAt),
            order: data.order,
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
 * [SERVER-SIDE] Helper function to convert a Firestore review document into a clean, serializable Review object.
 */
function sanitizeReview(doc: admin.firestore.DocumentSnapshot): Review {
    const data = doc.data() || {};
    return {
        id: doc.id,
        showId: data.showId || '',
        showTitle: data.showTitle || 'Untitled Show',
        performanceDate: safeToISOString(data.performanceDate),
        reviewerId: data.reviewerId || '',
        reviewerName: data.reviewerName || 'Anonymous',
        createdAt: safeToISOString(data.createdAt),
        overallExperience: data.overallExperience || '',
        specialMomentsText: data.specialMomentsText || '',
        recommendations: data.recommendations || [],
        showHeartText: data.showHeartText || '',
        communityImpactText: data.communityImpactText || '',
        ticketInfo: data.ticketInfo || '',
        valueConsiderationText: data.valueConsiderationText || '',
        timeWellSpentText: data.timeWellSpentText || '',
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        votedBy: data.votedBy || [],
        disclosureText: data.disclosureText || '',
    };
}


// Helper function to find a suitable event for the mock review
function findEventForMockReview(events: Event[]): Event | null {
    const today = startOfToday();
    
    // Priority 1: Find a completed, approved, non-audition event
    const pastEvent = events.find(e => 
        e.status === 'approved' &&
        e.type.toLowerCase() !== 'audition' &&
        e.occurrences?.length > 0 &&
        new Date(`${e.occurrences[e.occurrences.length - 1].date}T23:59:59`) < today
    );
    if (pastEvent) return pastEvent;

    // Priority 2 (Fallback): Find ANY approved, non-audition event
    const anySuitableEvent = events.find(e =>
        e.status === 'approved' &&
        e.type.toLowerCase() !== 'audition' &&
        e.occurrences?.length > 0
    );
    return anySuitableEvent || null;
}

// Helper function to create the mock review
function createMockReview(event: Event): Review {
     const performanceDate = event.occurrences?.[0]?.date || new Date().toISOString().split('T')[0];
     return {
        id: 'mock-review-1',
        showId: event.id,
        showTitle: event.title,
        performanceDate: safeToISOString(performanceDate),
        reviewerId: 'mock-user-id',
        reviewerName: 'Casey Critic',
        createdAt: new Date().toISOString(),
        overallExperience: "Exceptional & Memorable",
        specialMomentsText: "The lead's performance in the second act was breathtaking. A true masterclass in acting that left the entire audience speechless. The rock score was performed with incredible energy by the band, and the lighting design perfectly captured the show's dark, intense mood.",
        recommendations: ["Date Night", "Dramatic", "Musical"],
        showHeartText: "This was a profound exploration of a historical figure through a modern rock lens. It was challenging, but ultimately very rewarding.",
        communityImpactText: "A story like this is exactly what Eugene needs right now. It opens up important conversations and showcases incredible local talent.",
        ticketInfo: "Paid $35 for a seat in the mezzanine, Row E. The view was excellent for the price.",
        valueConsiderationText: "For the price of a movie ticket and popcorn, you get a live experience that will stick with you for weeks. The production value was outstanding and felt like a bargain.",
        timeWellSpentText: "Absolutely. The show was engaging from start to finish. I'd recommend it to anyone looking for a powerful night of theatre.",
        likes: 12,
        dislikes: 1,
        votedBy: [],
        disclosureText: "To be fully transparent, I am good friends with the lighting designer. I've done my best to remain objective in my review of the production as a whole.",
    };
}


/**
 * [SERVER-SIDE] Fetches all reviews using the Admin SDK, sorted by creation date.
 */
export async function getAllReviews(): Promise<Review[]> {
  const snapshot = await adminDb.collection('reviews').orderBy('createdAt', 'desc').get();
  const reviews = snapshot.docs.map(sanitizeReview);
  
  // If no real reviews exist, create a mock one for demonstration.
  if (reviews.length === 0) {
      // Find a past event to attach the mock review to
      const allEvents = await getAllEvents({ includeOccurrences: true });
      const eventForMock = findEventForMockReview(allEvents);
      if (eventForMock) {
          reviews.push(createMockReview(eventForMock));
      }
  }

  return reviews;
}


/**
 * [SERVER-SIDE] Fetches all reviews by a specific user.
 */
export async function getReviewsByUserId(userId: string): Promise<Review[]> {
    const snapshot = await adminDb.collection('reviews')
        .where('reviewerId', '==', userId)
        .get();
        
    const reviews = snapshot.docs.map(sanitizeReview);

    // Sort in-code to avoid needing a composite index in Firestore.
    // Use localeCompare for safe string comparison.
    reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return reviews;
}


// --- User Profile Functions ---

/**
 * [SERVER-SIDE] Fetches a user profile from Firestore, creating one if it doesn't exist.
 * This function now safely handles "ghost users" (profiles without a matching auth record)
 * and returns the user's authentication status.
 */
export async function getOrCreateUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = adminDb.collection('userProfiles').doc(userId);
    let userRecord: UserRecord | null = null;
    let authStatus: 'active' | 'notFound' = 'active';

    try {
        userRecord = await admin.auth().getUser(userId);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.warn(`GHOST USER DETECTED: Auth record for ID ${userId} not found.`);
            authStatus = 'notFound';
            // We don't set userRecord, it remains null.
        } else {
            // For any other unexpected auth error, log it and fail gracefully.
            console.error(`Unexpected Firebase Auth error for user ID ${userId}:`, error);
            return null; // Prevent crash by returning null
        }
    }

    const docSnap = await docRef.get();

    // CASE 1: Profile document exists in Firestore.
    if (docSnap.exists) {
        const data = docSnap.data() || {};
        const profile: UserProfile = {
            userId: data.userId || userId,
            displayName: data.displayName || 'New User',
            photoURL: data.photoURL || '',
            email: data.email || '',
            bio: data.bio || '',
            roleInCommunity: data.roleInCommunity || 'Audience',
            communityStartDate: String(data.communityStartDate || ''),
            galleryImageUrls: data.galleryImageUrls || [],
            coverPhotoUrl: data.coverPhotoUrl || '',
            showEmail: data.showEmail || false,
            authStatus: authStatus,
        };
        return profile;
    }

    // CASE 2: Profile document does NOT exist, but we have a valid Auth record. Create it.
    if (userRecord) {
        const newProfile: UserProfile = {
            userId: userRecord.uid,
            displayName: userRecord.displayName || 'New User',
            photoURL: userRecord.photoURL || 'https://placehold.co/200x200.png',
            email: userRecord.email || '',
            bio: 'Welcome to the Our Stage community! Feel free to edit your profile and share a bit about yourself.',
            roleInCommunity: 'Audience',
            communityStartDate: '',
            galleryImageUrls: [],
            coverPhotoUrl: 'https://placehold.co/1600x400.png',
            showEmail: false,
            authStatus: 'active',
        };
        await docRef.set(newProfile);
        return newProfile;
    }

    // CASE 3: Profile and Auth record both do not exist.
    console.log(`User profile and auth record both not found for ID: ${userId}.`);
    return null;
}
