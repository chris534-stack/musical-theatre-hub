import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { slug, date, time } = req.body;
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug.' });
  }

  const eventsPath = path.join(process.cwd(), 'data', 'events.json');
  try {
    const file = fs.readFileSync(eventsPath, 'utf8');
    let events = JSON.parse(file);
    const initialLength = events.length;
    // Remove logic:
    // If only slug: remove all events with that slug
    // If slug+date: remove all events with that slug and date
    // If slug+date+time: remove only that event
    if (slug && !date && !time) {
      events = events.filter((e: any) => e.slug !== slug);
    } else if (slug && date && !time) {
      events = events.filter((e: any) => !(e.slug === slug && e.date === date));
    } else if (slug && date && time) {
      events = events.filter((e: any) => !(e.slug === slug && e.date === date && e.time === time));
    } else {
      return res.status(400).json({ error: 'Invalid parameters.' });
    }
    if (events.length === initialLength) {
      return res.status(404).json({ error: 'Event(s) not found.' });
    }
    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf8');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove event.' });
  }
}
