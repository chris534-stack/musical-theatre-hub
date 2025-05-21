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
  zIndex: 999, // Higher than any other element to ensure it's on top
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
  maxHeight: '85vh',
  overflowY: 'auto',
  textAlign: 'left',
  position: 'relative', // For positioning the close button
};

const eventTokenStyle: React.CSSProperties = {
  background: '#f5f7fb',
  borderRadius: 10,
  padding: '0.7rem 1rem',
  marginBottom: '1rem',
  boxShadow: '0 1px 7px 0 rgba(46,58,89,0.05)',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  color: '#2e3a59',
  cursor: 'pointer',
  padding: '5px 10px',
  zIndex: 10,
  fontWeight: 300,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  width: '34px',
  height: '34px',
  opacity: 0.7,
  transition: 'opacity 0.2s, background 0.2s',
};

export default function DayEventsModal({ open, onClose, events, date }: DayEventsModalProps) {
  // Dispatch custom event when modal state changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dayEventsModalStateChange', { 
        detail: { open } 
      }));
      
      // Lock body scroll when modal is open
      if (open) {
        // Store the current scroll position
        const scrollY = window.scrollY;
        // Add styles to prevent scrolling while maintaining position
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflowY = 'hidden';
      } else {
        // Restore scrolling and position when modal is closed
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
        // Restore scroll position
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY.replace('-', '')) || 0);
        }
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dayEventsModalStateChange', { 
          detail: { open: false } 
        }));
        
        // Always restore scrolling capability when component unmounts
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
      }
    };
  }, [open]);
  
  if (!open) return null;
  const dateStr = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="day-events-modal-overlay" style={modalStyle} onClick={handleOverlayClick}>
      <div style={cardStyle} onClick={e => e.stopPropagation()}>
        <button 
          style={closeButtonStyle} 
          onClick={onClose}
          aria-label="Close"
          onMouseOver={(e) => { 
            e.currentTarget.style.opacity = '1'; 
            e.currentTarget.style.background = 'rgba(46,58,89,0.08)';
          }}
          onMouseOut={(e) => { 
            e.currentTarget.style.opacity = '0.7'; 
            e.currentTarget.style.background = 'none';
          }}
        >
          ×
        </button>
        <h2 style={{ color: '#2e3a59', fontWeight: 700, marginBottom: 18, paddingRight: '30px' }}>{dateStr}</h2>
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
        {/* Extra padding div at the bottom for better scrolling experience */}
        <div style={{ height: '30px' }} />
      </div>
    </div>
  );
}
