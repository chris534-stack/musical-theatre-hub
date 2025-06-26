// lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC7ZKo1hR52B3pLacB-BpbO6r-1MPac5PQ",
  authDomain: "our-stage-eugene.firebaseapp.com",
  projectId: "our-stage-eugene",
  storageBucket: "our-stage-eugene.firebasestorage.app",
  messagingSenderId: "283327786721",
  appId: "1:283327786721:web:41366182edab1d0b6f51a0",
  measurementId: "G-659JJZMZ5J" // Optional
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get the Auth instance
const auth = getAuth(app);

export { app, auth };