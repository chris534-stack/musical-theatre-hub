import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import useSWR from 'swr';
import { useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function parseEventDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try ISO first
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  // Try US MM/DD/YYYY
  const usMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (usMatch) {
    d = new Date(`${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d;
  }
  // Try DD/MM/YYYY
  const euMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (euMatch) {
    d = new Date(`${euMatch[3]}-${euMatch[2].padStart(2, '0')}-${euMatch[1].padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function getUpcomingUniqueEvents(events: any[], now: Date, days: number) {
  const soon = new Date(now);
  soon.setDate(now.getDate() + days);
  const seen = new Set();
  const typePriority: Record<string, number> = {
    performance: 0,
    audition: 1,
    workshop: 2
  };
  const skipped: any[] = [];
  const filtered = events.filter(e => {
    if (!e.date) {
      skipped.push({ reason: 'missing date', event: e });
      return false;
    }
    const eventDate = parseEventDate(e.date);
    if (!eventDate) {
      skipped.push({ reason: 'invalid date', event: e });
      return false;
    }
    if (!(eventDate >= now && eventDate <= soon)) {
      skipped.push({ reason: 'out of range', event: e });
      return false;
    }
    e._parsedDate = eventDate;
    return true;
  });
  filtered.sort((a, b) => {
    const dateA = a._parsedDate.getTime();
    const dateB = b._parsedDate.getTime();
    if (dateA !== dateB) return dateA - dateB;
    const pa = typePriority[a.category?.toLowerCase() || 'other'] ?? 99;
    const pb = typePriority[b.category?.toLowerCase() || 'other'] ?? 99;
    return pa - pb;
  });
  const unique = filtered.filter(e => {
    const key = `${e.title}`.toLowerCase().trim() + '|' + `${e.venue}`.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique._skipped = skipped;
  return unique.slice(0, 3);
}

export default function Home() {
  const { data: events, error, isLoading } = useSWR('/api/events', fetcher);
  const now = useMemo(() => new Date(), []);
  const featuredEvents = useMemo(() => {
    if (!events) return [];
    return getUpcomingUniqueEvents(events, now, 30);
  }, [events, now]);

  // DEBUG: Show skipped events with reasons (only in dev)
  let skippedEvents: any[] = [];
  if (events && featuredEvents && (featuredEvents as any)._skipped) {
    skippedEvents = (featuredEvents as any)._skipped;
  }

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
          {/* DEBUG: Skipped Events */}
          {skippedEvents.length > 0 && process.env.NODE_ENV !== 'production' && (
            <div style={{ background: '#fffbe7', border: '1px solid #ffe082', borderRadius: 8, padding: 16, margin: '20px 0', color: '#b26a00', fontSize: 15 }}>
              <b>Debug: Skipped Events</b>
              <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none' }}>
                {skippedEvents.map((item, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>{item.reason}:</span> {item.event?.title || '(no title)'}
                    {item.event?.date && (
                      <span style={{ color: '#888', marginLeft: 8 }}>date: {item.event.date}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
