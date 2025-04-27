import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  const eventsPath = path.join(process.cwd(), 'data', 'events_grouped.json');
  try {
    const file = fs.readFileSync(eventsPath, 'utf8');
    const events = JSON.parse(file);
    const now = new Date();
    // Only return audition events with date >= now
    const auditions = events.filter((e: any) =>
      e.category && e.category.toLowerCase() === 'audition' &&
      Array.isArray(e.dates) && e.dates.some((d: any) => new Date(d.date) >= now)
    ).map((e: any) => {
      // Pick the soonest future date for display
      const futureDates = e.dates.filter((d: any) => new Date(d.date) >= now);
      const soonest = futureDates.length > 0 ? futureDates[0] : e.dates[0];
      return {
        title: e.title,
        venue: e.venue,
        date: soonest?.date,
        time: soonest?.time,
        category: e.category,
        description: e.description,
      };
    });
    res.status(200).json(auditions);
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(`[API] /api/auditions responded in ${duration}ms`);
  } catch (err) {
    res.status(500).json({ error: 'Could not load auditions.' });
  }
}
