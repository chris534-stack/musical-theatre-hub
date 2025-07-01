
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { getEventsByStatus, getAllVenues, getAllReviews } from '@/lib/data';
import type { Venue, ExpandedCalendarEvent, Review } from '@/lib/types';

async function getApprovedEventsWithVenues(): Promise<ExpandedCalendarEvent[]> {
  // Reverted to sequential fetching for this page to resolve a bug with review data.
  const [approvedEvents, allVenues] = await Promise.all([
    getEventsByStatus('approved'),
    getAllVenues(),
  ]);
  const allReviews = await getAllReviews();

  const venuesMap = new Map<string, Venue>(allVenues.map(v => [v.id, v]));

  // Group reviews by showId for efficient lookup
  const reviewsByShowId = new Map<string, Review[]>();
  allReviews.forEach(review => {
    if (!reviewsByShowId.has(review.showId)) {
      reviewsByShowId.set(review.showId, []);
    }
    reviewsByShowId.get(review.showId)!.push(review);
  });
  
  const expandedEvents: ExpandedCalendarEvent[] = approvedEvents.flatMap(event => {
    if (!event.occurrences || event.occurrences.length === 0) {
      return [];
    }
    
    const eventReviews = reviewsByShowId.get(event.id) || [];

    return event.occurrences.map(occurrence => {
        const { occurrences, ...restOfEvent } = event;
        return {
            ...restOfEvent, // This includes the original event 'id'
            uniqueOccurrenceId: `${event.id}-${occurrence.date}-${occurrence.time || 'all-day'}`,
            date: occurrence.date,
            time: occurrence.time,
            venue: venuesMap.get(event.venueId),
            reviews: eventReviews // Attach the reviews for this event
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
