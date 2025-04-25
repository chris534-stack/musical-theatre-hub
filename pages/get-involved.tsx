import Head from 'next/head';

import { GetServerSideProps } from 'next';

interface Event {
  title: string;
  date: string;
  category: string;
  venue?: string;
  [key: string]: any;
}

export default function GetInvolved({ auditions }: { auditions: Event[] }) {
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
                  const d = new Date(event.date + (event.time ? 'T' + event.time : ''));
                  const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                  const timeStr = event.time ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
                })()}
              </li>
            ))}
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
