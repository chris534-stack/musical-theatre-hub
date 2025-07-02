import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// This is a safeguard to prevent re-initialization, which can happen in development
// environments with hot-reloading.
if (!getApps().length) {
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    // We prepare the config object but only add properties if they exist.
    const config: admin.AppOptions = {};
    if (storageBucket) {
        config.storageBucket = storageBucket;
    }

    if (privateKey) {
        // If a private key is provided, assume manual credential setup (e.g., local development)
        const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

        if (!projectId || !clientEmail) {
            throw new Error("Missing credentials for manual setup. When FIREBASE_ADMIN_PRIVATE_KEY is set, you must also provide FIREBASE_ADMIN_PROJECT_ID and FIREBASE_ADMIN_CLIENT_EMAIL.");
        }

        config.credential = cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        });
    }
    
    // Initialize with the constructed config.
    // If no privateKey is provided, it will use Application Default Credentials.
    // If no storageBucket is provided, storage features will require explicit bucket definition.
    initializeApp(config);
}

// Export the initialized admin instance of Firestore.
export const adminDb = admin.firestore();
export { admin };
