import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { UserSession, Role } from '@shared/types';
import { api } from '../lib/api';
import { auth, googleProvider, githubProvider, microsoftProvider } from '../lib/firebase';

export interface OAuthCallbackResult {
  isNewUser: boolean;
  onboardingToken?: string;
  profile?: {
    email: string;
    name: string;
    avatarUrl?: string | null;
    provider: string;
  };
  user?: UserSession;
  accessToken?: string;
  message?: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<UserSession>;
  register: (data: any) => Promise<UserSession>;
  /**
   * Session-safe student provisioning for Institution Admins.
   * Creates a student account via the backend (Firebase Admin SDK server-side)
   * WITHOUT replacing the current authenticated user's session, token, or localStorage.
   */
  provisionStudent: (data: {
    email: string;
    password: string;
    name: string;
    institution: string;
    targetDomain?: string;
    phone?: string;
    cgpa?: number;
    bio?: string;
  }) => Promise<UserSession>;
  signInWithGoogle: () => Promise<UserSession>;
  signInWithProvider: (provider: 'google' | 'github' | 'microsoft') => Promise<UserSession>;
  initiateOAuth: (provider: 'google' | 'github' | 'microsoft') => Promise<void>;
  handleOAuthCallback: (provider: string, code: string) => Promise<OAuthCallbackResult>;
  completeOAuthRegistration: (onboardingToken: string, role: Role, roleData: any) => Promise<UserSession>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getRoleRedirect: (role: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getRoleRedirect(role: Role): string {
  switch (role) {
    case 'STUDENT':
      return '/dashboard';
    case 'INDUSTRY':
      return '/industry/dashboard';
    case 'INSTITUTION_ADMIN':
      return '/institution/dashboard';
    default:
      return '/dashboard';
  }
}

/**
 * Allow-list of explicit backend rejection error codes where registration rollback (deleting
 * the freshly created Firebase user) is explicitly intended.
 * 
 * NEVER include:
 * - HTTP 500 / PROVISIONING_FAILED / INTERNAL_ERROR / SERVER_ERROR
 * - Database connection failures / DATABASE_ERROR
 * - Request timeouts / REQUEST_TIMEOUT
 * - Network failures / TypeError / Failed to fetch
 * - Unexpected exceptions or unknown error codes
 */
export const REGISTRATION_ROLLBACK_ALLOWED_CODES = new Set([
  'ACCOUNT_EXISTS',
  'EMAIL_EXISTS',
  'PHONE_EXISTS',
  'VALIDATION_ERROR',
]);

export function shouldRollbackFirebaseRegistration(err: any): boolean {
  if (!err) return false;
  const errorCode = err.code || err.error?.code || err.details?.code;
  if (typeof errorCode === 'string' && REGISTRATION_ROLLBACK_ALLOWED_CODES.has(errorCode)) {
    return true;
  }
  return false;
}

export async function executeRegistrationRollbackIfPermitted(
  createdUser: any,
  currentAuthUser: any,
  err: any,
  onClearToken?: () => void
): Promise<boolean> {
  // Requirement 1: This browser registration flow definitely created that Firebase user
  if (!createdUser) {
    return false;
  }
  // Requirement 2: Backend explicitly returned a known registration-rejection condition
  if (!shouldRollbackFirebaseRegistration(err)) {
    return false;
  }
  // Session Safety: Ensure cleanup does NOT replace or affect an existing authenticated Firebase session
  if (!currentAuthUser || currentAuthUser.uid !== createdUser.uid) {
    return false;
  }

  try {
    await createdUser.delete();
  } catch (deleteErr) {
    console.warn('[AUTH] Non-critical: Failed to delete rolled-back Firebase user:', deleteErr);
  }

  if (onClearToken) {
    onClearToken();
  }

  return true;
}

interface RegistrationFlowState {
  active: boolean;
  firebaseUid: string | null;
  provisioningComplete: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('skillbridge_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Lifecycle-aware registration state guard
  const registrationStateRef = useRef<RegistrationFlowState>({
    active: false,
    firebaseUid: null,
    provisioningComplete: false,
  });

  // Synchronize Firebase user with PostgreSQL backend
  const syncWithBackend = async (fbUser: FirebaseUser): Promise<UserSession | null> => {
    try {
      const idToken = await fbUser.getIdToken();
      const res = await api.post<{ user: UserSession; accessToken?: string; isNewUser: boolean }>('/auth/google/firebase', { idToken });
      const authToken = res.accessToken || idToken;
      localStorage.setItem('skillbridge_token', authToken);
      setToken(authToken);
      setUser(res.user);
      return res.user;
    } catch (err) {
      console.error('Failed to synchronize session with backend:', err);
      return null;
    }
  };

  // Firebase auth state observer: automatically restores persistent session across page reloads and browser restarts (Rule 10)
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      const regState = registrationStateRef.current;
      if (regState.active) {
        // Explicit registration flow is actively managing provisioning. Suppress automatic provisioning.
        return;
      }
      if (fbUser && regState.firebaseUid === fbUser.uid) {
        // Event belongs to the active registration UID. Suppress automatic provisioning.
        return;
      }

      if (fbUser) {
        await syncWithBackend(fbUser);
      } else {
        // If Firebase user is unavailable, check if a SkillBridge access token exists in localStorage
        const storedToken = localStorage.getItem('skillbridge_token');
        if (storedToken) {
          try {
            const meRes = await api.get<{ user: UserSession }>('/auth/me');
            if (isMounted && meRes?.user) {
              setUser(meRes.user);
              setToken(storedToken);
            } else if (isMounted) {
              localStorage.removeItem('skillbridge_token');
              setUser(null);
              setToken(null);
            }
          } catch {
            if (isMounted) {
              localStorage.removeItem('skillbridge_token');
              setUser(null);
              setToken(null);
            }
          }
        } else if (isMounted) {
          setUser(null);
          setToken(null);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (identifier: string, password: string): Promise<UserSession> => {
    setIsLoading(true);

    // 1. First attempt: standard Firebase email/password sign-in
    try {
      const userCredential = await signInWithEmailAndPassword(auth, identifier.trim(), password);
      const syncedUser = await syncWithBackend(userCredential.user);
      if (syncedUser) {
        setIsLoading(false);
        return syncedUser;
      }
    } catch (fbErr: any) {
      // If user is not yet provisioned in Firebase Auth, attempt seamless fallback migration from PostgreSQL
      const isNotFoundOrInvalid =
        fbErr.code === 'auth/user-not-found' ||
        fbErr.code === 'auth/invalid-credential' ||
        fbErr.code === 'auth/invalid-email';

      if (isNotFoundOrInvalid) {
        try {
          const fallbackRes = await api.post<{ customToken: string; user: UserSession; accessToken?: string }>(
            '/auth/firebase-login-fallback',
            { identifier, password }
          );

          if (fallbackRes.customToken) {
            const userCred = await signInWithCustomToken(auth, fallbackRes.customToken);
            const syncedUser = await syncWithBackend(userCred.user);
            setIsLoading(false);
            const finalUser = syncedUser || fallbackRes.user;
            if (fallbackRes.accessToken) {
              localStorage.setItem('skillbridge_token', fallbackRes.accessToken);
              setToken(fallbackRes.accessToken);
            }
            setUser(finalUser);
            return finalUser;
          }
        } catch (fallbackErr: any) {
          setIsLoading(false);
          throw new Error(fallbackErr.message || 'Invalid credentials.');
        }
      }

      setIsLoading(false);
      throw new Error(fbErr.message || 'Authentication failed. Please check your credentials.');
    }

    setIsLoading(false);
    throw new Error('Authentication failed.');
  };

  const register = async (data: any): Promise<UserSession> => {
    setIsLoading(true);
    let createdUser: any = null;

    // 1. Enter explicit registration state BEFORE createUserWithEmailAndPassword
    registrationStateRef.current = {
      active: true,
      firebaseUid: null,
      provisioningComplete: false,
    };

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      createdUser = userCredential.user;
      // Immediately capture newly created Firebase UID so any auth listener callback is suppressed
      registrationStateRef.current.firebaseUid = userCredential.user.uid;

      const displayName = (data.name || data.institutionName || data.companyName || '').trim();
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      const idToken = await userCredential.user.getIdToken();

      const res = await api.post<{ user: UserSession; accessToken?: string }>('/auth/sync', {
        idToken,
        role: data.role,
        name: displayName,
        roleData: data,
      });

      // 2. Mark provisioning complete and establish application session
      registrationStateRef.current.provisioningComplete = true;

      const authToken = res.accessToken || idToken;
      localStorage.setItem('skillbridge_token', authToken);
      setToken(authToken);
      setUser(res.user);
      setIsLoading(false);
      return res.user;
    } catch (err: any) {
      setIsLoading(false);

      // SAFETY CORRECTION:
      // The newly created Firebase user may be deleted only when:
      // 1. This browser registration flow definitely created that Firebase user, AND
      // 2. The backend explicitly returned a known registration-rejection condition where rollback is intended (ACCOUNT_EXISTS, etc.), AND
      // 3. PostgreSQL provisioning was NOT completed, AND
      // 4. The cleanup operation strictly targets the createdUser and does not affect another authenticated session.
      if (!registrationStateRef.current.provisioningComplete) {
        await executeRegistrationRollbackIfPermitted(
          createdUser,
          auth.currentUser,
          err,
          () => {
            localStorage.removeItem('skillbridge_token');
            setToken(null);
          }
        );
      }

      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email address already exists. Please sign in instead.');
      }
      throw new Error(err.message || 'Failed to create account.');
    } finally {
      // 3. Safely finish the registration transaction and clear registration-specific state
      registrationStateRef.current = {
        active: false,
        firebaseUid: null,
        provisioningComplete: false,
      };
    }
  };

  /**
   * provisionStudent — Institution Admin-only helper.
   *
   * Calls POST /api/auth/provision-student which uses Firebase Admin SDK server-side.
   * The browser's Firebase Auth state and localStorage token are NEVER modified.
   * The current admin's `user` and `token` state remain completely unchanged.
   */
  const provisionStudent = async (data: {
    email: string;
    password: string;
    name: string;
    institution: string;
    targetDomain?: string;
    phone?: string;
    cgpa?: number;
    bio?: string;
  }): Promise<UserSession> => {
    if (!user || user.role !== 'INSTITUTION_ADMIN') {
      throw new Error('Only authenticated Institution Admins can provision student accounts.');
    }
    // Call the protected endpoint — the current admin token is sent automatically
    // by the `api` client (which reads from localStorage). No session state is modified.
    const res = await api.post<{ student: UserSession; message: string }>(
      '/auth/provision-student',
      data
    );
    // Deliberately do NOT call setUser, setToken, or localStorage here.
    return res.student;
  };

  const signInWithGoogle = async (): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();

      const res = await api.post<{ user: UserSession; accessToken?: string; isNewUser: boolean }>(
        '/auth/google/firebase',
        { idToken }
      );

      const authToken = res.accessToken || idToken;
      localStorage.setItem('skillbridge_token', authToken);
      setToken(authToken);
      setUser(res.user);
      setIsLoading(false);
      return res.user;
    } catch (err: any) {
      setIsLoading(false);
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled. The Google sign-in window was closed.');
      }
      if (err.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked by browser. Please allow popups for SkillBridge to sign in.');
      }
      if (err.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in process was cancelled.');
      }
      if (err.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      }
      if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email using a different sign-in method.');
      }
      throw new Error(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'microsoft'): Promise<UserSession> => {
    if (provider === 'google') {
      return signInWithGoogle();
    }

    setIsLoading(true);
    try {
      const providerInstance = provider === 'github' ? githubProvider : microsoftProvider;
      const credential = await signInWithPopup(auth, providerInstance);
      const syncedUser = await syncWithBackend(credential.user);
      setIsLoading(false);

      if (!syncedUser) {
        throw new Error('Could not synchronize provider profile with database.');
      }
      return syncedUser;
    } catch (err: any) {
      setIsLoading(false);
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup closed before completion.');
      }
      if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with the same email using a different provider.');
      }
      throw new Error(err.message || `Failed to sign in with ${provider}.`);
    }
  };

  // Standard OAuth 2.0 initiation (supports Google, GitHub, Microsoft)
  const initiateOAuth = async (provider: 'google' | 'github' | 'microsoft'): Promise<void> => {
    if (provider === 'google') {
      const user = await signInWithGoogle();
      const redirectPath = getRoleRedirect(user.role as Role);
      navigate(redirectPath);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    try {
      const res = await api.get<{ authUrl?: string; configured?: boolean }>(
        `/auth/oauth/${provider}/url?redirectUri=${encodeURIComponent(redirectUri)}`
      );
      if (res && res.authUrl && res.configured !== false) {
        window.location.href = res.authUrl;
        return;
      }
    } catch (err: any) {
      throw new Error(
        err.message || `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not configured on the server.`
      );
    }
  };

  const handleOAuthCallback = async (provider: string, code: string): Promise<OAuthCallbackResult> => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const res = await api.post<OAuthCallbackResult>(`/auth/oauth/${provider}/callback`, {
      code,
      redirectUri,
    });

    if (!res.isNewUser && res.accessToken && res.user) {
      localStorage.setItem('skillbridge_token', res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    }

    return res;
  };

  const completeOAuthRegistration = async (
    onboardingToken: string,
    role: Role,
    roleData: any
  ): Promise<UserSession> => {
    const res = await api.post<{ accessToken: string; user: UserSession }>('/auth/oauth/register', {
      onboardingToken,
      role,
      roleData,
    });

    if (res.accessToken && res.user) {
      localStorage.setItem('skillbridge_token', res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    }

    return res.user;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('skillbridge_token');
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await syncWithBackend(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        provisionStudent,
        signInWithGoogle,
        signInWithProvider,
        initiateOAuth,
        handleOAuthCallback,
        completeOAuthRegistration,
        logout,
        refreshUser,
        getRoleRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
