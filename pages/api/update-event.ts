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
    let events = JSON.parse(file);
    const updatedEvent = req.body;
    // Defensive: require time for update
    if (!updatedEvent.time) {
      return res.status(400).json({ error: 'Missing time for event update.' });
    }

    let found = false;
    events = events.map((e: any) => {
      if (
        e.slug === updatedEvent.originalSlug &&
        e.date === updatedEvent.originalDate &&
        e.time === updatedEvent.originalTime
      ) {
        found = true;
        // Remove original* keys from updatedEvent before merging
        const { originalSlug, originalDate, originalTime, ...rest } = updatedEvent;
        return { ...e, ...rest };
      }
      return e;
    });

    if (!found) {
      return res.status(404).json({ error: 'Event not found for update.' });
    }

    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2), 'utf8');
    res.status(200).json({ success: true, event: updatedEvent });
  } catch (err) {
    res.status(500).json({ error: 'Could not update event.' });
  }
}
