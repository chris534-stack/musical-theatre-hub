
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VenueManager } from '@/components/admin/VenueManager';
import type { Event, Venue, ReviewerRequest } from '@/lib/types';
import { ReviewerRequestManager } from './ReviewerRequestManager';

type EventWithVenue = Event & { venue?: Venue };

export default function AdminDashboard({ 
    initialEvents, 
    venues,
    reviewerRequests
}: { 
    initialEvents: EventWithVenue[], 
    venues: Venue[],
    reviewerRequests: ReviewerRequest[]
}) {
  
  return (
    <Tabs defaultValue="venues" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="venues">Venues</TabsTrigger>
        <TabsTrigger value="reviewers">Reviewer Requests</TabsTrigger>
      </TabsList>
      <TabsContent value="venues">
        <VenueManager venues={venues} />
      </TabsContent>
      <TabsContent value="reviewers">
        <ReviewerRequestManager initialRequests={reviewerRequests} />
      </TabsContent>
    </Tabs>
  );
}
