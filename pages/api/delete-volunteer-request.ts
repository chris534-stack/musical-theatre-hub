import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const VOLUNTEER_FILE = path.join(process.cwd(), 'data', 'volunteer-requests.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      let requests = [];
      if (fs.existsSync(VOLUNTEER_FILE)) {
        const raw = fs.readFileSync(VOLUNTEER_FILE, 'utf-8');
        requests = JSON.parse(raw || '[]');
      }
      const updated = requests.filter((r: any) => r.id !== id);
      fs.writeFileSync(VOLUNTEER_FILE, JSON.stringify(updated, null, 2));
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete volunteer request' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
