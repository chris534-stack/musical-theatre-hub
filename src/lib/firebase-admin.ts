

import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

if (!getApps().length) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    const config: admin.AppOptions = { projectId, storageBucket };

    if (privateKey && clientEmail) {
        config.credential = cert({ projectId, clientEmail, privateKey });
    }
    
    initializeApp(config);
}

export const adminDb = admin.firestore();
export { admin };
