import React from 'react';
import moment from 'moment';
import { EventType } from './CalendarView';

interface OverlayTapListenersProps {
  date: Date;
  setModalDate: (d: Date) => void;
  setModalOpen: (open: boolean) => void;
  events: EventType[];
  setModalEvents: (evs: EventType[]) => void;
}

// This overlay covers each day cell in the month view with a transparent tap area
const OverlayTapListeners: React.FC<OverlayTapListenersProps> = ({ date, setModalDate, setModalOpen, events, setModalEvents }) => {
  // Get start of current month
  const start = moment(date).startOf('month');
  const end = moment(date).endOf('month');
  const days: Date[] = [];
  let d = start.clone();
  while (d.isSameOrBefore(end, 'day')) {
    days.push(d.toDate());
    d.add(1, 'day');
  }

  // react-big-calendar always renders 6 rows (42 cells)
  // Find the first visible cell in the grid (start of the week containing the first day of the month)
  const firstVisible = start.clone().startOf('week');
  const gridDays: Date[] = [];
  let gridDay = firstVisible.clone();
  for (let i = 0; i < 42; i++) {
    gridDays.push(gridDay.toDate());
    gridDay.add(1, 'day');
  }

  // Overlay grid matches calendar grid exactly
  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: 'repeat(6, 1fr)',
        width: '100%', height: '100%',
      }}>
        {gridDays.map((day, idx) => (
          <div
            key={idx}
            style={{
              pointerEvents: 'auto',
              width: '100%', height: '100%',
              background: 'transparent',
              touchAction: 'manipulation',
            }}
            onClick={() => {
              const eventsForDay = events.filter(ev => moment(ev.date).isSame(moment(day), 'day'));
              setModalDate(day);
              setModalEvents(eventsForDay);
              setModalOpen(true);
            }}
            aria-label={`Open events for ${moment(day).format('MMMM D, YYYY')}`}
          />
        ))}
      </div>
    </div>
  );
};

export default OverlayTapListeners;
