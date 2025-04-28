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

  const { slug, date, time } = req.body;
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug.' });
  }

  try {
    let queryRef = db.collection('events').where('slug', '==', slug);
    if (date) queryRef = queryRef.where('date', '==', date);
    if (time) queryRef = queryRef.where('time', '==', time);
    const snapshot = await queryRef.get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Event(s) not found.' });
    }
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not remove event.' });
  }
}
