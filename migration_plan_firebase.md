# Firebase Migration Plan: Supabase to Firebase

This document outlines the steps to migrate the website's functionality from Supabase to a fully integrated Firebase application, including authentication, database, and backend logic.

## Phase 1: Preparation & Understanding

### Step 1.1: Inventory Supabase Usage

*   **Description:** Identify all files and code snippets that interact with Supabase. This includes imports of `@supabase/supabase-js`, usages of `supabaseClient.ts`, and any direct database or authentication calls.
*   **Focus Areas:**
    *   `lib/supabaseClient.ts`: Primary Supabase client initialization.
    *   `pages/api/*`: API routes interacting with Supabase.
    *   `components/*`: Components for data operations and authentication.
    *   `data/supabase_schema.sql`: Understand current Supabase database schema, tables, and relationships.
*   **Verification:**
    *   Manually review the mentioned directories and files.
    *   Use `grep -r "supabase"` in your terminal to find all occurrences of "supabase" in your codebase.
    *   List all Supabase tables you currently use.
*   **Status:** Pending

### Step 1.2: Firebase Project Setup (Manual Prerequisite)

*   **Description:** In your Firebase Console, ensure the following services are enabled and configured: Firebase Authentication (with desired providers), Cloud Firestore, Cloud Storage for Firebase (if handling file uploads), and Cloud Functions for Firebase.
*   **Output:** Obtain your Firebase Web App configuration (API Key, Auth Domain, Project ID, etc.) for frontend integration and your Firebase Admin SDK service account key file for backend scripts and Cloud Functions.
*   **Verification:**
    *   Confirm all required Firebase services are enabled in the Firebase Console.
    *   Verify you have the Firebase Web App configuration details readily available.
    *   Confirm you have downloaded the Firebase Admin SDK service account key file.
*   **Status:** Pending (Requires manual user action)

## Phase 2: Data Migration

### Step 2.1: Export Data from Supabase

*   **Description:** Write Node.js scripts to programmatically export data from each of your Supabase tables (e.g., `events`, `news`, `volunteer-requests`, `admins`, `venue-colors`, `ideas`) into structured JSON files.
*   **Tool:** Use the Supabase JavaScript client in a script to fetch all records from each table.
*   **Example (Conceptual):**
    ```javascript
    // In a new script like `scripts/exportSupabaseData.js`
    const { createClient } = require('@supabase/supabase-js');
    const fs = require('fs');
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    async function exportTable(tableName) {
        console.log(`Exporting ${tableName}...`);
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
            console.error(`Error exporting ${tableName}:`, error);
            return;
        }
        fs.writeFileSync(`./data/exported_${tableName}.json`, JSON.stringify(data, null, 2));
        console.log(`${tableName} exported successfully.`);
    }

    async function main() {
        await exportTable('events');
        await exportTable('news');
        // ... repeat for all relevant tables
    }

    main();
    ```
*   **Verification:**
    *   Check the `data/` directory for newly created JSON files (e.g., `exported_events.json`, `exported_news.json`).
    *   Open a few JSON files to ensure they contain the expected data and structure.
    *   Verify that all relevant Supabase tables have been exported.
*   **Status:** Pending

### Step 2.2: Import Data to Firebase Firestore

*   **Description:** Write Node.js scripts using the Firebase Admin SDK to import the JSON data exported from Supabase into corresponding collections in your Firestore database. Map Supabase table names to Firestore collection names. Decide on Firestore document IDs.
*   **Tool:** Use `admin.firestore().collection('collection_name').doc('document_id').set(data)` or `add(data)`.
*   **Verification:**
    *   Access your Firebase Console and navigate to Firestore Database.
    *   Verify that new collections have been created corresponding to your Supabase tables.
    *   Check a few documents in each collection to ensure the data has been imported correctly.
    *   Confirm document IDs are set as expected.
*   **Status:** Pending

## Phase 3: Authentication Migration

### Step 3.1: Migrate Supabase Users to Firebase Authentication

*   **Description:** If you have existing users in Supabase, export them and then import them into Firebase Authentication using `admin.auth().importUsers()`. Handle password hashing correctly.
*   **Verification:**
    *   Access your Firebase Console and navigate to Authentication.
    *   Verify that existing Supabase users are listed in Firebase Authentication.
    *   Test logging in with a few migrated user accounts.
*   **Status:** Pending

### Step 3.2: Update Frontend Authentication

*   **Description:** Replace all Supabase authentication logic in your components with Firebase Authentication SDK calls.
*   **Files:**
    *   Create a new `lib/firebaseClient.ts` to initialize and export the Firebase Auth client.
    *   Modify `components/GoogleSignInButton.tsx`, `components/AdminModal.tsx`, and any other components that use `supabase.auth` methods.
    *   Replace `getSession()` and `getUser()` calls with Firebase `onAuthStateChanged` and `currentUser` properties.
*   **Verification:**
    *   Test user registration, login, and logout functionalities on the website.
    *   Verify that user sessions are correctly managed.
    *   Check for any console errors related to authentication.
*   **Status:** Pending

### Step 3.3: Update Backend Authentication (API Routes/Cloud Functions)

*   **Description:** For any backend API routes (which will become Cloud Functions) that require user authentication, implement Firebase Admin SDK's `admin.auth().verifyIdToken(idToken)` to validate the user's ID token sent from the frontend.
*   **Verification:**
    *   Test API routes that require authentication to ensure they correctly validate user tokens.
    *   Attempt to access protected routes without authentication and verify they return an unauthorized error.
*   **Status:** Pending

## Phase 4: Backend Logic & API Migration

### Step 4.1: Migrate API Routes to Firebase Cloud Functions

*   **Description:** For each API route in `pages/api` that contains backend logic, rewrite it as a Firebase Cloud Function (HTTP trigger).
*   **Tool:** Use the Firebase Admin SDK within your Cloud Functions to interact with Firestore, Storage, and other Firebase services.
*   **Example (Conceptual for `add-event`):**
    ```typescript
    // In your Firebase Cloud Functions project
    import * as functions from 'firebase-functions';
    import * as admin from 'firebase-admin';
    admin.initializeApp();

    export const addEvent = functions.https.onCall(async (data, context) => {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
        }

        const { eventData } = data; // Data sent from frontend
        try {
            await admin.firestore().collection('events').add(eventData);
            return { status: 'success', message: 'Event added' };
        } catch (error) {
            console.error("Error adding event:", error);
            throw new functions.https.HttpsError('internal', 'Failed to add event', error);
        }
    });
    ```
*   **Verification:**
    *   Deploy all migrated Cloud Functions.
    *   Test each API endpoint (now a Cloud Function) using a tool like Postman or by interacting with the frontend.
    *   Verify that data is correctly retrieved, added, updated, and deleted through the Cloud Functions.
*   **Status:** Pending

### Step 4.2: Update Database Operations

*   **Description:** In all frontend components and the newly created Firebase Cloud Functions, replace every Supabase database operation with its equivalent Firebase Firestore operation. Adapt queries to Firestore's querying model.
*   **Verification:**
    *   Thoroughly test all data-driven features of the application (e.g., calendar displaying events, news feed, admin dashboards).
    *   Ensure all CRUD (Create, Read, Update, Delete) operations function correctly with Firestore.
    *   Check the Firebase Console Firestore tab to see if changes made on the frontend are reflected.
*   **Status:** Pending

## Phase 5: Frontend Integration & Cleanup

### Step 5.1: Update Environment Variables

*   **Description:** Remove `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your `.env.local` and any other environment configuration files. Add your Firebase configuration variables to your `.env.local` file.
*   **Verification:**
    *   Inspect `.env.local` (and other relevant config files) to ensure Supabase variables are removed and Firebase variables are present and correct.
    *   Restart your development server to ensure new environment variables are loaded.
*   **Status:** Pending

### Step 5.2: Remove Supabase Dependencies

*   **Description:** Once all Supabase code has been replaced, remove the `@supabase/supabase-js` package from your `package.json` and then run `npm uninstall @supabase/supabase-js` or `yarn remove @supabase/supabase-js`. Delete `lib/supabaseClient.ts`, `supabase_schema.sql`, and any other files exclusively related to Supabase that are no longer needed.
*   **Verification:**
    *   Check `package.json` to ensure `@supabase/supabase-js` is no longer listed.
    *   Run `npm install` or `yarn install` to ensure no broken dependencies.
    *   Verify that `lib/supabaseClient.ts` and `supabase_schema.sql` are deleted from your project.
    *   Check for any leftover Supabase-related files.
*   **Status:** Pending

### Step 5.3: Comprehensive Testing

*   **Description:** Thoroughly test every feature of your application. Focus on user registration, login, logout, data display, adding/editing/deleting data, admin functionalities, and all forms/submission processes.
*   **Verification:**
    *   Perform a complete end-to-end test of the entire application.
    *   Ensure both authenticated and unauthenticated user flows work perfectly.
    *   Check the browser console for any errors or warnings.
    *   Verify all links and navigation work as expected.
*   **Status:** Pending

### Step 5.4: Documentation Update

*   **Description:** Update your `README.md`, `requirements.md`, and any other development documentation to reflect the full migration from Supabase to Firebase.
*   **Verification:**
    *   Review all relevant documentation files to ensure they accurately reflect the Firebase migration.
    *   Confirm that instructions for setting up and running the project are updated for Firebase.
*   **Status:** Pending

