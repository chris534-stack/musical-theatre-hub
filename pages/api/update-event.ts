import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import { requireAdmin } from '../../utils/isAdmin';

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

  // Admin check
  const isAdmin = await requireAdmin(req, res);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  try {
    const updatedEvent = req.body;
    if (!updatedEvent.time) {
      return res.status(400).json({ error: 'Missing time for event update.' });
    }
    // Find the original event
    const snapshot = await db.collection('events')
      .where('slug', '==', updatedEvent.originalSlug)
      .where('date', '==', updatedEvent.originalDate)
      .where('time', '==', updatedEvent.originalTime)
      .get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Event not found for update.' });
    }
    // Remove original* keys from updatedEvent before merging
    const { originalSlug, originalDate, originalTime, ...rest } = updatedEvent;
    // Update all matched docs (should only be one, but batch for safety)
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.update(doc.ref, rest));
    await batch.commit();
    res.status(200).json({ success: true, event: updatedEvent });
  } catch (err) {
    res.status(500).json({ error: 'Could not update event.' });
  }
}
