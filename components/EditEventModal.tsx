// Basic modal component for editing (to be replaced with real form)
import MultiStepAddEventForm from './MultiStepAddEventForm';
import React from 'react';

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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
      <div style={{ background: 'white', padding: 32, borderRadius: 8, minWidth: 350, minHeight: 400, maxWidth: 600, maxHeight: '80vh', position: 'relative', overflowY: 'auto', boxSizing: 'border-box' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
        <h2>Edit Event</h2>
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
  );
}

