import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = require('../../scripts/our-stage-eugene-firebase-adminsdk-fbsvc-06c2558920.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
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
