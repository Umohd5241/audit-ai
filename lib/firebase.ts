import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const getEnv = (key: string | undefined, fallback: string): string => {
  if (!key || key === 'undefined' || key === 'null' || key.trim() === '') {
    return fallback;
  }
  return key;
};

const firebaseConfig = {
  apiKey: getEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "AIzaSyCJF1Wl-e2_4kMKx87BeIAC0ELV6MeYHWY"),
  authDomain: getEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "ai-startup-judge.firebaseapp.com"),
  projectId: getEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "ai-startup-judge"),
  storageBucket: getEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "ai-startup-judge.firebasestorage.app"),
  messagingSenderId: getEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, "455776566121"),
  appId: getEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "1:455776566121:web:65082b080cd0fffbafdbf8")
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { auth, db };
