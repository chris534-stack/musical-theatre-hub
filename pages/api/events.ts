import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
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
  const start = Date.now();
  try {
    const snapshot = await db.collection('events').get();
    const events = snapshot.docs.map(doc => doc.data());
    res.status(200).json(events);
    const duration = Date.now() - start;
    console.log(`[API] /api/events (Firestore) responded in ${duration}ms`);
  } catch (err) {
    res.status(500).json({ error: 'Could not load events from Firestore.' });
  }
}
