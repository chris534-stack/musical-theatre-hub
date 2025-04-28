import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const event = req.body;
    // Add a slug if not present
    if (!event.slug) {
      event.slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    // Prevent duplicate for same date/slug
    const snapshot = await db.collection('events')
      .where('slug', '==', event.slug)
      .where('date', '==', event.date)
      .get();
    if (!snapshot.empty) {
      return res.status(409).json({ error: 'Duplicate event for this date.' });
    }
    await db.collection('events').add(event);
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: 'Could not add event.' });
  }
}
