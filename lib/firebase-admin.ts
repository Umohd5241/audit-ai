import * as admin from 'firebase-admin';

const getEnv = (key: string | undefined, fallback: string): string => {
  if (!key || key === 'undefined' || key === 'null' || key.trim() === '') {
    return fallback;
  }
  // Remove possible quotes that might be present if the .env loader didn't strip them
  return key.replace(/"/g, '').trim();
};

let app: admin.app.App | undefined;
try {
  if (!admin.apps.length) {
    const projectId = getEnv(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'ai-startup-judge');
    const clientEmail = getEnv(process.env.FIREBASE_CLIENT_EMAIL, 'firebase-adminsdk-fbsvc@ai-startup-judge.iam.gserviceaccount.com');
    const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;
    
    let privateKey = (privateKeyEnv && privateKeyEnv !== 'undefined' && privateKeyEnv !== 'null')
      ? privateKeyEnv.replace(/"/g, '').trim()
      : undefined;

    // Handle both literal newlines and escaped \n
    if (privateKey && privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (projectId && clientEmail && privateKey) {
      console.log('Initializing Firebase Admin with Project ID:', projectId);
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('Firebase Admin credentials incomplete:', { 
        projectId: projectId ? 'Present' : 'Missing', 
        clientEmail: clientEmail ? 'Present' : 'Missing', 
        privateKey: privateKey ? 'Present' : 'Missing' 
      });
    }
  } else {
    app = admin.app();
  }
} catch (error) {
  console.error('Firebase admin initialization error:', error);
}

export { app };

const getAdminDb = () => {
  if (admin.apps.length) return admin.firestore();
  console.error('adminDb access before initialization or initialization failed');
  return null;
};

const getAdminAuth = () => {
  if (admin.apps.length) return admin.auth();
  console.error('adminAuth access before initialization or initialization failed');
  return null;
};

export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();
