import * as admin from 'firebase-admin';

const getEnv = (key: string | undefined, fallback: string): string => {
  if (!key || key === 'undefined' || key === 'null' || key.trim() === '') {
    return fallback;
  }
  return key;
};

let app: admin.app.App;
try {
  if (!admin.apps.length) {
      const projectId = getEnv(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'ai-startup-judge');
      const clientEmail = getEnv(process.env.FIREBASE_CLIENT_EMAIL, 'firebase-adminsdk-fbsvc@ai-startup-judge.iam.gserviceaccount.com');
      const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;
      const privateKey = (privateKeyEnv && privateKeyEnv !== 'undefined' && privateKeyEnv !== 'null')
        ? privateKeyEnv.replace(/\\n/g, '\n').replace(/"/g, '').trim()
        : undefined;

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
  }
  app = admin.app();
} catch (error) {
  console.error('Firebase admin initialization error', error);
}

export { app };
export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
