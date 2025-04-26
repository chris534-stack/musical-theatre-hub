import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import useSWR from 'swr';
import { useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function getUpcomingUniqueEvents(events: any[], now: Date, days: number) {
  // Only events within the next X days
  const soon = new Date(now);
  soon.setDate(now.getDate() + days);
  // Deduplicate by lowercased title+venue
  const seen = new Set();
  // Event type priority
  const typePriority: Record<string, number> = {
    performance: 0,
    audition: 1,
    workshop: 2
  };
  return events
    .filter(e => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      return eventDate >= now && eventDate <= soon;
    })
    .sort((a, b) => {
      // Soonest date first
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      // Then by event type priority
      const pa = typePriority[a.category?.toLowerCase() || 'other'] ?? 99;
      const pb = typePriority[b.category?.toLowerCase() || 'other'] ?? 99;
      return pa - pb;
    })
    .filter(e => {
      const key = `${e.title}`.toLowerCase().trim() + '|' + `${e.venue}`.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3); // Only top 3
}

export default function Home() {
  const { data: events, error, isLoading } = useSWR('/api/events', fetcher);
  const now = useMemo(() => new Date(), []);
  const featuredEvents = useMemo(() => {
    if (!events) return [];
    return getUpcomingUniqueEvents(events, now, 30);
  }, [events, now]);
  return (
    <>
      <Head>
        <title>Our Stage, Eugene</title>
        <meta name="description" content="Centralized hub for Eugene musical theatre events, auditions, and community." />
      </Head>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Our Stage, Eugene</h1>
            <p className={styles.heroSubtitle}>
              Your one-stop resource for performances, auditions, workshops, and community connections in Eugene, Oregon.
            </p>
            <Link href="/calendar" className={styles.ctaButton}>
              View Upcoming Events
            </Link>
          </div>
        </section>
        <section className={styles.features}>
          <h2>Featured This Month</h2>
          <div className={styles.featuredEvents}>
            {isLoading && <div>Loading featured events...</div>}
            {error && <div>Could not load events.</div>}
            {featuredEvents.length === 0 && !isLoading && !error && (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <strong>No upcoming events in the next 30 days.</strong>
                <br />
                <span style={{ fontSize: 14, color: '#888' }}>
                  {events && events.length === 0
                    ? 'Admin: Please add events to the calendar.'
                    : 'Check back soon!'}
                </span>
              </div>
            )}
            {featuredEvents.map(event => (
              <div className={styles.eventCard} key={event.slug}>
                <h3>{event.title}</h3>
                <div style={{ color: '#4b5d8c', fontSize: 16, marginBottom: 2 }}>{event.venue}</div>
                <div style={{ color: '#666', fontSize: 15, marginBottom: 6 }}>{(() => {
                  const d = new Date(event.date + (event.time ? 'T' + event.time : ''));
                  const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                  const timeStr = event.time ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';
                  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
                })()}</div>
                <Link href={`/events/${event.slug}`}>Details</Link>
              </div>
            ))}
          </div>
        </section>
        <section className={styles.quickLinks}>
          <h2>Get Involved</h2>
          <div className={styles.linksRow}>
            <Link href="/get-involved" className={styles.linkCard}>Auditions & Volunteering</Link>
            <Link href="/community" className={styles.linkCard}>Join the Community</Link>
            <Link href="/news" className={styles.linkCard}>Read the Latest News</Link>
            <Link href="/about" className={styles.linkCard}>About Us</Link>
          </div>
        </section>
      </main>
    </>
  );
}
