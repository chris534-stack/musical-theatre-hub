import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// This is a safeguard to prevent re-initialization, which can happen in development
// environments with hot-reloading.
if (!getApps().length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin SDK credentials. Please ensure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set in your environment variables.");
    }

    initializeApp({
    credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        // Handle the newline characters that can get escaped in environment variables
        privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    });
}

// Export the initialized admin instance of Firestore.
export const adminDb = admin.firestore();
