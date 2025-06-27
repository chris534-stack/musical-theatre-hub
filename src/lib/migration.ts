/**
 * One-time migration script to move data from Supabase to Firebase Firestore.
 *
 * To run this script:
 * 1. Fill in the environment variables in your .env file:
 *    - SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 *    - FIREBASE_ADMIN_PROJECT_ID
 *    - FIREBASE_ADMIN_CLIENT_EMAIL
 *    - FIREBASE_ADMIN_PRIVATE_KEY
 * 2. Run the script from your terminal: `npm run migrate`
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
async function fetchFromSupabase(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    throw new Error(`Error fetching from Supabase table ${tableName}: ${error.message}`);
  }
  return data || [];
}

/**
 * Writes data to a Firestore collection, using the provided id as the document ID.
 * @param collectionName The name of the Firestore collection.
 * @param data The array of data to write.
 */
async function writeToFirestore(collectionName: string, data: any[]) {
  const collectionRef = firestore.collection(collectionName);
  const batch = firestore.batch();

  console.log(`Preparing to write ${data.length} records to Firestore collection '${collectionName}'...`);

  data.forEach(item => {
    // Ensure there is an 'id' field to use as the document ID
    if (!item.id) {
        console.warn(`Skipping item without an ID in collection '${collectionName}':`, item);
        return;
    }
    const docRef = collectionRef.doc(String(item.id));
    batch.set(docRef, item);
  });

  await batch.commit();
  console.log(`Successfully wrote ${data.length} records to '${collectionName}'.`);
}

/**
 * Main migration function.
 */
async function migrate() {
  console.log("Starting Supabase to Firestore migration...");

  try {
    // --- Migrate Venues ---
    console.log("\nMigrating venues...");
    // NOTE: Replace 'venues' with your actual Supabase table name if different.
    const venues = await fetchFromSupabase('venues');
    // NOTE: The data structure is assumed to match the Firestore structure.
    // If transformation is needed, do it here before writing.
    await writeToFirestore('venues', venues);
    
    // --- Migrate Events ---
    console.log("\nMigrating events...");
    // NOTE: Replace 'events' with your actual Supabase table name if different.
    const events = await fetchFromSupabase('events');
    await writeToFirestore('events', events);
    
    // --- Migrate Ideas ---
    console.log("\nMigrating ideas...");
    // NOTE: Replace 'ideas' with your actual Supabase table name if different.
    const ideas = await fetchFromSupabase('ideas');
    await writeToFirestore('ideas', ideas);

    console.log("\nMigration completed successfully! 🎉");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrate();
