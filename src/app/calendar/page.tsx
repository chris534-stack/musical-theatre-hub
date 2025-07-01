import { EventCalendar } from '@/components/calendar/EventCalendar';
import { getEventsByStatus, getAllVenues, getAllReviews } from '@/lib/data';
import type { Venue, Event, Review, ExpandedCalendarEvent } from '@/lib/types';

async function getApprovedEventsWithVenues(): Promise<ExpandedCalendarEvent[]> {
  const approvedEvents = await getEventsByStatus('approved');
  const allVenues = await getAllVenues();
  const allReviews = await getAllReviews();
  
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
