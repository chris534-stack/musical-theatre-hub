import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const eventsPath = path.join(process.cwd(), 'data', 'events.json');
  try {
    const file = fs.readFileSync(eventsPath, 'utf8');
    const events = JSON.parse(file);
    const event = req.body;
    // Add a slug if not present (slugified title, no date)
    if (!event.slug) {
      event.slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    // Prevent duplicate for same date/slug
    const exists = events.some((e: any) => e.slug === event.slug && e.date === event.date);
    if (!exists) {
      events.push(event);
    }
    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf8');
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: 'Could not add event.' });
  }
}
