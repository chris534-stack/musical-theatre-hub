// Shared fuzzy grouping logic for venues

export function normalizeVenue(venue: string) {
  return venue.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ');
}

export function levenshtein(a: string, b: string): number {
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

// Returns: Array of groups, each group is an array of similar venues
export function groupSimilarVenuesFull(venues: string[]): string[][] {
  const groups: string[][] = [];
  venues.forEach((venue) => {
    const norm = normalizeVenue(venue);
    let found = false;
    for (const group of groups) {
      if (levenshtein(norm, normalizeVenue(group[0])) <= 2) {
        group.push(venue);
        found = true;
        break;
      }
    }
    if (!found) groups.push([venue]);
  });
  return groups;
}

// Returns canonical venue names (first in each group)
export function getCanonicalVenues(venues: string[]): string[] {
  return groupSimilarVenuesFull(venues).map(group => group[0]);
}

// Given a canonical venue, returns all venues in its group
export function getVenuesForCanonical(venues: string[], canonical: string): string[] {
  const groups = groupSimilarVenuesFull(venues);
  const group = groups.find(g => g.includes(canonical));
  return group || [canonical];
}
