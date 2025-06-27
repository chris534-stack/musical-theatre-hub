import type { Venue } from '@/lib/types';
import { VenueCard } from './VenueCard';

export function VenueManager({ venues }: { venues: Venue[] }) {
  // Sort venues alphabetically by name
  const sortedVenues = [...venues].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
      {sortedVenues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
