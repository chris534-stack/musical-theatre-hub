'use client';

import { useState, useMemo, useEffect } from 'react';
import type { DayContentProps } from 'react-day-picker';
import { cn } from '@/lib/utils';
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

function getContrastingTextColor(hsl: string): string {
    if (!hsl) return '#ffffff';
    const result = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/.exec(hsl);
    if (!result) return '#ffffff';
    let h = parseInt(result[1]);
    let s = parseFloat(result[2]) / 100;
    let l = parseFloat(result[3]) / 100;
    
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

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

  const FullCalendarDayContent = (props: DayContentProps) => {
    const { date, activeModifiers } = props;
    if (!activeModifiers) return <></>; // Guard clause
    const { selected, today, outside } = activeModifiers;
    const dateString = date.toISOString().split('T')[0];
    const dayEvents = eventsByDate.get(dateString) || [];

    return (
        <div
            className={cn(
                'w-full h-full p-2 text-left align-top flex flex-col',
                outside && 'text-muted-foreground opacity-50'
            )}
        >
            <div className={cn(
                'font-medium',
                today && !selected && 'bg-accent text-accent-foreground rounded-full h-6 w-6 flex items-center justify-center'
            )}>
                {date.getDate()}
            </div>
            {!outside && (
                <div className="flex-1 w-full mt-1 space-y-1 overflow-y-auto text-xs">
                    {dayEvents.slice(0, 4).map(event => (
                        <div
                            key={event.id}
                            className="p-1 rounded-sm truncate"
                            style={{
                                backgroundColor: selected ? 'rgba(255,255,255,0.2)' : (event.venue?.color || 'hsl(var(--primary))'),
                                color: selected ? 'var(--primary-foreground)' : getContrastingTextColor(event.venue?.color || '')
                            }}
                            title={event.title}
                        >
                            {event.title}
                        </div>
                    ))}
                    {dayEvents.length > 4 && (
                        <div className={cn("text-center text-xs", selected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>+ {dayEvents.length - 4} more</div>
                    )}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3">
        <Card>
          <CardContent className="p-0 sm:p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full hidden sm:block"
              classNames={{
                cell: 'h-40 p-0 border-r border-b',
                day: 'w-full h-full p-0 relative focus-within:relative focus-within:z-20',
                head_cell: 'w-full text-center font-normal text-muted-foreground border-b p-2',
                row: 'flex w-full mt-0',
                month: 'space-y-0 border-l border-t rounded-lg overflow-hidden',
                table: 'w-full border-collapse',
                caption_label: 'text-xl font-headline',
                caption: 'text-center relative py-4',
                day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                day_today: 'bg-accent text-accent-foreground',
                day_outside: 'text-muted-foreground opacity-50',
              }}
              components={{
                DayContent: FullCalendarDayContent,
              }}
            />
             <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full sm:hidden"
            />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 max-h-[80vh] flex flex-col">
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
