import React, { useMemo } from 'react';
import { getCanonicalVenues } from './venueFuzzyGroup';

export interface EventFilterSidebarProps {
  eventTypes: string[];
  venues: string[];
  selectedTypes: string[];
  selectedVenues: string[];
  onTypeChange: (type: string) => void;
  onVenueChange: (venue: string) => void;
  onTypeSelectAll: () => void;
  onTypeDeselectAll: () => void;
  onVenueSelectAll: () => void;
  onVenueDeselectAll: () => void;
}

// Helper: Normalize venue names for grouping
function normalizeVenue(venue: string) {
  return venue.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
}

// Helper: Fuzzy group venues
function groupSimilarVenues(venues: string[]): string[] {
  const groups: string[][] = [];
  venues.forEach((venue) => {
    const norm = normalizeVenue(venue);
    let found = false;
    for (const group of groups) {
      // Simple similarity: if normalized names are very close, group them
      if (levenshtein(norm, normalizeVenue(group[0])) <= 2) {
        group.push(venue);
        found = true;
        break;
      }
    }
    if (!found) groups.push([venue]);
  });
  // Use the most common/original name in each group
  return groups.map((group) => group[0]);
}

// Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const EventFilterSidebar: React.FC<EventFilterSidebarProps> = ({
  eventTypes,
  venues,
  selectedTypes,
  selectedVenues,
  onTypeChange,
  onVenueChange,
  onTypeSelectAll,
  onTypeDeselectAll,
  onVenueSelectAll,
  onVenueDeselectAll,
}) => {
  // Deduplicate and group similar venues
  const canonicalVenues = useMemo(() => getCanonicalVenues(venues), [venues]);

  return (
    <aside style={{ minWidth: 240, background: '#fafaff', borderRadius: 10, boxShadow: '0 2px 8px rgba(35,57,93,0.04)', padding: '1.5rem 1.2rem', marginRight: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#23395d', marginBottom: 10 }}>Event Type</h3>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 16 }}>
            <input type="checkbox" checked={selectedTypes.length === eventTypes.length && eventTypes.length > 0} onChange={onTypeSelectAll} /> Select All
          </label>
          <label>
            <input type="checkbox" checked={selectedTypes.length === 0} onChange={onTypeDeselectAll} /> Deselect All
          </label>
        </div>
        {eventTypes.map((type) => (
          <label key={type} style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => onTypeChange(type)}
              style={{ marginRight: 8 }}
            />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </label>
        ))}
      </div>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#23395d', marginBottom: 10 }}>Venue</h3>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 16 }}>
            <input type="checkbox" checked={selectedVenues.length === canonicalVenues.length && canonicalVenues.length > 0} onChange={onVenueSelectAll} /> Select All
          </label>
          <label>
            <input type="checkbox" checked={selectedVenues.length === 0} onChange={onVenueDeselectAll} /> Deselect All
          </label>
        </div>
        {canonicalVenues.map((venue) => (
          <label key={venue} style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={selectedVenues.includes(venue)}
              onChange={() => onVenueChange(venue)}
              style={{ marginRight: 8 }}
            />
            {venue}
          </label>
        ))}
      </div>
    </aside>
  );
};

export default EventFilterSidebar;
