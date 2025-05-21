import Link from 'next/link';
import React from 'react';
import styles from './Header.module.css';
import useIsReviewer from './useIsReviewer'; // Import the hook

const Header: React.FC = () => {
  const { isReviewer, loading } = useIsReviewer();

  return (
    <header className={styles.header}>
      <div className={styles.logoNav}>
        <Link href="/" className={styles.logo}>
          Our Stage, Eugene
        </Link>
        <nav className={styles.nav}>
          <Link href="/calendar" className={styles.navLink}>Calendar</Link>
          <Link href="/get-involved" className={styles.navLink}>Get Involved</Link>
          <Link href="/community" className={styles.navLink}>Community</Link>
          <Link href="/news" className={styles.navLink}>News</Link>
          <Link href="/about" className={styles.navLink}>About Us</Link>
          {!loading && isReviewer && (
            <Link href="/reviewer/dashboard" className={styles.navLink}>Reviewer Dashboard</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
