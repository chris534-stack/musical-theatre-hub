// Fetch grouped events from API instead of static JSON
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { FaPalette } from 'react-icons/fa';
import useIsAdmin from './useIsAdmin';
import AdminModal from './AdminModal';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './CalendarView.module.css';
import DayEventsModal from './DayEventsModal';
import { useSwipeable } from 'react-swipeable';

// --- Fetch events from API ---
function useGroupedEvents(): GroupedEvent[] {
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvent[]>([]);
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setGroupedEvents(data);
      })
      .catch(err => {
        console.error('Failed to fetch events from /api/events', err);
        setGroupedEvents([]);
      });
  }, []);
  return groupedEvents;
}

interface EventDate {
  date: string;
  time: string;
  isMatinee?: boolean;
}

interface GroupedEvent {
  slug: string;
  title: string;
  category: string;
  venue: string;
  description: string;
  director?: string;
  cast?: string;
  ticketLink?: string;
  dates: EventDate[];
}

export interface CalendarEvent extends Omit<GroupedEvent, 'dates'>, EventDate {
  start: Date;
  end: Date;
  resource: GroupedEvent;
}

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  events?: GroupedEvent[];
}

// Helper to flatten grouped events into calendar events
function flattenEvents(grouped: (GroupedEvent | CalendarEvent)[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const event of grouped) {
    if ('dates' in event && Array.isArray(event.dates)) {
      for (const dateObj of event.dates) {
        const start = new Date(dateObj.date + 'T' + (dateObj.time || '19:30'));
        // Assume 2.5 hour show unless matinee
        const end = new Date(start.getTime() + (dateObj.isMatinee ? 2 : 2.5) * 60 * 60 * 1000);
        events.push({
          ...event,
          ...dateObj,
          start,
          end,
          resource: event,
        });
      }
    } else if ('start' in event && 'end' in event) {
      events.push(event as CalendarEvent);
    }
  }
  return events;
}

function generateVibrantShades(hex: string, count: number): string[] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const shades: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let nr, ng, nb;
    if (t < 0.5) {
      const factor = 1 - t * 1.3;
      nr = Math.round(r * factor);
      ng = Math.round(g * factor);
      nb = Math.round(b * factor);
      if (hex === '#23395d') nr = Math.min(255, Math.round(nr * 1.1));
      if (hex === '#ffd600') nb = Math.max(0, Math.round(nb * 0.7));
    } else {
      const factor = (t - 0.5) * 2;
      nr = Math.round(r + (255 - r) * factor * 0.85);
      ng = Math.round(g + (255 - g) * factor * 0.85);
      nb = Math.round(b + (255 - b) * factor * 0.85);
    }
    shades.push(
      `#${nr.toString(16).padStart(2, '0')}${ng
        .toString(16)
        .padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
    );
  }
  return shades;
}

// Generate a larger, more vibrant palette of theme-based colors
const NAVY = '#23395d';
const GOLD = '#ffd600';
const TEAL = '#20bfa9';
const CORAL = '#ff6f61';
const PURPLE = '#7c4dff';
const navyShades = generateVibrantShades(NAVY, 12);
const goldShades = generateVibrantShades(GOLD, 12);
const tealShades = generateVibrantShades(TEAL, 8);
const coralShades = generateVibrantShades(CORAL, 8);
const purpleShades = generateVibrantShades(PURPLE, 8);
const VENUE_COLORS = [
  ...navyShades,
  ...goldShades,
  ...tealShades,
  ...coralShades,
  ...purpleShades,
];

// Map each venue to a color (deterministically)
function getVenueColor(venue: string) {
  let hash = 0;
  for (let i = 0; i < venue.length; i++) {
    hash = venue.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % VENUE_COLORS.length;
  return VENUE_COLORS[idx];
}

// CSS for marquee effect
const marqueeStyle: React.CSSProperties = {
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  position: 'relative',
  width: '100%',
  display: 'block',
};
const marqueeInnerStyle: React.CSSProperties = {
  display: 'inline-block',
  position: 'relative',
  transition: 'transform 0.3s',
};

// Custom event token with marquee on hover
// Utility hook for mobile detection
function useMobileOrAdjacent(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    function check() {
      setIsMobile(window.matchMedia('(max-width: 600px)').matches);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const EventTitleMarquee: React.FC<{ title: string; hideText?: boolean; small?: boolean }> = ({ title, hideText = false, small = false }) => {
  const [hovered, setHovered] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    if (hovered && ref.current) {
      const containerWidth = ref.current.offsetWidth;
      const textWidth = ref.current.scrollWidth;
      if (textWidth > containerWidth) {
        const distance = textWidth - containerWidth;
        setScroll(distance);
        // Fixed speed: 80px/sec
        setDuration(distance / 80);
      } else {
        setScroll(0);
        setDuration(0);
      }
    } else {
      setScroll(0);
      setDuration(0);
    }
  }, [hovered, title]);

  return (
    <div
      style={{
        ...marqueeStyle,
        height: small ? 15 : undefined,
        minHeight: small ? 15 : undefined,
        margin: small ? '2px 0' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={ref}
    >
      <div
        style={{
          ...marqueeInnerStyle,
          transform: hovered && scroll > 0 ? `translateX(-${scroll}px)` : 'translateX(0)',
          transition: hovered && scroll > 0 ? `transform ${duration.toFixed(2)}s linear` : 'transform 0.4s',
        }}
      >
        {!hideText ? title : null}
      </div>
    </div>
  );
};



const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [date, setDate] = useState(new Date());
  const calendarRef = useRef<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalEvents, setModalEvents] = useState<CalendarEvent[]>([]);

  // --- Mobile tap injection for month view ---
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 600px)').matches;
    if (!isMobile || view !== 'month') return;
    // Wait for calendar to render
    setTimeout(() => {
      const dayCells = document.querySelectorAll('.rbc-month-view .rbc-day-bg');
      if (!dayCells.length) return;
      // Find the first visible date in the grid
      const start = moment(date).startOf('month').startOf('week');
      dayCells.forEach((cell, idx) => {
        // Remove any previous injected button
        const prev = cell.querySelector('.tap-inject-btn');
        if (prev) prev.remove();
        // Compute date for this cell
        const cellDate = start.clone().add(idx, 'days').toDate();
        // Create transparent button
        const btn = document.createElement('button');
        btn.className = 'tap-inject-btn';
        btn.style.position = 'absolute';
        btn.style.top = '0';
        btn.style.left = '0';
        btn.style.width = '100%';
        btn.style.height = '100%';
        btn.style.background = 'transparent';
        btn.style.border = 'none';
        btn.style.padding = '0';
        btn.style.margin = '0';
        btn.style.zIndex = '10';
        btn.style.cursor = 'pointer';
        btn.setAttribute('aria-label', `Open events for ${moment(cellDate).format('MMMM D, YYYY')}`);
        btn.onclick = (e) => {
          e.stopPropagation();
          const eventsForDay = flattenEvents(grouped).filter(ev => moment(ev.date).isSame(moment(cellDate), 'day'));
          setModalDate(cellDate);
          setModalEvents(eventsForDay);
          setModalOpen(true);
        };
        (cell as HTMLElement).style.position = 'relative';
        cell.appendChild(btn);
      });
    }, 20);
    // Cleanup on unmount/view change
    return () => {
      const dayCells = document.querySelectorAll('.rbc-month-view .rbc-day-bg .tap-inject-btn');
      dayCells.forEach(btn => btn.remove());
    };
  }, [date, view, events]);


      const groupedEvents = useGroupedEvents();
  // Use provided events or fallback to imported groupedEvents
  const grouped = events ?? (groupedEvents as GroupedEvent[]);

  const calendarEvents = useMemo(
    () => flattenEvents(grouped),
    [grouped]
  );

  const isMobile = useMobileOrAdjacent();

  const handleSelectSlot = (slotInfo: any) => {
    if (!isMobile) return;
    if (!document.querySelector('.rbc-month-view')) return;
    const date = slotInfo.start;
    // Use moment for robust date comparison
    const eventsForDay = flattenEvents(grouped).filter(ev =>
      moment(ev.date).isSame(moment(date), 'day')
    );
    setModalDate(date);
    setModalEvents(eventsForDay);
    setModalOpen(true);
  };

  const isAdmin = useIsAdmin();
  // Procedurally assign visually distinct and legible colors to venues
  // Palette of visually distinct background, border, and text color sets
  // Allowed brand colors
  const BRAND_COLORS = [
    { name: 'navy', hex: '#23395d' },
    { name: 'yellow', hex: '#ffd600' },
    { name: 'white', hex: '#fff' },
    { name: 'black', hex: '#222' },
    { name: 'grey', hex: '#b0b4ba' },
  ];

  // Utility: check if text is readable on bg (simple contrast check)
  function isReadable(bg: string, text: string) {
    // Use luminance difference for quick check
    function luminance(hex: string) {
      const c = hex.replace('#', '');
      const rgb = [0, 1, 2].map(i => parseInt(c.substr(i * 2, 2), 16) / 255);
      return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    }
    return Math.abs(luminance(bg) - luminance(text)) > 0.45;
  }

  // Generate all valid (bg, border, text) combos
  const COLOR_PAIRS: { bg: string; border: string; text: string }[] = [];
  for (const bg of BRAND_COLORS) {
    for (const border of BRAND_COLORS) {
      if (border.hex === bg.hex) continue;
      for (const text of BRAND_COLORS) {
        if (text.hex === bg.hex || text.hex === border.hex) continue;
        if (!isReadable(bg.hex, text.hex)) continue;
        COLOR_PAIRS.push({ bg: bg.hex, border: border.hex, text: text.hex });
      }
    }
  }

  function getVenueColorSet(venue: string) {
    let hash = 0;
    for (let i = 0; i < venue.length; i++) {
      hash = venue.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % COLOR_PAIRS.length;
    return COLOR_PAIRS[idx];
  }


  // Swipe detection ref to block accidental modal on swipe
  const swipeInProgress = useRef(false);

  // Swipe gesture handlers (only on mobile)
  // Utility: check if date is in the current month
  const isCurrentMonth = moment(date).isSame(moment(), 'month');

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      swipeInProgress.current = true;
      if (!isMobile) return;
      if (view === 'month') setDate(prev => moment(prev).add(1, 'month').toDate());
      else if (view === 'week') setDate(prev => moment(prev).add(1, 'week').toDate());
      else if (view === 'day') setDate(prev => moment(prev).add(1, 'day').toDate());
      setTimeout(() => { swipeInProgress.current = false; }, 200);
    },
    onSwipedRight: () => {
      swipeInProgress.current = true;
      if (!isMobile) return;
      if (view === 'month') {
        // Only allow swiping right if not in current month
        if (!isCurrentMonth) setDate(prev => {
          const prevMonth = moment(prev).subtract(1, 'month');
          // Prevent navigating before current month
          if (prevMonth.isBefore(moment(), 'month')) return prev;
          return prevMonth.toDate();
        });
      } else if (view === 'week') setDate(prev => moment(prev).subtract(1, 'week').toDate());
      else if (view === 'day') setDate(prev => moment(prev).subtract(1, 'day').toDate());
      setTimeout(() => { swipeInProgress.current = false; }, 200);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 30,
    onSwipeStart: () => { swipeInProgress.current = true; },
    // onSwiped will always fire after a swipe gesture
    onSwiped: () => { setTimeout(() => { swipeInProgress.current = false; }, 200); },
  });

  // Debug: log the events being passed to the calendar
  console.log('DEBUG: calendarEvents', calendarEvents);
  return (
    <div 
      {...(isMobile ? swipeHandlers : {})}
      style={{
        marginTop: '-2px', /* Pull entire calendar component up to remove any gap */
        position: 'relative',
        zIndex: 5
      }}
    >
      {/* Custom navigation buttons for month view */}
      {view === 'month' && (
        <div className={styles.stickyMonthHeader} style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 12, 
          marginBottom: 0,
          borderTop: '1px solid #fff' /* Cover any potential border/gap */
        }}>
          <button
            onClick={() => {
              if (!isCurrentMonth) setDate(prev => {
                const prevMonth = moment(prev).subtract(1, 'month');
                if (prevMonth.isBefore(moment(), 'month')) return prev;
                return prevMonth.toDate();
              });
            }}
            disabled={isCurrentMonth}
            style={{
              background: 'none',
              border: 'none',
              color: isCurrentMonth ? '#b0b4ba' : '#23395d',
              fontSize: 28,
              cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
              opacity: isCurrentMonth ? 0.5 : 1,
              transition: 'color 0.2s, opacity 0.2s',
              marginRight: 6,
              padding: '2px 10px',
              borderRadius: 8,
              fontWeight: 700,
            }}
            aria-label="Previous Month"
          >
            &#8592;
          </button>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#23395d', minWidth: 120, textAlign: 'center' }}>
            {moment(date).format('MMMM YYYY')}
          </div>
          <button
            onClick={() => setDate(prev => moment(prev).add(1, 'month').toDate())}
            style={{
              background: 'none',
              border: 'none',
              color: '#23395d',
              fontSize: 28,
              cursor: 'pointer',
              marginLeft: 6,
              padding: '2px 10px',
              borderRadius: 8,
              fontWeight: 700,
              transition: 'color 0.2s',
            }}
            aria-label="Next Month"
          >
            &#8594;
          </button>
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, margin: '2rem 0' }}
          selectable={false}
          fixedWeeks={true} /* Force all months to display with exactly 6 weeks */
          longPressThreshold={isMobile ? 1 : 250}
          view={view}
          onView={(v: string) => setView(v as 'month' | 'week' | 'day')}
          date={date}
          onNavigate={(d: Date) => {
            // Prevent navigating to a past month
            if (view === 'month' && moment(d).isBefore(moment(), 'month')) return;
            setDate(d);
          }}
          components={{
            toolbar: () => null,
            event: (props: any) => {
              // On mobile month view, render the marquee with NO tap handler
              const isMobile = useMobileOrAdjacent();
              const calendarView = document.querySelector('.rbc-month-view');
              const inMonthView = !!calendarView;
              if (isMobile && inMonthView) {
                return <EventTitleMarquee title={props.title} hideText small />;
              }
              return <EventTitleMarquee title={props.title} />;
            },
            month: {
              event: (props: any) => {
                const isMobile = useMobileOrAdjacent();
                if (isMobile) {
                  return <EventTitleMarquee title={props.title} hideText small />;
                }
                return <EventTitleMarquee title={props.title} />;
              },
              eventWrapper: (props: any) => <div>{props.children}</div>,
              showMore: () => null,
            },
          }}
          eventPropGetter={(event: any) => {
            const venue = event.resource?.venue || '';
            const { bg, border, text } = getVenueColorSet(venue);
            return {
              style: {
                backgroundColor: bg,
                color: text,
                borderRadius: 16,
                border: `2px solid ${border}`,
                fontWeight: 700,
                fontSize: 15,
                opacity: 1,
                boxShadow: '0 4px 16px rgba(35,57,93,0.13)',
                padding: '2px 12px',
                transition: 'box-shadow 0.18s, background 0.18s',
                cursor: 'pointer',
              },
            };
          }}
          // Remove onSelectEvent for mobile, tap handled by overlay below
          onSelectEvent={!isMobile ? (event: any) => {
            if (event.resource && event.resource.slug && event.resource.venue) {
              const venueParam = encodeURIComponent(event.resource.venue);
              window.location.href = `/events/${event.resource.slug}?venue=${venueParam}`;
            }
          } : undefined}
        />
        {/* Overlay tap listeners for mobile month view */}

      </div>
    {/* end calendar container */}
    {isMobile && (
      <DayEventsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        events={modalEvents}
        date={modalDate || new Date()}
      />
    )}
  </div>
  );
};

export default CalendarView;
