import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import AdminModal from '../components/AdminModal';
import useIsAdmin from '../components/useIsAdmin';
import EventFilterSidebar from '../components/EventFilterSidebar';
import { getCanonicalVenues, getVenuesForCanonical } from '../components/venueFuzzyGroup';

const fetcher = (url: string) => fetch(url).then(res => res.json());

import DatePicker from "react-multi-date-picker";
import MultiStepAddEventForm from '../components/MultiStepAddEventForm';

function AddEventForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [dates, setDates] = useState<any[]>([]); // array of Date objects
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('performance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const dateList = dates.map(d => d.format ? d.format("YYYY-MM-DD") : d.toISOString().slice(0,10));
    let allOk = true;
    for (const date of dateList) {
      const event = { title, date, time, venue, description, category };
      const res = await fetch('/api/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      if (!res.ok) allOk = false;
    }
    setLoading(false);
    if (allOk) {
      setTitle(''); setDates([]); setTime(''); setVenue(''); setDescription(''); setCategory('performance');
      onSuccess();
    } else {
      setError('Failed to add one or more events.');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} required type="text" placeholder="Event Title" style={{ padding: 8, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }} />
      <DatePicker
        multiple
        value={dates}
        onChange={setDates}
        format="YYYY-MM-DD"
        placeholder="Select dates"
        style={{ marginBottom: 8 }}
      />
      <input value={time} onChange={e => setTime(e.target.value)} required type="time" placeholder="Time" style={{ padding: 8, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }} />
      <input value={venue} onChange={e => setVenue(e.target.value)} required type="text" placeholder="Venue" style={{ padding: 8, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }} />
      <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Description" style={{ padding: 8, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', minHeight: 60 }} />
      <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: 8, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}>
        <option value="performance">Performance</option>
        <option value="audition">Audition</option>
        <option value="workshop">Workshop</option>
      </select>
      <button type="submit" disabled={loading} style={{ background: '#2e3a59', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', fontSize: '1rem', marginTop: 12, cursor: 'pointer' }}>{loading ? 'Adding...' : 'Submit'}</button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
        Select one or more dates above
      </div>
    </form>
  );
}


// Dynamically import react-big-calendar to avoid SSR issues
const Calendar = dynamic(() => import('../components/CalendarView'), { ssr: false });

export default function CalendarPage() {
  const isAdmin = useIsAdmin();
  const [modalOpen, setModalOpen] = useState(false);
  const { data: events, error, isLoading } = useSWR('/api/events', fetcher);

  // Multi-select filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);

  // Extract event types and venues
  const eventTypes = useMemo(() => {
    const types = Array.from(new Set((events || []).map((e: any) => e.category)));
    return types as string[];
  }, [events]);
  const venues = useMemo(() => {
    return Array.from(new Set((events || []).map((e: any) => e.venue))) as string[];
  }, [events]);

  // Filtering logic
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let venuesToMatch: string[] = [];
    if (selectedVenues.length > 0) {
      // For each selected canonical venue, get all fuzzy-matching venues
      selectedVenues.forEach((canonical) => {
        venuesToMatch.push(...getVenuesForCanonical(venues, canonical));
      });
      // Remove duplicates
      venuesToMatch = Array.from(new Set(venuesToMatch));
    }
    return events.filter((event: any) => {
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(event.category);
      const venueMatch = selectedVenues.length === 0 || venuesToMatch.includes(event.venue);
      return typeMatch && venueMatch;
    });
  }, [events, selectedTypes, selectedVenues, venues]);

  // Sidebar handlers
  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };
  const handleVenueChange = (venue: string) => {
    setSelectedVenues((prev) =>
      prev.includes(venue) ? prev.filter((v) => v !== venue) : [...prev, venue]
    );
  };

  if (isLoading) return <div>Loading events...</div>;
  if (error) return <div>Failed to load events.</div>;
  if (!events) return null;

  return (
    <>
      <Head>
        <title>Events Calendar | Eugene Musical Theatre Hub</title>
      </Head>
      <main style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginTop: 24 }}>
        <div style={{ minWidth: 240, maxWidth: 260, width: 100, height: '100%' }}>
          <EventFilterSidebar
            eventTypes={eventTypes}
            venues={venues}
            selectedTypes={selectedTypes}
            selectedVenues={selectedVenues}
            onTypeChange={handleTypeChange}
            onVenueChange={handleVenueChange}
            onTypeSelectAll={() => setSelectedTypes(eventTypes)}
            onTypeDeselectAll={() => setSelectedTypes([])}
            onVenueSelectAll={() => setSelectedVenues(getCanonicalVenues(venues))}
            onVenueDeselectAll={() => setSelectedVenues([])}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1>Events Calendar</h1>
          {isAdmin && (
            <button
              style={{
                background: '#ffd700',
                color: '#2e3a59',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1rem',
                marginBottom: 16,
                transition: 'background 0.2s, color 0.2s',
              }}
              onClick={() => setModalOpen(true)}
            >
              + Add Event
            </button>
          )}
          <Calendar events={filteredEvents} />
          {isAdmin && (
            <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Event">
              <MultiStepAddEventForm onSuccess={() => {
                setModalOpen(false);
                mutate('/api/events');
              }} />
            </AdminModal>
          )}
        </div>
      </main>
    </>
  );
}
