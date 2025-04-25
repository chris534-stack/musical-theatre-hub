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
  return (
    <nav className={styles.mobileNavBar}>
      {navItems.map(item => (
        <Link href={item.href} key={item.href} legacyBehavior>
          <a className={router.pathname === item.href ? styles.active : ''}>
            {item.icon}
            <span className={styles.label}>{item.label}</span>
          </a>
        </Link>
      ))}
    </nav>
  );
};

export default MobileNavBar;
