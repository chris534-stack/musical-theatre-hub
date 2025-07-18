import { getAllEvents, getAllVenues, getAllReviewerRequests, getAllUserProfiles } from '@/lib/data';
import AdminDashboard from '@/components/admin/AdminDashboard';
import type { Venue, ReviewerRequest, UserProfile } from '@/lib/types';
import AdminAuthGuard from '@/components/auth/AdminAuthGuard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [allEvents, allVenues, reviewerRequests, allUsers] = await Promise.all([
    getAllEvents(),
    getAllVenues(),
    getAllReviewerRequests(),
    getAllUserProfiles(),
  ]);
  
  const venuesMap = new Map<string, Venue>(allVenues.map(v => [v.id, v]));

  const allEventsWithVenues = allEvents.map(event => ({
    ...event,
    venue: venuesMap.get(event.venueId)
  }));

  const sortedUsers = allUsers.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <AdminAuthGuard>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-headline text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage events, venues, and user roles.</p>
        </div>
        <AdminDashboard 
            initialEvents={allEventsWithVenues} 
            venues={allVenues}
            reviewerRequests={reviewerRequests}
            users={sortedUsers}
        />
      </div>
    </AdminAuthGuard>
  );
}
