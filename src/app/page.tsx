import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Theater, Calendar, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="py-20 md:py-32 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary mb-4 animate-fade-in-down">
            All the World's a Stage... in Eugene
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-fade-in-up">
            Our Stage, Eugene is your definitive guide to the vibrant and diverse theatre scene in Eugene, Oregon. Discover plays, musicals, and performances all in one place.
          </p>
          <Button size="lg" asChild className="animate-fade-in bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/calendar">View The Event Calendar</Link>
          </Button>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Why Our Stage?</h2>
            <p className="text-muted-foreground mt-2">One platform to find every performance.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-t-4 border-primary pt-6">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">Centralized Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No more jumping between websites. Find all of Eugene's theatre events in our comprehensive, easy-to-use calendar.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-t-4 border-primary pt-6">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  <Theater className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">Discover Local Venues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">From the Hult Center to the Very Little Theatre, we cover venues big and small. Filter events by your favorite stages.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-t-4 border-primary pt-6">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline mt-4">AI-Powered Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Our smart scraper automatically keeps the calendar up-to-date, so you're always in the know about the latest shows.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="bg-primary/5">
        <div className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
             <h2 className="text-3xl md:text-4xl font-bold font-headline">Support Local Theatre</h2>
             <p className="text-muted-foreground mt-4 mb-6">Every ticket purchased supports the artists, technicians, and storytellers that make our community a more creative and connected place. We make it easy to find shows and purchase tickets directly from the venues.</p>
             <Button asChild>
                <Link href="/calendar">Find a Show</Link>
             </Button>
          </div>
          <div className="relative h-80 rounded-lg overflow-hidden shadow-xl">
             <Image src="https://placehold.co/600x400.png" data-ai-hint="theatre stage" alt="Theatre Stage" layout="fill" objectFit="cover" />
          </div>
        </div>
      </section>
    </div>
  );
}
