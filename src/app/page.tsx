import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getFeaturedEventsFirestore, getAllVenues } from '@/lib/data';
import type { Event, Venue, EventOccurrence } from '@/lib/types';
import { format } from 'date-fns';

type EventWithVenue = Event & { venue?: Venue };

async function getFeaturedEvents(): Promise<EventWithVenue[]> {
  const featured = await getFeaturedEventsFirestore(3);
  const allVenues = await getAllVenues();
  const venuesMap = new Map<string, Venue>(allVenues.map(v => [v.id, v]));
  
  return featured.map(event => ({
    ...event,
    venue: venuesMap.get(event.venueId)
  }));
}

function formatOccurrence(occurrence: EventOccurrence) {
    try {
        // Manually parse date components to avoid timezone shift issues.
        // new Date('YYYY-MM-DD') can be interpreted as UTC midnight.
        const [year, month, day] = occurrence.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (occurrence.time) {
            const [hour, minute] = occurrence.time.split(':').map(Number);
            date.setHours(hour, minute);
            return format(date, "MMMM d, yyyy 'at' h:mm a");
        }
        return format(date, "MMMM d, yyyy");
    } catch (e) {
        return `${occurrence.date} at ${occurrence.time}`;
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
                  {event.occurrences && event.occurrences.length > 0 && (
                    <p className="text-muted-foreground text-sm mt-1">{formatOccurrence(event.occurrences[0])}</p>
                  )}
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
