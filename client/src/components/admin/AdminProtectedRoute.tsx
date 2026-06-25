import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Redirect } from 'wouter';
import { AdminAuth } from '@/lib/admin-auth';

export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      const session = await AdminAuth.getSessionInfo();
      if (active) {
        setIsAuthenticated(!!session);
      }
    };

    void verifySession();

    return () => {
      active = false;
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="size-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
};
