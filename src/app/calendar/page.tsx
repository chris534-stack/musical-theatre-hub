import { EventCalendar } from '@/components/calendar/EventCalendar';
import { getEventsByStatus, getAllVenues } from '@/lib/data';
import type { Venue } from '@/lib/types';

async function getApprovedEventsWithVenues() {
  const approvedEvents = await getEventsByStatus('approved');
  const allVenues = await getAllVenues();
  const venuesMap = new Map<string, Venue>(allVenues.map(v => [v.id, v]));
  
  return approvedEvents.map(event => ({
    ...event,
    venue: venuesMap.get(event.venueId)
  }));
}

export default async function CalendarPage() {
  const approvedEvents = await getApprovedEventsWithVenues();
  const allVenues = await getAllVenues();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <EventCalendar events={approvedEvents} venues={allVenues} />
    </div>
  );
}
