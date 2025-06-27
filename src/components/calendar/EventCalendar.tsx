'use client';

import type { ExpandedCalendarEvent } from '@/app/calendar/page';
import { useState, useMemo, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { Venue, EventType } from '@/lib/types';
import { FilterIcon, MapPin, Ticket, ExternalLink, CalendarDays, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

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

    if (0 <= h && h < 120) {
        r = c; g = x; b = 0;
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

export function EventCalendar({ events, venues }: { events: ExpandedCalendarEvent[], venues: Venue[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const isMobile = useIsMobile();
  
  const eventTypes = useMemo(() => Array.from(new Set(events.map(e => e.type))) as EventType[], [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const venueMatch = selectedVenues.length === 0 || selectedVenues.includes(event.venueId);
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(event.type);
      return venueMatch && typeMatch;
    });
  }, [events, selectedVenues, selectedTypes]);
  
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ExpandedCalendarEvent[]>();
    filteredEvents.forEach(event => {
      const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [filteredEvents]);
  
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = format(selectedDate, 'yyyy-MM-dd');
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

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);
  
  const weekDayNames = useMemo(() => {
    const start = startOfWeek(new Date());
    return eachDayOfInterval({ start, end: endOfWeek(new Date()) }).map(d => format(d, 'EE'));
  }, []);

  const daysWithEvents = useMemo(() => {
    return Array.from(eventsByDate.keys()).map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    });
  }, [eventsByDate]);

  // FIX: Early return for server-side rendering moved here, after all hooks have been called.
  if (!isClient) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-full lg:max-w-none">
        <div className="lg:col-span-2">
          <Skeleton className="w-full h-full min-h-[720px]" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="w-full h-full min-h-[80vh]" />
        </div>
      </div>
    )
  }

  const DesktopCalendar = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="font-headline text-2xl">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <div className="grid grid-cols-7 border-t border-b text-center text-sm font-semibold text-muted-foreground">
        {weekDayNames.map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1 gap-px bg-border min-h-[720px]">
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate.get(dateKey) || [];
          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'p-2 bg-background hover:bg-muted/50 cursor-pointer flex flex-col overflow-hidden',
                !isSameMonth(day, currentMonth) && 'bg-muted/30 text-muted-foreground',
                isSameDay(day, selectedDate || new Date(0)) && 'bg-primary/10 ring-2 ring-primary z-10'
              )}
            >
              <span className={cn(
                'font-medium self-start',
                isToday(day) && 'bg-accent text-accent-foreground rounded-full h-6 w-6 flex items-center justify-center',
                isSameDay(day, selectedDate || new Date(0)) && isToday(day) && 'bg-primary text-primary-foreground'
              )}>
                {format(day, 'd')}
              </span>
              <div className="flex-1 mt-1 space-y-1 overflow-y-auto text-xs">
                  {dayEvents.slice(0, 4).map(event => (
                      <div
                          key={event.id}
                          className="p-1 rounded-sm truncate text-white"
                          style={{
                              backgroundColor: event.venue?.color || 'hsl(var(--primary))',
                              color: getContrastingTextColor(event.venue?.color || '')
                          }}
                          title={event.title}
                      >
                          {event.title}
                      </div>
                  ))}
                  {dayEvents.length > 4 && <div className="text-xs text-muted-foreground pt-1">... and {dayEvents.length - 4} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );

  const MobileCalendar = () => (
    <>
      <style>{`
        .has-event button {
          position: relative;
        }
        .has-event button::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: hsl(var(--primary));
        }
        .has-event button.day_today::after {
          background-color: hsl(var(--accent-foreground));
        }
        .has-event button.day_selected::after,
        .has-event button.day_selected:hover::after,
        .has-event button.day_selected:focus::after {
          background-color: hsl(var(--primary-foreground));
        }
      `}</style>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="w-full rounded-md border"
        modifiers={{ hasEvent: daysWithEvents }}
        modifiersClassNames={{ hasEvent: 'has-event' }}
      />
    </>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-full lg:max-w-none">
      <div className="lg:col-span-2">
        {isMobile ? <MobileCalendar /> : <DesktopCalendar />}
      </div>
      <div className="lg:col-span-1 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-headline">
            {selectedDate ? format(selectedDate, 'MMMM d') : 'Events'}
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
                        <Label htmlFor={`type-${type}`} className="cursor-pointer capitalize">{type.replace('-', ' ')}</Label>
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
                      <Ticket className="h-4 w-4 flex-shrink-0" /> <span className="capitalize">{event.type.replace('-', ' ')} at {event.time}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{event.description}</p>

                  {event.url && (
                    <Button variant="link" size="sm" asChild className="p-0 h-auto">
                      <a href={event.url} target="_blank" rel="noopener noreferrer">
                        Visit Website <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center pt-10 text-muted-foreground h-full flex flex-col items-center justify-center rounded-lg">
              <CalendarDays className="h-10 w-10 mb-3 text-muted-foreground/50" />
              <p className="font-semibold text-sm">No events scheduled.</p>
              <p className="text-xs">Select another day or clear filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
