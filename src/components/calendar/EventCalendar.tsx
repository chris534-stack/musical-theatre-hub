'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { Event, Venue, EventType } from '@/lib/types';
import { FilterIcon, MapPin, Ticket, ExternalLink, CalendarDays } from 'lucide-react';

type EventWithVenue = Event & { venue?: Venue };

export function EventCalendar({ events, venues }: { events: EventWithVenue[], venues: Venue[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const eventTypes = useMemo(() => Array.from(new Set(events.map(e => e.type))) as EventType[], [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const venueMatch = selectedVenues.length === 0 || selectedVenues.includes(event.venueId);
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(event.type);
      return venueMatch && typeMatch;
    });
  }, [events, selectedVenues, selectedTypes]);
  
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventWithVenue[]>();
    filteredEvents.forEach(event => {
      const dateKey = new Date(event.date).toISOString().split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [filteredEvents]);

  const eventDays = useMemo(() => {
    return Array.from(eventsByDate.keys()).map(dateStr => new Date(dateStr + 'T12:00:00Z'));
  }, [eventsByDate]);
  
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = selectedDate.toISOString().split('T')[0];
    return eventsByDate.get(dateString) || [];
  }, [selectedDate, eventsByDate]);

  const handleVenueToggle = (venueId: string) => {
    setSelectedVenues(prev => 
      prev.includes(venueId) ? prev.filter(id => id !== venueId) : [...prev, venueId]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const DayWithDots: React.FC<{ date: Date }> = ({ date }) => {
    const dateString = date.toISOString().split('T')[0];
    const dayEvents = eventsByDate.get(dateString);
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        {date.getDate()}
        {dayEvents && dayEvents.length > 0 && (
          <div className="absolute bottom-1.5 flex space-x-1">
            {dayEvents.slice(0, 4).map(event => (
              <div key={event.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: event.venue?.color }}></div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
              modifiers={{ hasEvent: eventDays }}
              modifiersClassNames={{ hasEvent: "font-bold" }}
              components={{
                Day: ({ date }) => <DayWithDots date={date} />
              }}
            />
          </CardContent>
        </Card>
      </div>
      <div className="max-h-[70vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-headline">
            {isClient && selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Events'}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90"><FilterIcon className="mr-2 h-4 w-4" /> Filter</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Venues</h4>
                  <div className="space-y-2">
                    {venues.map(venue => (
                      <div key={venue.id} className="flex items-center space-x-2">
                        <Checkbox id={`venue-${venue.id}`} checked={selectedVenues.includes(venue.id)} onCheckedChange={() => handleVenueToggle(venue.id)} />
                        <Label htmlFor={`venue-${venue.id}`} className="flex items-center gap-2 cursor-pointer">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: venue.color }}></span>
                          {venue.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Event Types</h4>
                  <div className="space-y-2">
                    {eventTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox id={`type-${type}`} checked={selectedTypes.includes(type)} onCheckedChange={() => handleTypeToggle(type)} />
                        <Label htmlFor={`type-${type}`} className="cursor-pointer">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
          {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map(event => (
              <Card key={event.id} style={{ borderLeft: `4px solid ${event.venue?.color || 'transparent'}` }}>
                <CardHeader>
                  <CardTitle className="font-headline text-lg">{event.title}</CardTitle>
                  <CardDescription className="pt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 flex-shrink-0" /> <span>{event.venue?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Ticket className="h-4 w-4 flex-shrink-0" /> <span>{event.type} at {event.time}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                  <Button variant="link" size="sm" asChild className="p-0 h-auto">
                    <a href={event.url} target="_blank" rel="noopener noreferrer">
                      Visit Website <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
              <CalendarDays className="h-12 w-12 mb-4 text-gray-400" />
              <p className="font-semibold">No events scheduled for this day.</p>
              <p className="text-sm">Try clearing filters or selecting another date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
