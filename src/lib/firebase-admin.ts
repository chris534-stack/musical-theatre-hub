import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// This is a safeguard to prevent re-initialization, which can happen in development
// environments with hot-reloading.
if (!getApps().length) {
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!storageBucket) {
        throw new Error("Missing Firebase Storage Bucket configuration. Please ensure FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is set in your environment variables.");
    }

    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (privateKey) {
        // If a private key is provided, assume manual credential setup (e.g., local development)
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

        if (!projectId || !clientEmail) {
            throw new Error("Missing credentials for manual setup. When FIREBASE_ADMIN_PRIVATE_KEY is set, you must also provide FIREBASE_ADMIN_PROJECT_ID and FIREBASE_ADMIN_CLIENT_EMAIL.");
        }

        initializeApp({
            credential: cert({
                projectId: projectId,
                clientEmail: clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            storageBucket: storageBucket,
        });
    } else {
        // Otherwise, assume a managed environment with Application Default Credentials
        // console.log("Initializing Firebase Admin SDK with Application Default Credentials.");
        initializeApp({
            storageBucket: storageBucket,
        });
    }
}

// Export the initialized admin instance of Firestore.
export const adminDb = admin.firestore();
export { admin };
