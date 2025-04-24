import React, { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
const navyShades = generateVibrantShades(NAVY, 10);
const goldShades = generateVibrantShades(GOLD, 10);
const VENUE_COLORS = [...navyShades, ...goldShades];



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
const EventTitleMarquee: React.FC<{ title: string }> = ({ title }) => {
  const [hovered, setHovered] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = React.useState(0);

  React.useEffect(() => {
    if (hovered && ref.current) {
      const containerWidth = ref.current.offsetWidth;
      const textWidth = ref.current.scrollWidth;
      if (textWidth > containerWidth) {
        setScroll(textWidth - containerWidth);
      } else {
        setScroll(0);
      }
    } else {
      setScroll(0);
    }
  }, [hovered, title]);

  return (
    <div
      style={marqueeStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      ref={ref}
    >
      <div
        style={{
          ...marqueeInnerStyle,
          transform: hovered && scroll > 0 ? `translateX(-${scroll}px)` : 'translateX(0)',
          transition: hovered && scroll > 0 ? 'transform 2.5s linear' : 'transform 0.4s',
        }}
      >
        {title}
      </div>
    </div>
  );
};

const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
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

  return (
    <Calendar
      localizer={localizer}
      events={calendarEvents}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600, margin: '2rem 0' }}
      components={{
        event: (props: any) => (
          <EventTitleMarquee title={props.title} />
        ),
      }}
      eventPropGetter={(event: any) => {
        // Assign a distinct color to each venue
        const venue = event.resource?.venue || '';
        const bgColor = getVenueColor(venue);
        // Use white text for dark backgrounds, navy for gold/light backgrounds
        const useDarkText = bgColor === '#ffd600' || bgColor === '#ffd700' || bgColor === '#f7f7f7' || bgColor === '#bfae48';
        return {
          style: {
            backgroundColor: bgColor,
            color: useDarkText ? '#2e3a59' : '#fff',
            borderRadius: 16,
            border: useDarkText ? '1.5px solid #bfae48' : 'none',
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
        if (event.resource && event.resource.slug && event.resource.venue) {
          const venueParam = encodeURIComponent(event.resource.venue);
          // Never add date to the URL
          window.location.href = `/events/${event.resource.slug}?venue=${venueParam}`;
        }
      }}
    />
  );
};

export default CalendarView;
