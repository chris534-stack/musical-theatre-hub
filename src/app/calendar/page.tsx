import { EventCalendar } from '@/components/calendar/EventCalendar';
import { getEventsByStatus, getAllVenues } from '@/lib/data';
import type { Venue, Event } from '@/lib/types';

// An "Expanded Event" is a single performance instance, derived from a parent Event
export type ExpandedCalendarEvent = Omit<Event, 'occurrences'> & {
    date: string;
    time: string;
    venue?: Venue;
};

async function getApprovedEventsWithVenues(): Promise<ExpandedCalendarEvent[]> {
  const approvedEvents = await getEventsByStatus('approved');
  const allVenues = await getAllVenues();
  const venuesMap = new Map<string, Venue>(allVenues.map(v => [v.id, v]));
  
  const expandedEvents: ExpandedCalendarEvent[] = approvedEvents.flatMap(event => {
    if (!event.occurrences) {
      return [];
    }
    return event.occurrences.map(occurrence => {
        const { occurrences, ...restOfEvent } = event;
        return {
            ...restOfEvent,
            // Create a unique ID for React's key prop to avoid collisions
            id: `${event.id}-${occurrence.date}-${occurrence.time}`,
            date: occurrence.date,
            time: occurrence.time,
            venue: venuesMap.get(event.venueId)
        };
    })
  });

  // Sort all occurrences chronologically for the event list view
  expandedEvents.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
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
