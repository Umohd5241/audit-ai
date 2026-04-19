import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCJF1Wl-e2_4kMKx87BeIAC0ELV6MeYHWY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ai-startup-judge.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-startup-judge",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ai-startup-judge.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "455776566121",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:455776566121:web:65082b080cd0fffbafdbf8"
};

// Ensure app is initialized exactly once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export initialized instances directly
export const auth = getAuth(app);
export const db = getFirestore(app);

