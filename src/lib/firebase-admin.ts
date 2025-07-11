

import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// This is a safeguard to prevent re-initialization, which can happen in development
// environments with hot-reloading.
if (!getApps().length) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (privateKey && clientEmail && projectId) {
        // Manual setup for local development or environments where all service account credentials are provided.
        initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            storageBucket,
        });
    } else {
        // Automatic setup for managed environments (like App Hosting) that rely on Application Default Credentials.
        // It's more robust to explicitly provide project details if available to avoid inference issues.
        initializeApp({
            projectId,
            storageBucket,
        });
    }
}

// Export the initialized admin instance of Firestore.
export const adminDb = admin.firestore();
export { admin };
