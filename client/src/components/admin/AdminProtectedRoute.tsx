import React from 'react';
import { Redirect } from 'wouter';
import { AdminAuth } from '@/lib/admin-auth';

// AdminProtectedRoute ensures that an admin_token exists and is valid.
export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = AdminAuth.getSession();

  if (!session) {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
};
