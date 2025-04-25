import React, { useMemo, useState, useEffect } from 'react';
import { FaPalette } from 'react-icons/fa';
import useIsAdmin from './useIsAdmin';
import AdminModal from './AdminModal';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DayEventsModal from './DayEventsModal';

export interface EventType {
  slug: string;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  director?: string;
  cast?: string;
  ticketLink?: string;
}

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  events: EventType[];
}

// Helper to generate tints and shades (lighter and darker, more saturated)
function generateVibrantShades(hex: string, count: number): string[] {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  const shades = [];
  for (let i = 0; i < count; i++) {
    // Interpolate between a darker and lighter version
    const t = i / (count - 1);
    // For first half, darken and saturate; for second half, lighten
    let nr, ng, nb;
    if (t < 0.5) {
      // Darken and saturate
      const factor = 1 - t * 1.3; // more darkness
      nr = Math.round(r * factor);
      ng = Math.round(g * factor);
      nb = Math.round(b * factor);
      // Slightly boost saturation for navy/gold
      if (hex === '#23395d') nr = Math.min(255, Math.round(nr * 1.1));
      if (hex === '#ffd600') nb = Math.max(0, Math.round(nb * 0.7));
    } else {
      // Lighten
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
        {hideText ? '' : title}
      </div>
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalEvents, setModalEvents] = useState<EventType[]>([]);

  const calendarEvents = useMemo(
    () =>
      events.map((e) => ({
        title: e.title,
        start: new Date(e.date + 'T' + (e.time ? e.time : '19:00')),
        end: new Date(e.date + 'T' + (e.time ? e.time : '21:00')),
        resource: e,
      })),
    [events]
  );

  const isMobile = useMobileOrAdjacent();

  const handleSelectSlot = (slotInfo: any) => {
    if (!isMobile) return;
    if (!document.querySelector('.rbc-month-view')) return;
    const date = slotInfo.start;
    // Use moment for robust date comparison
    const eventsForDay = events.filter(ev =>
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
  const COLOR_PAIRS = [];
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


  return (
    <>

      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600, margin: '2rem 0' }}
        selectable={isMobile}
        onSelectSlot={handleSelectSlot}
        components={{
        event: (props: any) => {
          // Detect if we're in month view and on mobile
          const isMobile = useMobileOrAdjacent();
          const calendarView = document.querySelector('.rbc-month-view');
          const inMonthView = !!calendarView;
          // If in month view and mobile, show only colored bars (no text, short height)
          if (isMobile && inMonthView) {
            return <EventTitleMarquee title={props.title} hideText small />;
          }
          return <EventTitleMarquee title={props.title} />;
        },
        month: {
          event: (props: any) => {
            // Always render the event, never show "+N more" button
            const isMobile = useMobileOrAdjacent();
            if (isMobile) {
              return <EventTitleMarquee title={props.title} hideText small />;
            }
            // fallback to default
            return <EventTitleMarquee title={props.title} />;
          },
          eventWrapper: (props: any) => <div>{props.children}</div>,
          showMore: () => null, // disables the '+N more' button
        },
      }}
      eventPropGetter={(event: any) => {
        // Procedurally assign visually distinct and legible colors to each venue
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
      onSelectEvent={(event: any) => {
        if (isMobile) {
          // On mobile, open modal for the event's date
          const date = event.start;
          const eventsForDay = events.filter(ev =>
            moment(ev.date).isSame(moment(date), 'day')
          );
          setModalDate(date);
          setModalEvents(eventsForDay);
          setModalOpen(true);
        } else if (event.resource && event.resource.slug && event.resource.venue) {
          const venueParam = encodeURIComponent(event.resource.venue);
          // Never add date to the URL
          window.location.href = `/events/${event.resource.slug}?venue=${venueParam}`;
        }
      }}
    />
    {isMobile && (
      <DayEventsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        events={modalEvents}
        date={modalDate || new Date()}
      />
    )}
  </>);
};

export default CalendarView;
