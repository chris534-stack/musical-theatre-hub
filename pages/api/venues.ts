import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Returns a list of unique venues from all events in data/events.json
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const filePath = path.join(process.cwd(), 'data', 'events.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const events = JSON.parse(raw);
    const venues = Array.from(new Set(events.map((e: any) => e.venue).filter(Boolean)));
    res.status(200).json(venues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
}
