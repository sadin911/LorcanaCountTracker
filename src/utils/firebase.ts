import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  browserLocalPersistence,
  setPersistence,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Config comes entirely from VITE_FIREBASE_* — there are deliberately no
 * hardcoded fallbacks, so a missing secret is a loud boot error here instead of
 * an `auth/invalid-api-key` the first time someone clicks Sign in.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const REQUIRED = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const missing = REQUIRED.filter((k) => !firebaseConfig[k]);

/** True when the app is configured for cloud sync. */
export const isFirebaseConfigured = missing.length === 0;

if (!isFirebaseConfigured) {
  console.error(
    `[firebase] missing env: ${missing.map((k) => `VITE_FIREBASE_${k.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`).join(', ')}\n` +
      'Copy .env.example to .env.local and fill it in. Cloud sync and sign-in are disabled; ' +
      'the collection still works locally in guest mode.'
  );
}

// Singleton init so hot reload doesn't create duplicate apps.
export const app = isFirebaseConfigured
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

if (auth && typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase setPersistence warning:', err);
  });
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase is not configured');
  try {
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    return result.user;
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user') {
      console.error('Google Sign-In Error:', error);
    }
    throw error;
  }
}

export async function logOut() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}
