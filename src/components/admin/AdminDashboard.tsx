
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueManager } from '@/components/admin/VenueManager';
import type { Event, Venue, ReviewerRequest, UserProfile } from '@/lib/types';
import { ReviewerRequestManager } from './ReviewerRequestManager';
import { UserManager } from './UserManager';

type EventWithVenue = Event & { venue?: Venue };

export default function AdminDashboard({ 
    initialEvents, 
    venues,
    reviewerRequests,
    users
}: { 
    initialEvents: EventWithVenue[], 
    venues: Venue[],
    reviewerRequests: ReviewerRequest[],
    users: UserProfile[]
}) {
  
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="venues">Venues</TabsTrigger>
        <TabsTrigger value="reviewers">Reviewer Requests</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UserManager initialUsers={users} />
      </TabsContent>
      <TabsContent value="venues">
        <VenueManager venues={venues} />
      </TabsContent>
      <TabsContent value="reviewers">
        <ReviewerRequestManager initialRequests={reviewerRequests} />
      </TabsContent>
    </Tabs>
  );
}
