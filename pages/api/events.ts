import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const eventsPath = path.join(process.cwd(), 'data', 'events.json');
  try {
    const file = fs.readFileSync(eventsPath, 'utf8');
    const events = JSON.parse(file);
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: 'Could not load events.' });
  }
}
