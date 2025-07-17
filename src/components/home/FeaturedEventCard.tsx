
'use client';

import { useState } from 'react';
import type { Event, Venue, Review } from '@/lib/types';
import { format } from 'date-fns';
import { cn, toTitleCase } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Ticket, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { ReviewList } from '@/components/reviews/ReviewList';

type EventWithVenueAndReviews = Event & { venue?: Venue, reviews: Review[] };

interface FeaturedEventCardProps {
    event: EventWithVenueAndReviews;
}

function formatOccurrence(occurrence: Event['occurrences'][0]) {
    try {
        const [year, month, day] = occurrence.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (occurrence.time) {
            const [hour, minute] = occurrence.time.split(':').map(Number);
            date.setHours(hour, minute);
            return format(date, "MMM d, yyyy 'at' h:mm a");
        }
        return format(date, "MMM d, yyyy");
    } catch (e) {
        return `${occurrence.date} at ${occurrence.time}`;
    }
}

export function FeaturedEventCard({ event }: FeaturedEventCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const firstOccurrence = event.occurrences && event.occurrences.length > 0 ? event.occurrences[0] : null;

    return (
        <Card
            className={cn(
                "w-full max-w-sm flex flex-col transition-all duration-500 ease-in-out shadow-lg hover:shadow-xl",
                isExpanded ? "max-w-xl" : "max-w-sm"
            )}
            style={{ borderTop: `4px solid ${event.venue?.color || 'hsl(var(--primary))'}` }}
        >
            <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer">
                <CardHeader>
                    <CardTitle className="font-headline font-bold text-primary text-center">
                        {toTitleCase(event.title)}
                    </CardTitle>
                    {firstOccurrence && (
                        <CardDescription className="text-center pt-2">
                             <div>{event.venue?.name}</div>
                             <div>{formatOccurrence(firstOccurrence)}</div>
                        </CardDescription>
                    )}
                </CardHeader>

                <div className={cn("transition-all duration-500 ease-in-out grid", isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                        <CardContent className="pt-2">
                             {event.tags && event.tags.length > 0 && (
                                <div className="flex flex-wrap justify-center gap-2 mb-4">
                                    {event.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">{toTitleCase(tag)}</Badge>
                                    ))}
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                        </CardContent>
                    </div>
                </div>

                <div className={cn("transition-all duration-500 ease-in-out grid", isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                     <div className="overflow-hidden">
                        <CardContent>
                            <Separator className="my-4" />
                            <ReviewList reviews={event.reviews} />
                        </CardContent>
                     </div>
                </div>

            </div>

             <CardFooter className="mt-auto flex-col items-center gap-4">
                <div className="flex w-full justify-between items-center">
                    {event.url ? (
                        <Button variant="link" asChild size="sm">
                            <a href={event.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                Visit Website
                                <ExternalLink className="ml-1 h-4 w-4" />
                            </a>
                        </Button>
                    ) : <div />}
                    
                    <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? "Show Less" : "Show Details"}
                        {isExpanded 
                            ? <ChevronUp className="ml-1 h-4 w-4" /> 
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        }
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
