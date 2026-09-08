import app, { auth } from '../firebase';
import {
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
} from 'firebase/auth';

// Enforce browserLocalPersistence so sessions strictly survive tab closures, reloads, and browser restarts
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('⚠️ [Firebase] Could not enable browserLocalPersistence:', err);
});

// OAuth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

export const githubProvider = new GithubAuthProvider();

export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({ prompt: 'select_account' });

export { auth };
export default app;
