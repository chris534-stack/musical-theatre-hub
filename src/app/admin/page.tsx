import { getAllEvents, getAllVenues } from '@/lib/data';
import AdminDashboard from '@/components/admin/AdminDashboard';
import type { Venue } from '@/lib/types';
import AdminAuthGuard from '@/components/auth/AdminAuthGuard';

async function getEventsWithVenues() {
  const allEvents = await getAllEvents();
  const allVenues = await getAllVenues();
  const venuesMap = new Map<string, Venue>(allVenues.map(v => [v.id, v]));

  return allEvents.map(event => ({
    ...event,
    venue: venuesMap.get(event.venueId)
  }));
}

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const allEventsWithVenues = await getEventsWithVenues();
  const allVenues = await getAllVenues();

  return (
    <AdminAuthGuard>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-headline text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage events and scrape new listings.</p>
        </div>
        <AdminDashboard initialEvents={allEventsWithVenues} venues={allVenues} />
      </div>
    </AdminAuthGuard>
  );
}
