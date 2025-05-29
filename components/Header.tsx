import Link from 'next/link';
import React from 'react';
import { useRouter } from 'next/router';
import styles from './Header.module.css';
import useIsReviewer from './useIsReviewer'; // Import the hook

const Header: React.FC = () => {
  const { isReviewer, loading } = useIsReviewer();
  const router = useRouter();
  
  // Check if current page is the Green Room Guild page
  const isGreenRoomGuildPage = router.pathname === '/greenroomguild';
  
  // Green styling for GRG page
  const headerStyle = isGreenRoomGuildPage ? {
    background: 'linear-gradient(90deg, #2e7d32 60%, #4caf50 100%)',
    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.08)',
    transition: 'background 0.5s ease-in-out, box-shadow 0.5s ease-in-out'
  } : {};
  
  const logoStyle = isGreenRoomGuildPage ? {
    color: 'white',
    transition: 'color 0.3s ease-in-out'
  } : {};
  
  const navLinkStyle = isGreenRoomGuildPage ? {
    color: 'white',
    transition: 'color 0.3s ease-in-out, background 0.3s ease-in-out'
  } : {};
  
  const navLinkHoverStyle = isGreenRoomGuildPage ? {
    background: '#8bc34a',
    color: '#1b5e20'
  } : {};

  return (
    <header className={styles.header} style={headerStyle}>
      <div className={styles.logoNav}>
        <Link href="/" className={styles.logo} style={logoStyle}>
          Our Stage, Eugene
        </Link>
        <nav className={styles.nav}>
          <Link href="/calendar" className={styles.navLink} style={navLinkStyle}>Calendar</Link>
          <Link href="/get-involved" className={styles.navLink} style={navLinkStyle}>Get Involved</Link>
          <Link href="/community" className={styles.navLink} style={navLinkStyle}>Community</Link>
          <Link href="/news" className={styles.navLink} style={navLinkStyle}>News</Link>
          <Link href="/about" className={styles.navLink} style={navLinkStyle}>About Us</Link>
          {!loading && isReviewer && (
            <Link href="/reviewer/dashboard" className={styles.navLink} style={navLinkStyle}>Reviewer Dashboard</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
