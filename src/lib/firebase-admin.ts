import * as admin from 'firebase-admin';

// This is a safeguard to prevent re-initialization, which can happen in development
// environments with hot-reloading.
if (!admin.apps.length) {
    try {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      if (!privateKey) {
          throw new Error("Required environment variable FIREBASE_ADMIN_PRIVATE_KEY is not set.");
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          // Handle the newline characters that can get escaped in environment variables
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error: any) {
      // If the app is already initialized, we don't want to throw an error.
      if (error.code !== 'app/duplicate-app') {
        console.error('Firebase Admin initialization error:', error);
        // Re-throw the error if it's not the one we're expecting to handle.
        throw error;
      }
    }
}

// Export the initialized admin instance of Firestore.
export const adminDb = admin.firestore();
