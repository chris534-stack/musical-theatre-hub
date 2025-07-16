

import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { config } from 'dotenv';

config();

if (!getApps().length) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!privateKey || !clientEmail || !projectId) {
        throw new Error('Missing required Firebase Admin SDK credentials in environment variables. Please check FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PROJECT_ID.');
    }

    if (!storageBucket) {
        throw new Error('Missing required Firebase Storage Bucket name. Please set FIREBASE_STORAGE_BUCKET in your environment variables.');
    }
    
    initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId, // Explicitly setting projectId again
        storageBucket
    });
}

export const adminDb = admin.firestore();
export { admin };
