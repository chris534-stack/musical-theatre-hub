// scripts/importEvents.js
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Path to your service account key JSON file
const serviceAccount = require('./our-stage-eugene-firebase-adminsdk-fbsvc-06c2558920.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Path to events_grouped.json
const events = require('../data/events_grouped.json');

async function importEvents() {
  for (const event of events) {
    // Use slug as document ID, or generate a new one
    const docId = event.slug || db.collection('events').doc().id;
    await db.collection('events').doc(docId).set(event, { merge: true });
    console.log(`Imported: ${event.title}`);
  }
  console.log('All events imported!');
}

importEvents().catch(console.error);
