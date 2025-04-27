import { useRouter } from 'next/router';
import Head from 'next/head';
import useSWR from 'swr';
import useIsAdmin from '../../components/useIsAdmin';
import React, { useState } from 'react';
import moment from 'moment';
import { FaEdit } from 'react-icons/fa';
import EditEventModal from '../../components/EditEventModal';
import EditPerformanceModal from '../../components/EditPerformanceModal';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EventDetail() {
  const [editingPerformance, setEditingPerformance] = useState<any | null>(null);
  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();
  const { slug, venue } = router.query;
  const isAdmin = useIsAdmin();
  const { data: events, error, isLoading } = useSWR('/api/events', fetcher);
  const [photos, setPhotos] = useState<string[]>([]); // In production, fetch from API or storage

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading event data.</p>;
  if (!events) return null;

  let showEvents = events.filter((e: any) => e.slug === slug);
  let venueName = venue ? decodeURIComponent(venue as string) : undefined;
  if (venueName) {
    showEvents = showEvents.filter((e: any) => e.venue === venueName);
  }
  if (showEvents.length === 0) {
    return <p>Event not found.</p>;
  }
  const event = showEvents[0];

  return (
    <>
      <Head>
        <title>{event.title} | Eugene Musical Theatre Hub</title>
      </Head>
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1>{event.title}</h1>
        <p><strong>Venue:</strong> {event.venue}</p>
        <p><strong>Description:</strong> {event.description}</p>
        {event.director && <p><strong>Director:</strong> {event.director}</p>}
        {event.cast && <p><strong>Cast:</strong> {event.cast}</p>}
        {event.ticketLink && (
          <div style={{ margin: '18px 0' }}>
            <a
              href={event.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#1976d2',
                color: 'white',
                fontWeight: 600,
                padding: '12px 28px',
                borderRadius: 6,
                fontSize: 18,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
                transition: 'background 0.2s',
              }}
            >
              Buy Tickets
            </a>
          </div>
        )}
        <h2 style={{ marginTop: 30 }}>
          {event.category === 'performance' && 'Show Dates & Times'}
          {event.category === 'audition' && 'Audition Date & Time'}
          {event.category === 'workshop' && 'Workshop Date & Time'}
          {event.category !== 'performance' && event.category !== 'audition' && event.category !== 'workshop' && 'Event Dates & Times'}
        </h2>

        <ul>
  {event.dates && event.dates.length > 0 ? (
    event.dates
      .slice()
      .sort((a: { date: string; time?: string }, b: { date: string; time?: string }) => {
        const dateA = new Date(a.date + 'T' + (a.time ? a.time : '00:00'));
        const dateB = new Date(b.date + 'T' + (b.time ? b.time : '00:00'));
        return dateA.getTime() - dateB.getTime();
      })
      .map((show: { date: string; time?: string; isMatinee?: boolean }, idx: number) => {
        let dateTimeStr = show.date;
        if (show.time && /^\d{1,2}:\d{2}$/.test(show.time.trim())) {
          dateTimeStr += 'T' + show.time.trim();
        }
        const m = moment(dateTimeStr, moment.ISO_8601, true);
        const isValid = m.isValid();
        return (
          <li key={show.date + (show.time || '') + idx}>
            <span>
              <strong>{isValid ? m.format('MMMM Do, YYYY') : 'TBA'}</strong>
              {isValid && show.time ? ` @ ${m.format('h:mm a')}` : ''}
              {show.isMatinee && (
                <span style={{ color: '#b36b00', marginLeft: 8, fontWeight: 600 }} title="Matinee">(Matinee)</span>
              )}
            </span>
          </li>
        );
      })
  ) : (
    <li>No dates available.</li>
  )}
</ul>
        {editingPerformance && (
          <EditPerformanceModal
            show={editingPerformance}
            onClose={() => setEditingPerformance(null)}
            onUpdated={() => { setEditingPerformance(null); window.location.reload(); }}
          />
        )}
        {isAdmin && (
  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
    <button
      style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 4, cursor: 'pointer' }}
      onClick={async () => {
        if (!window.confirm('Are you sure you want to remove all performances for this event?')) return;
        await fetch('/api/remove-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: event.slug })
        });
        window.location.reload();
      }}
    >
      Remove Event
    </button>
  </div>
)}
        


        <h2 style={{ marginTop: 30 }}>Production Photos</h2>
        {photos.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic', marginBottom: 12 }}>
            No photos available yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {photos.map((url, i) => (
              <img key={i} src={url} alt={`Production photo ${i+1}`} style={{ width: 180, borderRadius: 8 }} />
            ))}
          </div>
        )}
        {isAdmin && (
          <div style={{ marginTop: 16 }}>
            <label style={{ fontWeight: 500 }}>
              Add Production Photos:
              <input type="file" accept="image/*" multiple style={{ marginLeft: 12 }} onChange={e => {
                // Placeholder: In production, upload to backend or storage and update state
                const files = e.target.files;
                if (!files) return;
                const newPhotos: string[] = [];
                for (let i = 0; i < files.length; i++) {
                  newPhotos.push(URL.createObjectURL(files[i]));
                }
                setPhotos([...photos, ...newPhotos]);
              }} />
            </label>
            <div style={{ fontSize: 12, color: '#888' }}>
              (Photos will only persist until page reload. For real uploads, connect to backend or storage.)
            </div>
          </div>
        )}
      </main>
    </>
  );
}
