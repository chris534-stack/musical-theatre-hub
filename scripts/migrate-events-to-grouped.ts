import fs from 'fs';
import path from 'path';

type FlatEvent = {
  slug: string;
  title: string;
  category: string;
  date: string;
  time?: string;
  venue: string;
  description?: string;
  director?: string;
  ticketLink?: string;
  isMatinee?: boolean;
  [key: string]: any;
};

type GroupedEvent = {
  slug: string;
  title: string;
  category: string;
  venue: string;
  description?: string;
  director?: string;
  ticketLink?: string;
  cast?: string;
  dates: Array<{
    date: string;
    time?: string;
    isMatinee?: boolean;
    ticketLink?: string;
  }>;
  [key: string]: any;
};

const flatPath = path.join(__dirname, '../data/events.json');
const groupedPath = path.join(__dirname, '../data/events_grouped.json');

const raw = fs.readFileSync(flatPath, 'utf8');
const flatEvents: FlatEvent[] = JSON.parse(raw);

// Group by title, venue, category (and optionally director, description, etc.)
const groupKey = (e: FlatEvent) => [
  e.title,
  e.venue,
  e.category,
  e.description || '',
  e.director || '',
  e.cast || '',
].join('||');

const grouped: Record<string, GroupedEvent> = {};

for (const ev of flatEvents) {
  const key = groupKey(ev);
  if (!grouped[key]) {
    grouped[key] = {
      slug: ev.slug.replace(/-\d{4}-\d{2}-\d{2}$/, ''), // Remove date from slug if present
      title: ev.title,
      category: ev.category,
      venue: ev.venue,
      description: ev.description,
      director: ev.director,
      ticketLink: ev.ticketLink,
      cast: ev.cast,
      dates: [],
    };
  }
  grouped[key].dates.push({
    date: ev.date,
    time: ev.time,
    isMatinee: ev.isMatinee,
  });
}

// Sort dates in each group
for (const key in grouped) {
  grouped[key].dates.sort((a, b) => (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1);
}

const groupedArr = Object.values(grouped);
fs.writeFileSync(groupedPath, JSON.stringify(groupedArr, null, 2), 'utf8');

console.log(`Migrated ${flatEvents.length} events into ${groupedArr.length} grouped events.`);
