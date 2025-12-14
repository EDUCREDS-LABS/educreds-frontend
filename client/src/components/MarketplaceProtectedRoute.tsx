import { useMarketplaceAuth } from "@/hooks/useMarketplaceAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface MarketplaceProtectedRouteProps {
  children: React.ReactNode;
}

export default function MarketplaceProtectedRoute({ children }: MarketplaceProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useMarketplaceAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Add some debugging
    console.log('MarketplaceProtectedRoute - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

    if (!isLoading && !isAuthenticated) {
      console.log('MarketplaceProtectedRoute - Redirecting to marketplace login');
      setLocation("/marketplace/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

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