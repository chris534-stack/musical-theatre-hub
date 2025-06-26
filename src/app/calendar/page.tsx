import { EventCalendar } from '@/components/calendar/EventCalendar';
import { events, venues } from '@/lib/data';

async function getApprovedEvents() {
  // In a real app, this would be a database query.
  const allEvents = Array.from(events.values());
  const approvedEvents = allEvents.filter(event => event.status === 'approved');
  
  // Attach venue information to each event
  return approvedEvents.map(event => ({
    ...event,
    venue: venues.get(event.venueId)
  }));
}

export default async function CalendarPage() {
  const approvedEvents = await getApprovedEvents();
  const allVenues = Array.from(venues.values());

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Event Calendar
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Find out what's playing on Eugene's stages.
        </p>
      </div>
      <EventCalendar events={approvedEvents} venues={allVenues} />
    </div>
  );
}
