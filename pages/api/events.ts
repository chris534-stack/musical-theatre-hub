import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Debugging logs for env variables
console.log('---[Firebase Admin Debug]---');
console.log('FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
console.log('FIREBASE_ADMIN_PRIVATE_KEY length:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.length : 'undefined');
console.log('FIREBASE_ADMIN_PRIVATE_KEY preview:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.slice(0, 30) : 'undefined');
console.log('FIREBASE_ADMIN_PRIVATE_KEY end:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.slice(-30) : 'undefined');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('-----------------------------');

let db: Firestore;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Firebase Admin] Initialized successfully.');
  } else {
    console.log('[Firebase Admin] Already initialized.');
  }
  db = admin.firestore();
} catch (e) {
  console.error('[Firebase Admin Initialization Error]', e);
  throw e;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const start = Date.now();
  try {
    const snapshot = await db.collection('events').get();
    const events = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data());
    res.status(200).json(events);
    const duration = Date.now() - start;
    console.log(`[API] /api/events (Firestore) responded in ${duration}ms`);
  } catch (err) {
    res.status(500).json({ error: 'Could not load events from Firestore.' });
  }
}
