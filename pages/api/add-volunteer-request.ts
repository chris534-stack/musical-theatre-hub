import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const VOLUNTEER_FILE = path.join(process.cwd(), 'data', 'volunteer-requests.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = req.body;
      let requests = [];
      if (fs.existsSync(VOLUNTEER_FILE)) {
        const raw = fs.readFileSync(VOLUNTEER_FILE, 'utf-8');
        requests = JSON.parse(raw || '[]');
      }
      // Prevent duplicate: check if an identical request exists (excluding id)
      const isDuplicate = requests.some((r: any) =>
        r.venue === data.venue &&
        r.expertise === data.expertise &&
        r.description === data.description &&
        JSON.stringify(r.dates || []) === JSON.stringify(data.dates || []) &&
        r.timeCommitment === data.timeCommitment
      );
      if (!isDuplicate) {
        requests.push({ ...data, id: Date.now() });
        fs.writeFileSync(VOLUNTEER_FILE, JSON.stringify(requests, null, 2));
        res.status(200).json({ success: true });
      } else {
        res.status(200).json({ success: false, duplicate: true });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to save volunteer request' });
    }
  } else if (req.method === 'GET') {
    try {
      let requests = [];
      if (fs.existsSync(VOLUNTEER_FILE)) {
        const raw = fs.readFileSync(VOLUNTEER_FILE, 'utf-8');
        requests = JSON.parse(raw || '[]');
      }
      res.status(200).json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Failed to load volunteer requests' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
