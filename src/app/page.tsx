import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { events, venues } from '@/lib/data';
import type { Event, Venue } from '@/lib/types';
import { format } from 'date-fns';

type EventWithVenue = Event & { venue?: Venue };

async function getFeaturedEvents(): Promise<EventWithVenue[]> {
  // In a real app, this would be a more sophisticated query,
  // e.g., fetching events for the current month.
  const allEvents = Array.from(events.values());
  const approvedEvents = allEvents.filter(event => event.status === 'approved');
  
  const featured = approvedEvents.slice(0, 3).map(event => ({
    ...event,
    venue: venues.get(event.venueId)
  }));
  
  return featured;
}

function formatDate(dateString: string, timeString: string) {
    try {
        const date = new Date(`${dateString}T${timeString}`);
        return format(date, "MMMM d, yyyy 'at' hh:mm a");
    } catch (e) {
        return `${dateString} at ${timeString}`;
    }
}

export default async function Home() {
  const featuredEvents = await getFeaturedEvents();

  return (
    <div className="flex flex-col">
      <section className="w-full py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-primary p-8 md:p-12 text-center text-primary-foreground shadow-2xl">
            <div className="inline-block">
                <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 leading-tight">
                Our Stage,<br />Eugene
                </h1>
                <div className="h-1.5 bg-accent w-1/2 mx-auto"></div>
            </div>
            <p className="text-md md:text-xl text-accent max-w-2xl mx-auto my-6">
              Your one-stop resource for performances, auditions, workshops, and community connections in Eugene, Oregon.
            </p>
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-md px-10 py-6 text-lg font-bold">
              <Link href="/calendar">View Upcoming Events</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary">Featured This Month</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredEvents.map(event => (
              <Card key={event.id} className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <h3 className="font-headline text-2xl font-bold text-primary">{event.title}</h3>
                  <p className="text-muted-foreground mt-2">{event.venue?.name}</p>
                  <p className="text-muted-foreground text-sm mt-1">{formatDate(event.date, event.time)}</p>
                  <Button variant="link" asChild className="mt-4">
                    <Link href={event.url || '#'}>Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
