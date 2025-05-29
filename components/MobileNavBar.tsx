import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaCalendarAlt, FaUsers, FaNewspaper, FaUserPlus, FaHome } from 'react-icons/fa';
import styles from './MobileNavBar.module.css';

const navItems = [
  { href: '/', label: 'Home', icon: <FaHome /> },
  { href: '/calendar', label: 'Calendar', icon: <FaCalendarAlt /> },
  { href: '/get-involved', label: 'Involved', icon: <FaUserPlus /> },
  { href: '/community', label: 'Community', icon: <FaUsers /> },
  { href: '/news', label: 'News', icon: <FaNewspaper /> },
];

const MobileNavBar: React.FC = () => {
  const router = useRouter();
  
  // Check if current page is the Green Room Guild page
  const isGreenRoomGuildPage = router.pathname === '/greenroomguild';
  
  // Green styling for GRG page
  const navBarStyle = isGreenRoomGuildPage ? {
    background: 'linear-gradient(90deg, #2e7d32 60%, #4caf50 100%)',
    boxShadow: '0 -2px 10px rgba(46, 125, 50, 0.1)',
    transition: 'background 0.5s ease-in-out'
  } : {};
  return (
    <nav className={styles.mobileNavBar} style={navBarStyle}>
      {navItems.map(item => (
        <Link href={item.href} key={item.href} legacyBehavior>
          <a 
            className={router.pathname === item.href ? styles.active : ''}
            style={isGreenRoomGuildPage && router.pathname === item.href ? { color: '#8bc34a' } : {}}
          >
            {item.icon}
            <span className={styles.label}>{item.label}</span>
          </a>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNavBar;
