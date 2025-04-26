import Head from 'next/head';
import { useState } from 'react';
import useSWR from 'swr';
import VolunteerRequestModal from '../components/VolunteerRequestModal';
import useIsAdmin from '../components/useIsAdmin';
import { GetServerSideProps } from 'next';

interface Event {
  title: string;
  date: string;
  category: string;
  venue?: string;
  [key: string]: any;
}

export default function GetInvolved({ auditions }: { auditions: Event[] }) {
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const { data: volunteerRequests = [], isLoading, mutate } = useSWR('/api/add-volunteer-request', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });
  const isAdmin = useIsAdmin();

  const handleDeleteVolunteer = async (id: number) => {
    await fetch('/api/delete-volunteer-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    mutate();
  };

  return (
    <>
      <Head>
        <title>Get Involved | Our Stage, Eugene</title>
      </Head>
      <main>
        <h1>Get Involved</h1>
        <ul>
          <li>Auditions: Find and submit audition opportunities.</li>
          <li>Volunteer: Join a production or help with events.</li>
          <li>Donate: Support local theatre organizations.</li>
        </ul>
        <h2>Upcoming Auditions</h2>
        {auditions.length === 0 ? (
          <p>No upcoming auditions at this time.</p>
        ) : (
          <ul>
            {auditions.map((event, idx) => (
              <li key={idx}>
                <strong>{event.title}</strong> at {event.venue || 'Unknown Venue'} on {(() => {
                  if (!event.date) return event.time || 'TBA';
                  const d = new Date(event.date + (event.time ? 'T' + event.time : ''));
                  const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                  const timeStr = event.time ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
                })()}
              </li>
            ))}
          </ul>
        )}

        <h2 style={{ marginTop: 32 }}>Volunteers Needed</h2>
        {isAdmin && (
          <>
            <button style={{ marginBottom: 16 }} onClick={() => setShowVolunteerModal(true)}>
              + Add Volunteer Request
            </button>
            <VolunteerRequestModal isOpen={showVolunteerModal} onClose={() => setShowVolunteerModal(false)} />
          </>
        )}
        {isLoading ? (
          <p>Loading volunteer requests...</p>
        ) : (
          <ul>
            {volunteerRequests.length === 0 ? (
              <li>No volunteer requests at this time.</li>
            ) : (
              volunteerRequests.map((req: any, idx: number) => (
                <li key={req.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
                  {isAdmin && (
                    <button
                      aria-label="Remove volunteer request"
                      style={{
                        color: '#fff',
                        background: '#E53E3E',
                        border: 'none',
                        borderRadius: '50%',
                        width: 26,
                        height: 26,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: 16,
                        lineHeight: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                        marginRight: 2,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.11)'
                      }}
                      onClick={() => handleDeleteVolunteer(req.id)}
                    >
                      ×
                    </button>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span><strong>{req.venue}</strong> - {req.description}</span>
                    <span><b>Expertise:</b> {req.expertise || 'Any'}</span>
                    <span><b>Dates Needed:</b> {req.dates && req.dates.length ? req.dates.join(', ') : 'TBA'}</span>
                    <span><b>Time Commitment:</b> {req.timeCommitment || 'TBA'}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/events`);
  const events: Event[] = await res.json();
  const now = new Date();
  const auditions = events.filter(e =>
    e.category && e.category.toLowerCase() === 'audition' &&
    new Date(e.date) >= now
  );
  return { props: { auditions } };
};
