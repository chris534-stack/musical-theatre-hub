// scripts/migrate-events-to-firestore.ts
// Migration script: Reads data/events.json and uploads to Firestore
// Usage: npx ts-node scripts/migrate-events-to-firestore.ts

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Path to your service account key
const serviceAccountPath = path.join(__dirname, 'our-stage-eugene-firebase-adminsdk-fbsvc-06c2558920.json');
const eventsJsonPath = path.join(__dirname, '../data/events.json');

// Load service account
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

// Read events from JSON
const events: any[] = JSON.parse(fs.readFileSync(eventsJsonPath, 'utf8'));

async function migrate() {
  const batch = db.batch();
  const eventsCol = db.collection('events');
  for (const event of events) {
    // Use slug as doc ID if available, otherwise auto-ID
    const docId = event.slug || eventsCol.doc().id;
    const docRef = eventsCol.doc(docId);
    batch.set(docRef, event);
  }
  await batch.commit();
  console.log(`Migrated ${events.length} events to Firestore.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
