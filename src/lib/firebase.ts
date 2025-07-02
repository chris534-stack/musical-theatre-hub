import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

// To use a custom domain with Firebase Authentication, you must complete two steps:
//
// 1. Add your new domain to the list of "Authorized domains" in your Firebase project settings.
//    You can find this in the Firebase Console under:
//    Authentication > Settings > Sign-in method.
//
// 2. Set the NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN environment variable to your new domain.
//    For local development, you can add this to a .env.local file.
//    For production, set this in your hosting provider's environment variable settings.
//
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
