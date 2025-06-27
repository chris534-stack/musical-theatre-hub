'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventTable } from '@/components/admin/EventTable';
import { ScraperForm } from '@/components/admin/ScraperForm';
import { VenueManager } from '@/components/admin/VenueManager';
import type { Event, Venue } from '@/lib/types';

type EventWithVenue = Event & { venue?: Venue };

function EventReviewTabs({ events, venues }: { events: EventWithVenue[], venues: Venue[] }) {
  const pendingEvents = events.filter(e => e.status === 'pending');
  const approvedEvents = events.filter(e => e.status === 'approved');
  const deniedEvents = events.filter(e => e.status === 'denied');

  return (
    <Tabs defaultValue="pending" className="w-full pt-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending">Pending Review ({pendingEvents.length})</TabsTrigger>
        <TabsTrigger value="approved">Approved ({approvedEvents.length})</TabsTrigger>
        <TabsTrigger value="denied">Denied ({deniedEvents.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <EventTable events={pendingEvents} venues={venues} />
      </TabsContent>
      <TabsContent value="approved">
        <EventTable events={approvedEvents} venues={venues} />
      </TabsContent>
      <TabsContent value="denied">
        <EventTable events={deniedEvents} venues={venues} />
      </TabsContent>
    </Tabs>
  );
}


export default function AdminDashboard({ initialEvents, venues }: { initialEvents: EventWithVenue[], venues: Venue[] }) {
  return (
    <Tabs defaultValue="reviews" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="reviews">Event Reviews</TabsTrigger>
        <TabsTrigger value="venues">Venues</TabsTrigger>
        <TabsTrigger value="scraper">Web Scraper</TabsTrigger>
      </TabsList>
      <TabsContent value="reviews">
        <EventReviewTabs events={initialEvents} venues={venues} />
      </TabsContent>
      <TabsContent value="venues">
        <VenueManager venues={venues} />
      </TabsContent>
      <TabsContent value="scraper">
        <div className="pt-4">
          <ScraperForm />
        </div>
      </TabsContent>
    </Tabs>
  );
}
