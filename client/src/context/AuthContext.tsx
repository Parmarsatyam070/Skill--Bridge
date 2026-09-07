import React, { createContext, useContext, useState, useEffect } from 'react';
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
    case 'ACADEMICIAN':
      return '/academician/dashboard';
    case 'INSTITUTION_ADMIN':
      return '/institution/dashboard';
    default:
      return '/dashboard';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('skillbridge_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Synchronize Firebase user with PostgreSQL backend
  const syncWithBackend = async (fbUser: FirebaseUser): Promise<UserSession | null> => {
    try {
      const idToken = await fbUser.getIdToken();
      localStorage.setItem('skillbridge_token', idToken);
      setToken(idToken);

      const res = await api.post<{ user: UserSession; isNewUser: boolean }>('/auth/sync', { idToken });
      setUser(res.user);
      return res.user;
    } catch (err) {
      console.error('Failed to synchronize session with backend:', err);
      return null;
    }
  };

  // Firebase auth state observer: automatically restores persistent session across page reloads and browser restarts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await syncWithBackend(fbUser);
      } else {
        // Only clear if no legacy token exists or if explicitly signed out
        const legacyToken = localStorage.getItem('skillbridge_token');
        if (!legacyToken) {
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
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
          const fallbackRes = await api.post<{ customToken: string; user: UserSession }>(
            '/auth/firebase-login-fallback',
            { identifier, password }
          );

          if (fallbackRes.customToken) {
            const userCred = await signInWithCustomToken(auth, fallbackRes.customToken);
            const syncedUser = await syncWithBackend(userCred.user);
            setIsLoading(false);
            return syncedUser || fallbackRes.user;
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      if (data.name) {
        await updateProfile(userCredential.user, { displayName: data.name });
      }

      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('skillbridge_token', idToken);
      setToken(idToken);

      const res = await api.post<{ user: UserSession }>('/auth/sync', {
        idToken,
        role: data.role || 'STUDENT',
        name: data.name,
        roleData: data,
      });

      setUser(res.user);
      setIsLoading(false);
      return res.user;
    } catch (err: any) {
      setIsLoading(false);
      throw new Error(err.message || 'Failed to create account.');
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'microsoft'): Promise<UserSession> => {
    setIsLoading(true);
    try {
      let providerInstance;
      switch (provider) {
        case 'google':
          providerInstance = googleProvider;
          break;
        case 'github':
          providerInstance = githubProvider;
          break;
        case 'microsoft':
          providerInstance = microsoftProvider;
          break;
      }

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

  // Backward compatibility wrapper for existing OAuth initiation
  const initiateOAuth = async (provider: 'google' | 'github' | 'microsoft'): Promise<void> => {
    const userSession = await signInWithProvider(provider);
    const redirectPath = getRoleRedirect(userSession.role as Role);
    navigate(redirectPath);
  };

  const handleOAuthCallback = async (_provider: string, _code: string): Promise<OAuthCallbackResult> => {
    if (user) {
      return { isNewUser: false, user, accessToken: token || undefined };
    }
    return { isNewUser: false };
  };

  const completeOAuthRegistration = async (
    _onboardingToken: string,
    role: Role,
    roleData: any
  ): Promise<UserSession> => {
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      const res = await api.post<{ user: UserSession }>('/auth/sync', {
        idToken,
        role,
        roleData,
      });
      setUser(res.user);
      return res.user;
    }
    throw new Error('No active authenticated session found.');
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('skillbridge_token');
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
