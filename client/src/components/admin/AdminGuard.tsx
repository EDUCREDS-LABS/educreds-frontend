import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AdminAuth } from '@/lib/admin-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Shield, LogOut } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ email: string; loginTime: number; timeRemaining: number } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = AdminAuth.isLoggedIn();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Normalize stored admin email to canonical to match backend
        const canonicalEmail = 'admin@educreds.com';
        const currentEmail = AdminAuth.getAdminEmail();
        if (currentEmail && currentEmail.toLowerCase() !== canonicalEmail) {
          localStorage.setItem('adminEmail', canonicalEmail);
        }
        const info = AdminAuth.getSessionInfo();
        setSessionInfo(info);
      }
    };

    checkAuth();
    
    // Check authentication every minute
    const interval = setInterval(checkAuth, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    AdminAuth.logout();
    setLocation('/admin/login');
  };

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Verifying admin access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                You need to be logged in as an admin to access this page.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation('/admin/login')} 
              className="w-full"
            >
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Session expires in: {sessionInfo ? formatTime(sessionInfo.timeRemaining) : 'Unknown'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Logged in as: {sessionInfo?.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}









