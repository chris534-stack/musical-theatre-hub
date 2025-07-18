
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventTable } from '@/components/admin/EventTable';
import { ScraperForm } from '@/components/admin/ScraperForm';
import { VenueManager } from '@/components/admin/VenueManager';
import type { Event, Venue, ReviewerRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../auth/AuthProvider';
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
  const { user } = useAuth();
  
  return (
    <Tabs defaultValue="venues" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="venues">Venues</TabsTrigger>
        <TabsTrigger value="reviewers">Reviewer Requests</TabsTrigger>
        <TabsTrigger value="scraper">Web Scraper</TabsTrigger>
      </TabsList>
      <TabsContent value="venues">
        <VenueManager venues={venues} />
      </TabsContent>
      <TabsContent value="reviewers">
        <ReviewerRequestManager initialRequests={reviewerRequests} />
      </TabsContent>
      <TabsContent value="scraper">
        <div className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Automated Event Scraper</CardTitle>
              <CardDescription>
                Provide a URL and/or upload a screenshot of the page. The AI will pre-fill an event form for you to review and submit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScraperForm venues={venues} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
