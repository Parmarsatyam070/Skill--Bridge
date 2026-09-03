import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSession, Role } from '@shared/types';
import { api } from '../lib/api';

interface OAuthVerifyResult {
  requiresRoleSelection?: boolean;
  email?: string;
  name?: string;
  provider?: string;
  avatarUrl?: string | null;
  user?: UserSession;
  accessToken?: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<UserSession>;
  register: (data: any) => Promise<UserSession>;
  oauthLogin: (payload: {
    provider: 'google' | 'github' | 'microsoft';
    email: string;
    name?: string;
    avatarUrl?: string;
    role?: Role;
    roleData?: any;
  }) => Promise<OAuthVerifyResult>;
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

  const oauthLogin = async (payload: {
    provider: 'google' | 'github' | 'microsoft';
    email: string;
    name?: string;
    avatarUrl?: string;
    role?: Role;
    roleData?: any;
  }): Promise<OAuthVerifyResult> => {
    const res = await api.post<OAuthVerifyResult>('/auth/oauth/verify', payload);
    if (res.accessToken && res.user) {
      localStorage.setItem('skillbridge_token', res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    }
    return res;
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
        oauthLogin,
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
