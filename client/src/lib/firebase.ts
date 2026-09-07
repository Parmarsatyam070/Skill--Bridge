import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAUXsNiZteiEhRuUp56msGrjahIL8No_Cs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sihi-5694c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sihi-5694c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sihi-5694c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '506845769904',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:506845769904:web:1f5b0192b0fe4d13eccb75',
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Enforce browserLocalPersistence so sessions strictly survive tab closures, reloads, and browser restarts
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('⚠️ [Firebase] Could not enable browserLocalPersistence:', err);
});

// OAuth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const githubProvider = new GithubAuthProvider();

export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
