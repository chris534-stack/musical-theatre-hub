import { events, venues } from '@/lib/data';
import AdminDashboard from '@/components/admin/AdminDashboard';

async function getEvents() {
  // In a real app, this would be a database query.
  const allEvents = Array.from(events.values());
  return allEvents.map(event => ({
    ...event,
    venue: venues.get(event.venueId)
  }));
}

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const allEvents = await getEvents();
  const allVenues = Array.from(venues.values());

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage events and scrape new listings.</p>
      </div>
      <AdminDashboard initialEvents={allEvents} venues={allVenues} />
    </div>
  );
}
