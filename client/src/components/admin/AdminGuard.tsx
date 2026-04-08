import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AdminAuth } from '@/lib/admin-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      const info = await AdminAuth.getSessionInfo();
      if (!active) return;
      setIsAuthenticated(!!info);
      if (!info) {
        setLocation('/admin/login');
      }
    };

    checkAuth();

    const interval = setInterval(checkAuth, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [setLocation]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px]">Verifying Security Credentials</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting to login
  }

  return <>{children}</>;
}
