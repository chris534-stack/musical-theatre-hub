
import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// This is a safeguard to prevent re-initialization, which can happen in development
// environments with hot-reloading.
if (!getApps().length) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (privateKey && clientEmail && projectId) {
        // Manual setup for local development when all credentials are provided in .env
        initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            storageBucket,
        });
    } else {
        // Automatic setup for managed environments (like App Hosting).
        // It uses Application Default Credentials but we explicitly provide project
        // details to avoid inference issues, which is a more robust approach.
        initializeApp({
            projectId,
            storageBucket,
        });
    }
}

// Export the initialized admin instance of Firestore.
export const adminDb = admin.firestore();
export { admin };
