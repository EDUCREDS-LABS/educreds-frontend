import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { marketplaceAuth, marketplaceApi } from "@/lib/marketplace-auth";

interface MarketplaceUser {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  avatar?: string;
  isDesigner?: boolean;
  purchaseCount?: number;
  authProvider?: string;
  isVerified?: boolean;
}

export function useMarketplaceAuth() {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(marketplaceAuth.isAuthenticated());

  // Update authentication state when token changes
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(marketplaceAuth.isAuthenticated());
    };

    // Check immediately
    checkAuth();

    // Listen for custom auth state change events
    const handleAuthStateChange = (event: CustomEvent) => {
      setIsAuthenticated(event.detail.isAuthenticated);
    };

    window.addEventListener("marketplaceAuthStateChange", handleAuthStateChange as EventListener);

    // Also check when the component mounts and when the page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("marketplaceAuthStateChange", handleAuthStateChange as EventListener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const { data: user, isLoading } = useQuery<MarketplaceUser>({
    queryKey: ["/marketplace-auth/profile"],
    queryFn: async () => {
      // First try to get profile from session
      const sessionResponse = await marketplaceApi.verifySession();
      if (sessionResponse.valid && sessionResponse.user) {
        return sessionResponse.user;
      }
      
      // Fallback to JWT token
      const tokenUser = marketplaceAuth.getUser();
      if (tokenUser) {
        return {
          id: tokenUser.sub,
          email: tokenUser.email,
          name: tokenUser.name,
          displayName: tokenUser.name,
        };
      }
      
      throw new Error("Not authenticated");
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = async () => {
    await marketplaceAuth.logout();
    queryClient.clear();
    setIsAuthenticated(false);
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}


