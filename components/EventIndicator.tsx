import React from 'react';
import styles from './EventIndicator.module.css';

interface EventIndicatorProps {
  title: string;
  category?: string;
  eventCount?: number;
  bgColor: string;
  borderColor: string;
  textColor: string;
  showDetails?: boolean;
}

// Dot + text event indicator design
const EventIndicator: React.FC<EventIndicatorProps> = ({
  title,
  bgColor,
  borderColor,
  textColor
}) => {
  // Truncate long titles for mobile
  const displayTitle = title.length > 20 ? title.substring(0, 18) + '...' : title;
  
  return (
    <div 
      className={styles.eventIndicator}
      title={title}
    >
      <div 
        className={styles.colorDot}
        style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
      />
      <span 
        className={styles.eventTitle}
        style={{ color: textColor }}
      >
        {displayTitle}
      </span>
    </div>
  );
};

export default EventIndicator;
