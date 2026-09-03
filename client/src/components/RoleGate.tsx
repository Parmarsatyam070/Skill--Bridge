import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getRoleRedirect } from '../context/AuthContext';
import { Role } from '@shared/types';

interface RoleGateProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-console-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-console-text-muted">Loading SkillBridge session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role as Role)) {
    // Redirect to user's authorized home dashboard
    const correctPath = getRoleRedirect(user.role as Role);
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
};
