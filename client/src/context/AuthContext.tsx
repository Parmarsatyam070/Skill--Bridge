import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSession, Role } from '@shared/types';
import { api } from '../lib/api';

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

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get<{ user: UserSession }>('/auth/me');
      setUser(res.user);
    } catch {
      setUser(null);
      localStorage.removeItem('skillbridge_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (identifier: string, password: string): Promise<UserSession> => {
    const res = await api.post<{ accessToken: string; user: UserSession }>('/auth/login', {
      identifier,
      password,
    });
    localStorage.setItem('skillbridge_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: any): Promise<UserSession> => {
    const res = await api.post<{ accessToken: string; user: UserSession }>('/auth/register', data);
    localStorage.setItem('skillbridge_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const initiateOAuth = async (provider: 'google' | 'github' | 'microsoft'): Promise<void> => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const res = await api.get<{ authUrl?: string; configured?: boolean }>(
      `/auth/oauth/${provider}/url?redirectUri=${encodeURIComponent(redirectUri)}`
    );
    if (res && res.authUrl && res.configured !== false) {
      window.location.href = res.authUrl;
    } else {
      throw new Error(
        `${provider.toUpperCase()}_CLIENT_ID & ${provider.toUpperCase()}_CLIENT_SECRET are not configured in Render Environment Variables.`
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
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('skillbridge_token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
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
