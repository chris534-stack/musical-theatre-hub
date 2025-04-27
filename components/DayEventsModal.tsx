import React from 'react';
// Define a compatible EventType here (since CalendarView does not export it)
type EventType = {
  slug: string;
  title: string;
  category: string;
  venue: string;
  description: string;
  director?: string;
  ticketLink?: string;
  date: string;
  time?: string;
  isMatinee?: boolean;
};

interface DayEventsModalProps {
  open: boolean;
  onClose: () => void;
  events: EventType[];
  date: Date;
}

const modalStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(46,58,89,0.18)',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  boxShadow: '0 6px 32px 0 rgba(46,58,89,0.16)',
  padding: '1.2rem 1.3rem',
  minWidth: 260,
  maxWidth: 400,
  width: '90vw',
  maxHeight: '80vh',
  overflowY: 'auto',
  textAlign: 'left',
};

const eventTokenStyle: React.CSSProperties = {
  background: '#f5f7fb',
  borderRadius: 10,
  padding: '0.7rem 1rem',
  marginBottom: '1rem',
  boxShadow: '0 1px 7px 0 rgba(46,58,89,0.05)',
};

export default function DayEventsModal({ open, onClose, events, date }: DayEventsModalProps) {
  if (!open) return null;
  const dateStr = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div style={modalStyle} onClick={handleOverlayClick}>
      <div style={cardStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ color: '#2e3a59', fontWeight: 700, marginBottom: 18 }}>{dateStr}</h2>
        {events.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>No events for this day.</div>
        ) : (
          events.map(ev => (
            <div key={ev.slug} style={eventTokenStyle}>
              <a
                href={`/events/${ev.slug}`}
                style={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: '#23395d',
                  marginBottom: 4,
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'text-decoration 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                {ev.title}
              </a>
              <div style={{ fontSize: '0.98rem', color: '#4b5d8c' }}>{ev.venue} &mdash; {(() => {
                if (!ev.date) return ev.time || 'TBA'; // Defensive: if no date, just show time or TBA
                const d = new Date(ev.time && ev.time.trim() ? `${ev.date}T${ev.time}` : ev.date);
                const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                const timeStr = ev.time && ev.time.trim() ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
              })()}</div>
              <div style={{ fontSize: '0.97rem', margin: '6px 0 0 0', color: '#555' }}>{ev.description}</div>
              {ev.ticketLink && <a href={ev.ticketLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2e3a59', fontWeight: 600, textDecoration: 'underline', display: 'block', marginTop: 6 }}>Tickets</a>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
