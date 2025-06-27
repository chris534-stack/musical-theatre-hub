'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventTable } from '@/components/admin/EventTable';
import { ScraperForm } from '@/components/admin/ScraperForm';
import { VenueManager } from '@/components/admin/VenueManager';
import type { Event, Venue } from '@/lib/types';

type EventWithVenue = Event & { venue?: Venue };

export default function AdminDashboard({ initialEvents, venues }: { initialEvents: EventWithVenue[], venues: Venue[] }) {
  const pendingEvents = initialEvents.filter(e => e.status === 'pending');
  const approvedEvents = initialEvents.filter(e => e.status === 'approved');
  const deniedEvents = initialEvents.filter(e => e.status === 'denied');

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="pending">Pending Review</TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="denied">Denied</TabsTrigger>
        <TabsTrigger value="venues">Venues</TabsTrigger>
        <TabsTrigger value="scraper">Web Scraper</TabsTrigger>
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
      <TabsContent value="venues">
        <VenueManager venues={venues} />
      </TabsContent>
      <TabsContent value="scraper">
        <ScraperForm />
      </TabsContent>
    </Tabs>
  );
}
