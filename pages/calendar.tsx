import Head from 'next/head';
import dynamic from 'next/dynamic';
import groupedEvents from '../data/events_grouped.json'; // TEMP: fallback to static events
import { useState, useMemo, useEffect } from 'react';
// import useSWR, { mutate } from 'swr';
import DatePicker from 'react-multi-date-picker';
import AdminModal from '../components/AdminModal';
import useIsAdmin from '../components/useIsAdmin';
import EventFilterSidebar from '../components/EventFilterSidebar';
import { getCanonicalVenues, getVenuesForCanonical } from '../components/venueFuzzyGroup';

// const fetcher = (url: string) => fetch(url).then(res => res.json());

import AddEventModal from '../components/AddEventModal';

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

function useMobileOrAdjacent(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function check() {
      setIsMobile(window.matchMedia('(max-width: 600px)').matches);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function CalendarPage() {
  const isAdmin = useIsAdmin();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const isMobile = useMobileOrAdjacent(); // Use static events from JSON backup
  const events = groupedEvents; // Now loads from static JSON

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

  if (!events) return null;

  return (
    <>
      <Head>
        <title>Events Calendar | Our Stage, Eugene</title>
      </Head>
      <main style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginTop: 24, position: 'relative' }}>
        {/* Sticky sidebar on desktop */}
        {!isMobile && (
          <div
            style={{
              minWidth: 240,
              maxWidth: 260,
              width: 100,
              alignSelf: 'flex-start',
              position: 'sticky',
              top: 78, // below header
              zIndex: 10,
              height: 'fit-content',
            }}
          >
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
        )}
        {isMobile && (
          <AdminModal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} title="Filter Events">
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
          </AdminModal>
        )}
        {/* Main calendar pane: allow this to scroll vertically if needed */}
        <div style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
          {isMobile ? (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              zIndex: 1100,
              background: '#fff',
              boxShadow: '0 2px 8px 0 rgba(46,58,89,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 1.1rem 0.6rem 1.1rem',
            }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#2e3a59' }}>Events Calendar</h1>
              <button
                aria-label="Show filters"
                style={{
                  background: '#ffd700',
                  color: '#2e3a59',
                  border: 'none',
                  borderRadius: 16,
                  padding: '0.55rem 0.85rem',
                  fontSize: '1.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 1px 4px 0 rgba(46,58,89,0.10)',
                  cursor: 'pointer',
                  marginLeft: 0,
                  marginRight: 18,
                  marginTop: 8,
                }}
                onClick={() => setFilterModalOpen(true)}
              >
                <span style={{ fontSize: 22, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>☰</span>
              </button>
            </div>
          ) : (
            <h1 style={{
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              background: '#fff',
              margin: 0,
              fontSize: '2.1rem',
              fontWeight: 900,
              color: '#2e3a59',
              padding: '1.1rem 0 0.7rem 0',
              boxShadow: '0 2px 8px 0 rgba(46,58,89,0.07)'
            }}>Events Calendar</h1>
          )}
          <div style={isMobile ? { marginTop: 68 } : {}}>
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
            <Calendar events={events || []} />
            {isAdmin && (
              <AddEventModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={() => {
                  setModalOpen(false);
                }}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
