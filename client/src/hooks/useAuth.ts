import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DualAuth, AuthType, AuthUser } from "@/lib/dualAuth";
import { useLocation } from "wouter";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(DualAuth.isAuthenticated());
  const [authType, setAuthType] = useState<AuthType | null>(DualAuth.getCurrentAuthType());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(DualAuth.getCurrentUser());
  const [, setLocation] = useLocation();

  // Update authentication state when token changes
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(DualAuth.isAuthenticated());
      setAuthType(DualAuth.getCurrentAuthType());
      setCurrentUser(DualAuth.getCurrentUser());
    };

    // Check immediately
    checkAuth();

    // Listen for custom auth state change events from both marketplace and institution
    const handleAuthStateChange = (event: Event) => {
      checkAuth();
    };

    window.addEventListener("authStateChange", handleAuthStateChange);
    window.addEventListener("marketplaceAuthStateChange", handleAuthStateChange);
    window.addEventListener("institutionAuthStateChange", handleAuthStateChange);

    // Also check when the component mounts and when the page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("authStateChange", handleAuthStateChange);
      window.removeEventListener("marketplaceAuthStateChange", handleAuthStateChange);
      window.removeEventListener("institutionAuthStateChange", handleAuthStateChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user", authType, currentUser?.id],
    queryFn: async () => {
      // Return the current user from DualAuth
      if (!isAuthenticated || !currentUser) {
        throw new Error("Not authenticated");
      }

      return {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        type: currentUser.type,
        walletAddress: currentUser.walletAddress,
        isVerified: currentUser.isVerified,
      };
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = async () => {
    try {
      await DualAuth.logout();
    } finally {
      queryClient.clear();
      setIsAuthenticated(false);
      setAuthType(null);
      setCurrentUser(null);
      setLocation("/");
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    authType,
    logout,
  };
}
