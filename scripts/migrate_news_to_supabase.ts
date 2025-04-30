import path from 'path';
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Path to your Firebase news export (adjust as needed)
const newsPath = path.resolve(__dirname, '../data/news_export.json');
const eventsPath = path.resolve(__dirname, '../data/events_grouped.json');

// Load news and events data
const newsData = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

// Helper: Find event_id by matching event title (case-insensitive, trimmed)
function findEventIdForNews(newsTitle: string): number | null {
  if (!newsTitle) return null;
  const lowerTitle = newsTitle.trim().toLowerCase();
  const match = eventsData.find((ev: any) => ev.title.trim().toLowerCase() === lowerTitle);
  return match ? match.id : null;
}

(async () => {
  for (const n of newsData) {
    // Convert timestamp to ISO string if needed
    let timestamp = n.timestamp;
    if (timestamp && !/\d{4}-\d{2}-\d{2}T/.test(timestamp)) {
      const d = new Date(timestamp);
      timestamp = d.toISOString();
    }

    // Try to match event
    const event_id = findEventIdForNews(n.title);

    const { error } = await supabase.from('news').insert([
      {
        title: n.title,
        description: n.description,
        image: n.image,
        source: n.source,
        url: n.url,
        timestamp,
        event_id,
      },
    ]);
    if (error) {
      console.error(`Failed to insert news: ${n.title}`, error.message);
    } else {
      console.log(`Inserted news: ${n.title}`);
    }
  }
  console.log('News migration complete.');
})();
