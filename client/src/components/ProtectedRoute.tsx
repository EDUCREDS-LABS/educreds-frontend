import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { AuthType } from "@/lib/dualAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredType?: AuthType;
}

export default function ProtectedRoute({ children, requiredType }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, authType } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation("/login");
      } else if (requiredType && authType !== requiredType) {
        // Role mismatch - redirect to relevant dashboard or home
        if (authType === AuthType.MARKETPLACE) {
          setLocation("/marketplace");
        } else {
          setLocation("/institution/dashboard");
        }
      }
    }
  }, [isAuthenticated, isLoading, authType, setLocation, requiredType]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
