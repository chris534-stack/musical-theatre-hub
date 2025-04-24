import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>Eugene Musical Theatre Community Hub</title>
        <meta name="description" content="Centralized hub for Eugene musical theatre events, auditions, and community." />
      </Head>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Eugene Musical Theatre Community Hub</h1>
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
            <div className={styles.eventCard}>
              <h3>Into the Woods</h3>
              <p>Performance · May 10-12 · Hult Center</p>
              <Link href="/events/into-the-woods">Details</Link>
            </div>
            <div className={styles.eventCard}>
              <h3>Chicago (Audition)</h3>
              <p>Audition · May 20 · Actors Cabaret</p>
              <Link href="/events/chicago-audition">Details</Link>
            </div>
            <div className={styles.eventCard}>
              <h3>Stagecraft Basics Workshop</h3>
              <p>Workshop · May 25 · OCT</p>
              <Link href="/events/stagecraft-workshop">Details</Link>
            </div>
          </div>
        </section>
        <section className={styles.quickLinks}>
          <h2>Get Involved</h2>
          <div className={styles.linksRow}>
            <Link href="/get-involved" className={styles.linkCard}>Auditions & Volunteering</Link>
            <Link href="/community" className={styles.linkCard}>Join the Community</Link>
            <Link href="/news" className={styles.linkCard}>Read the Latest News</Link>
          </div>
        </section>
      </main>
    </>
  );
}
