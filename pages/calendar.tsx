import Head from 'next/head';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then(res => res.json());
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
      setIsMobile(window.innerWidth <= 768);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function CalendarPage() {
  const isMobile = useMobileOrAdjacent();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [dayEventsModalOpen, setDayEventsModalOpen] = useState(false);
  
  // Listen for the DayEventsModal open/close state
  useEffect(() => {
    const handleDayEventsModalState = (e: CustomEvent) => {
      setDayEventsModalOpen(e.detail.open);
    };
    
    // Custom event listener for DayEventsModal state changes
    window.addEventListener('dayEventsModalStateChange', handleDayEventsModalState as EventListener);
    
    return () => {
      window.removeEventListener('dayEventsModalStateChange', handleDayEventsModalState as EventListener);
    };
  }, []);
  const isAdmin = useIsAdmin();

  // Fetch events from Firestore
  const { data: events, error } = useSWR('/api/events', fetcher);
  useEffect(() => {
    if (error) console.error('SWR /api/events error:', error);
  }, [error]);

  // Dynamic filter state (future-proof)
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({
    category: [],
    venue: [],
    // tags: [], // Uncomment to support tags, etc.
  });

  // Extract filter options dynamically
  const filterOptions = useMemo(() => {
    if (!Array.isArray(events)) return {};
    const options: { [key: string]: string[] } = {};
    ['category', 'venue', 'tags'].forEach((key) => {
      let values: string[] = [];
      if (key === 'tags') {
        // Flatten all tags arrays
        values = Array.from(new Set(events.flatMap((e: any) => e.tags || [])));
      } else {
        values = Array.from(new Set(events.map((e: any) => e[key]).filter(Boolean)));
      }
      if (values.length > 0) options[key] = values;
    });
    return options;
  }, [events]);

  // Dynamic filtering logic
  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events.filter((event: any) => {
      return Object.entries(filters).every(([key, selected]) => {
        if (!selected.length) return true; // No filter set for this group
        if (Array.isArray(event[key])) {
          // e.g. tags: check for overlap
          return event[key].some((val: string) => selected.includes(val));
        }
        // Fuzzy venue grouping support
        if (key === 'venue' && selected.length > 0) {
          // If you want fuzzy grouping, implement here
          return selected.includes(event[key]);
        }
        return selected.includes(event[key]);
      });
    });
  }, [events, filters]);

  // Generic sidebar handler
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const prevArr = prev[key] || [];
      return {
        ...prev,
        [key]: prevArr.includes(value)
          ? prevArr.filter((v) => v !== value)
          : [...prevArr, value],
      };
    });
  };
  const handleSelectAll = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: filterOptions[key] || [] }));
  };
  const handleDeselectAll = (key: string) => {
    setFilters((prev) => ({ ...prev, [key]: [] }));
  };


  if (error) return <div style={{ color: 'red', padding: 16 }}>Error loading calendar: {error.message}</div>;
  if (!events) return <div style={{ padding: 16 }}>Loading calendar…</div>;

  return (
    <>
      <Head>
        <title>Events Calendar | Our Stage, Eugene</title>
      </Head>
      {/* Calendar content begins here */}
      <main
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          marginTop: 0,
          paddingTop: 0,
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Sticky sidebar on desktop */}
        {/* Render filter groups dynamically for future extensibility */}
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
            {Object.keys(filterOptions).map((key) => (
              <div key={key} style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#23395d', marginBottom: 10 }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </h3>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filters[key]?.length === filterOptions[key].length && filterOptions[key].length > 0}
                      ref={el => {
                        if (el) el.indeterminate = filters[key]?.length > 0 && filters[key]?.length < filterOptions[key].length;
                      }}
                      onChange={() => {
                        if (filters[key]?.length === filterOptions[key].length) {
                          handleDeselectAll(key);
                        } else {
                          handleSelectAll(key);
                        }
                      }}
                      style={{ marginRight: 8 }}
                    />
                    Select All
                  </label>
                </div>
                {filterOptions[key].map((option: string) => (
                  <label key={option} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 8, fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={filters[key]?.includes(option)}
                      onChange={() => handleFilterChange(key, option)}
                      style={{ marginRight: 8 }}
                    />
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
          {isMobile ? (
            <>
              {/* Mobile sticky header with filter button - hidden when day events modal is open */}
              {!dayEventsModalOpen && (
                <div className="mobileCalendarHeader" style={{
                  position: 'sticky',
                  zIndex: 10,
                  top: 0,
                  left: 0,
                  width: '100%',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(46,58,89,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 1.1rem 0.6rem 1.1rem',
                  marginBottom: '12px'
                }}>
                <h1 className="stickyCalendarHeader" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#2e3a59' }}>Events Calendar</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                      marginRight: 8,
                      marginTop: 8,
                    }}
                    onClick={() => setFilterModalOpen(true)}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>☰</span>
                  </button>
                </div>
                </div>
              )}
              {/* Render the calendar below the header on mobile - adjust margin when modal is open */}
              <div style={{ marginTop: dayEventsModalOpen ? -60 : 0 }}>
                <Calendar events={Array.isArray(filteredEvents) ? filteredEvents : (events || [])} />
              </div>
              {/* Floating Add Event Button (FAB) for mobile admins */}
              {isMobile && isAdmin && !modalOpen && (
                <button
                  onClick={() => setModalOpen(true)}
                  aria-label="Add Event"
                  style={{
                    position: 'fixed',
                    bottom: 80,
                    left: 20,
                    zIndex: 1201,
                    background: '#ffd700',
                    color: '#2e3a59',
                    border: 'none',
                    borderRadius: '50%',
                    width: 62,
                    height: 62,
                    boxShadow: '0 4px 16px 0 rgba(46,58,89,0.19)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 26,
                    cursor: 'pointer',
                    transition: 'background 0.18s',
                    outline: 'none',
                    borderColor: '#fff',
                    borderWidth: 2,
                  }}
                >
                  <span style={{ fontSize: 38, lineHeight: 1, marginBottom: 0 }}>+</span>
                  <span style={{ fontSize: 11, fontWeight: 700, marginTop: -2 }}>Add</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Desktop sticky header */}
              <div className="stickyCalendarHeader" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                zIndex: 10,
                position: 'relative',
                boxShadow: '0 2px 8px 0 rgba(46,58,89,0.07)',
                padding: '1.1rem 0 0.7rem 0',
                margin: 0
              }}>
                <h1 style={{
                  margin: 0,
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  color: '#2e3a59',
                }}>Events Calendar</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* No filter button on desktop */}
                  {isAdmin && (
                    <button
                      onClick={() => setModalOpen(true)}
                      style={{
                        background: '#ffd700',
                        color: '#2e3a59',
                        border: 'none',
                        borderRadius: 16,
                        padding: '0.55rem 1.1rem',
                        fontSize: '1.08rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 1px 4px 0 rgba(46,58,89,0.10)',
                        cursor: 'pointer',
                        marginLeft: 8,
                        marginRight: 18,
                        marginTop: 4
                      }}
                      aria-label="Add Event"
                    >
                      + Add Event
                    </button>
                  )}
                </div>
              </div>
              {/* Calendar for desktop */}
              <Calendar events={Array.isArray(filteredEvents) ? filteredEvents : (events || [])} />
              {console.log('DEBUG: filters', filters, 'filteredEvents', filteredEvents, 'events', events)}
            </>
          )}
          {isAdmin && (
            <AddEventModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              onSubmit={() => {
                setModalOpen(false);
              }}
            />
          )}
          {/* Mobile filter modal */}
          {isMobile && (
            <AdminModal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} title="Filter Events">
              {Object.keys(filterOptions).map((key) => (
                <div key={key} style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#23395d', marginBottom: 10 }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </h3>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontWeight: 600, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filters[key]?.length === filterOptions[key].length && filterOptions[key].length > 0}
                        ref={el => {
                          if (el) el.indeterminate = filters[key]?.length > 0 && filters[key]?.length < filterOptions[key].length;
                        }}
                        onChange={() => {
                          if (filters[key]?.length === filterOptions[key].length) {
                            handleDeselectAll(key);
                          } else {
                            handleSelectAll(key);
                          }
                        }}
                        style={{ marginRight: 8 }}
                      />
                      Select All
                    </label>
                  </div>
                  {filterOptions[key].map((option: string) => (
                    <label key={option} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 8, fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={filters[key]?.includes(option)}
                        onChange={() => handleFilterChange(key, option)}
                        style={{ marginRight: 8 }}
                      />
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </label>
                  ))}
                </div>
              ))}
            </AdminModal>
          )}
        </div>
      </main>
    </>
  );
}
