
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { getEventsByStatus, getAllVenues, getAllReviews } from '@/lib/data';
import type { Venue, Event, Review, ExpandedCalendarEvent } from '@/lib/types';

async function getApprovedEventsWithVenues(): Promise<ExpandedCalendarEvent[]> {
  const approvedEvents = await getEventsByStatus('approved');
  const allVenues = await getAllVenues();
  let allReviews = await getAllReviews();
  
  // Find a suitable past event to attach the mock review to for preview purposes.
  const now = new Date();
  const eventForMocking = approvedEvents.find(event => 
    event.occurrences?.some(occ => new Date(`${occ.date}T${occ.time || '23:59:59'}`) < now)
  );
  
  // Inject mock review if a suitable past event is found
  if (eventForMocking) {
    const pastOccurrence = eventForMocking.occurrences.find(occ => new Date(`${occ.date}T${occ.time || '23:59:59'}`) < now)!;

    const mockReview: Review = {
        id: 'mock-review-1',
        showId: eventForMocking.id,
        showTitle: eventForMocking.title,
        performanceDate: pastOccurrence.date,
        reviewerId: 'mock-user-id',
        reviewerName: 'Casey Critic',
        createdAt: new Date().toISOString(),
        overallExperience: "Exceptional & Memorable",
        specialMomentsText: "The lead's performance in the second act was breathtaking. A true masterclass in acting that left the entire audience speechless.",
        recommendations: ["Date Night", "Dramatic", "Thought-Provoking"],
        showHeartText: "This was a profound exploration of family dynamics and loss. It was challenging, but ultimately very rewarding.",
        communityImpactText: "A story like this is exactly what Eugene needs right now. It opens up important conversations and showcases incredible local talent.",
        ticketInfo: "Paid $35 for a seat in the mezzanine, Row E. The view was excellent for the price.",
        valueConsiderationText: "For the price of a movie ticket and popcorn, you get a live experience that will stick with you for weeks. The production value was outstanding and felt like a bargain.",
        timeWellSpentText: "Absolutely. The show was engaging from start to finish. I'd recommend it to anyone looking for a powerful night of theatre.",
        likes: 12,
        dislikes: 1,
        votedBy: [],
    };
    allReviews.unshift(mockReview);
  }

  const venuesMap = new Map<string, Venue>(allVenues.map(v => [v.id, v]));
  const reviewsMap = new Map<string, Review[]>();
  allReviews.forEach(review => {
    if (!reviewsMap.has(review.showId)) {
        reviewsMap.set(review.showId, []);
    }
    reviewsMap.get(review.showId)!.push(review);
  });
  
  const expandedEvents: ExpandedCalendarEvent[] = approvedEvents.flatMap(event => {
    if (!event.occurrences || event.occurrences.length === 0) {
      return [];
    }
    
    // Sort reviews for this event by likes
    const sortedReviews = (reviewsMap.get(event.id) || []).sort((a,b) => b.likes - a.likes);

    return event.occurrences.map(occurrence => {
        const { occurrences, ...restOfEvent } = event;
        return {
            ...restOfEvent, // This includes the original event 'id'
            uniqueOccurrenceId: `${event.id}-${occurrence.date}-${occurrence.time || 'all-day'}`,
            date: occurrence.date,
            time: occurrence.time,
            venue: venuesMap.get(event.venueId),
            reviews: sortedReviews
        };
    })
  });

  // Sort all occurrences chronologically for the event list view
  expandedEvents.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
    const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
    return dateA.getTime() - dateB.getTime();
  });

  return expandedEvents;
}

export default async function CalendarPage() {
  const calendarEvents = await getApprovedEventsWithVenues();
  const allVenues = await getAllVenues();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <EventCalendar events={calendarEvents} venues={allVenues} />
    </div>
  );
}
