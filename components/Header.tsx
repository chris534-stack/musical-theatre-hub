import Link from 'next/link';
import React from 'react';
import styles from './Header.module.css';

const Header: React.FC = () => (
  <header className={styles.header}>
    <div className={styles.logoNav}>
      <Link href="/" className={styles.logo}>
        Eugene Musical Theatre Hub
      </Link>
      <nav className={styles.nav}>
        <Link href="/calendar" className={styles.navLink}>Calendar</Link>
        <Link href="/get-involved" className={styles.navLink}>Get Involved</Link>
        <Link href="/community" className={styles.navLink}>Community</Link>
        <Link href="/news" className={styles.navLink}>News</Link>
        <Link href="/about" className={styles.navLink}>About Us</Link>
      </nav>
    </div>
  </header>
);

export default Header;
