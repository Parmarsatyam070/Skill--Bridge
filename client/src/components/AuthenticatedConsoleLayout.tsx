import React from 'react';
import { Outlet } from 'react-router-dom';
import { RoleGate } from './RoleGate';
import { ConsoleLayout } from './ConsoleLayout';
import { Role } from '@shared/types';

interface AuthenticatedConsoleLayoutProps {
  allowedRoles: Role[];
}

export const AuthenticatedConsoleLayout: React.FC<AuthenticatedConsoleLayoutProps> = ({ allowedRoles }) => {
  return (
    <RoleGate allowedRoles={allowedRoles}>
      <ConsoleLayout>
        <Outlet />
      </ConsoleLayout>
    </RoleGate>
  );
};

export default AuthenticatedConsoleLayout;
