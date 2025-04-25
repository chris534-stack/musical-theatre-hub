// Basic modal component for editing (to be replaced with real form)
import MultiStepAddEventForm from './MultiStepAddEventForm';
import React from 'react';

function useIsMobileModal() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 600 || window.innerWidth / window.innerHeight < 0.75);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function EditEventModal({ event, showEvents, onClose, onUpdated }: any) {
  // Convert event data to form initial values
  // Group showEvents by date and extract main/matinee times
  const datesMap: Record<string, any> = {};
  showEvents.forEach((e: any) => {
    if (!datesMap[e.date]) {
      datesMap[e.date] = { date: e.date, isMatinee: false, matineeTime: '', time: '' };
    }
    // Always set the main event time
    if (!e.isMatinee) {
      datesMap[e.date].time = e.time;
    }
    // Always set matinee status and time if present
    if (e.isMatinee) {
      datesMap[e.date].isMatinee = true;
      datesMap[e.date].matineeTime = e.time;
    }
  });
  const initialValues = {
    category: event.category || '',
    title: event.title || '',
    venue: event.venue || '',
    description: event.description || '',
    director: event.director || '',
    instructor: event.instructor || '',
    requirements: event.requirements || '',
    dates: Object.values(datesMap),
    time: event.time || '', // fallback for single-date events
    ticketLink: event.ticketLink || '',
  };

  const isMobile = useIsMobileModal();
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.3)',
        zIndex: 1000,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: isMobile ? '1.1rem 0.6rem 2.2rem 0.6rem' : 32,
          borderRadius: isMobile ? 0 : 8,
          minWidth: isMobile ? '100vw' : 350,
          minHeight: isMobile ? '100vh' : 400,
          maxWidth: isMobile ? '100vw' : 600,
          maxHeight: isMobile ? '100vh' : '80vh',
          width: isMobile ? '100vw' : undefined,
          height: isMobile ? '100vh' : undefined,
          position: 'relative',
          overflowY: 'auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 11,
          paddingBottom: 8,
          paddingTop: isMobile ? 8 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.22rem' : '1.4rem' }}>Edit Event</h2>
          <button
            onClick={onClose}
            style={{
              position: 'relative',
              top: 0,
              right: 0,
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              marginLeft: 8,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MultiStepAddEventForm
            editMode
            initialValues={initialValues}
            onSuccess={() => {
              onClose();
              if (onUpdated) onUpdated();
            }}
          />
        </div>
      </div>
    </div>
  );
}

