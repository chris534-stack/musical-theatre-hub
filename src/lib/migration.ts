/**
 * One-time migration script to move data from Supabase to Firebase Firestore.
 * This script is tailored to the specific schemas of the source and destination.
 *
 * To run this script:
 * 1. Fill in the environment variables in your .env file:
 *    - SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 *    - FIREBASE_ADMIN_PROJECT_ID
 *    - FIREBASE_ADMIN_CLIENT_EMAIL
 *    - FIREBASE_ADMIN_PRIVATE_KEY
 * 2. IMPORTANT: If re-running for a specific collection, delete it from Firestore first.
 * 3. Run the script from your terminal: `npm run migrate`
 */

import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// --- Configuration ---
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error("Missing required environment variables for migration. Please check your .env file.");
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newline characters
    }),
  });
} catch (error: any) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Firebase Admin initialization error:', error);
    process.exit(1);
  }
}
const firestore = admin.firestore();

/**
 * Fetches all records from a Supabase table.
 * @param tableName The name of the Supabase table.
 */
async function fetchFromSupabase(tableName: string): Promise<any[]> {
  console.log(`Fetching data from Supabase table: '${tableName}'...`);
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    throw new Error(`Error fetching from Supabase table ${tableName}: ${error.message}`);
  }
  console.log(`Successfully fetched ${data?.length || 0} records from '${tableName}'.`);
  return data || [];
}

/**
 * Migrates venues from Supabase to Firestore.
 */
async function migrateVenues() {
  const venues = await fetchFromSupabase('venues');
  const collectionRef = firestore.collection('venues');
  const batch = firestore.batch();

  const venueColors = [
      'hsl(262, 47%, 50%)', // Muted Purple
      'hsl(217, 56%, 51%)', // Strong Blue
      'hsl(170, 45%, 45%)', // Teal
      'hsl(350, 60%, 55%)', // Muted Red/Pink
      'hsl(24, 84%, 55%)',  // Orange
      'hsl(195, 53%, 45%)', // Cerulean
      'hsl(100, 35%, 45%)', // Muted Green
      'hsl(30, 55%, 50%)'   // Brownish Orange
  ];
  let colorIndex = 0;

  console.log(`Transforming and batching ${venues.length} venue records for Firestore...`);
  venues.forEach(venue => {
    const docRef = collectionRef.doc(String(venue.id));
    const firestoreVenue = {
      id: String(venue.id),
      name: venue.name,
      // address and contact_email are ignored as they are not in the new schema.
      // A specific color is added as it's required by the new UI.
      color: venueColors[colorIndex % venueColors.length],
    };
    batch.set(docRef, firestoreVenue);
    colorIndex++;
  });

  await batch.commit();
  console.log(`Successfully wrote ${venues.length} records to Firestore 'venues' collection.`);
}

/**
 * Migrates events from Supabase to Firestore, grouping occurrences.
 */
async function migrateEvents() {
  const events = await fetchFromSupabase('events');
  const collectionRef = firestore.collection('events');
  const batch = firestore.batch();
  let firestoreEventCount = 0;

  console.log(`Transforming and batching ${events.length} event records for Firestore...`);

  for (const event of events) {
    const occurrencesSource = event.event_occurrences || event.dates || [];
    
    const occurrences = Array.isArray(occurrencesSource) ? occurrencesSource.map((occ: any) => {
        let date = '';
        try {
            if (occ.date) {
                // Just validate and format, don't create a new Date() object here
                // to avoid timezone issues on the server running the script.
                const d = new Date(occ.date);
                if (!isNaN(d.getTime())) {
                     date = d.toISOString().split('T')[0]; // Format to YYYY-MM-DD
                }
            }
        } catch(e) { /* ignore invalid dates */ }

        // A time is not required for an occurrence to be valid
        return {
            date: date,
            time: occ.time || ''
        }
    }).filter((occ: any) => occ.date) : []; // Only keep occurrences that have a valid date

    if (occurrences.length > 0) {
        const newDocRef = collectionRef.doc(); // Firestore generates a new unique ID
        const firestoreEvent = {
            id: newDocRef.id,
            title: event.title,
            description: event.description || '',
            occurrences: occurrences,
            venueId: String(event.venue_id),
            type: event.category || 'Special Event',
            status: 'approved', // Default old events to approved
            url: event.ticket_link || '',
        };
        batch.set(newDocRef, firestoreEvent);
        firestoreEventCount++;
    } else {
        console.warn(`Skipping event '${event.title}' with no valid occurrences.`);
    }
  }

  await batch.commit();
  console.log(`Successfully wrote ${firestoreEventCount} event records to Firestore 'events' collection.`);
}

/**
 * Main migration function.
 * IMPORTANT: This script is now configured to ONLY migrate events.
 * Before running, be sure to delete the existing 'events' collection in Firestore.
 */
async function migrate() {
  console.log("Starting Supabase to Firestore migration...");
  try {
    // To re-migrate venues, uncomment the line below and delete the 'venues' collection in Firestore.
    // await migrateVenues();
    
    console.log("Migrating events with updated occurrence logic...");
    await migrateEvents();
    
    console.log("\nMigration completed successfully! 🎉");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrate();
