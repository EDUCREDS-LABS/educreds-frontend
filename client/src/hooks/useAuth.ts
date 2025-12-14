import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
  const [, setLocation] = useLocation();

  // Update authentication state when token changes
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(auth.isAuthenticated());
    };

    // Check immediately
    checkAuth();

    // Listen for custom auth state change events
    const handleAuthStateChange = (event: CustomEvent) => {
      setIsAuthenticated(event.detail.isAuthenticated);
    };

    window.addEventListener("authStateChange", handleAuthStateChange as EventListener);

    // Also check when the component mounts and when the page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("authStateChange", handleAuthStateChange as EventListener);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/auth/profile"],
    queryFn: async () => {
      // Use JWT-backed profile endpoint on the deployed backend.
      // The attached backend (educreds-backend) exposes `/auth/profile` and returns
      // `{ success: true, institution }` when a valid Authorization header is present.
      try {
        const profileResponse = await api.getProfile();

        // `api.getProfile()` should return the backend response directly.
        // If the backend wraps the institution in `{ success, institution }`, handle that shape.
        if (profileResponse) {
          // If backend returns `{ success: true, institution }`
          if ((profileResponse as any).institution) {
            const inst = (profileResponse as any).institution;
            return {
              id: inst._id ?? inst.id,
              email: inst.email,
              name: inst.name,
              role: inst.role ?? "institution",
            };
          }

          // If api.getProfile() already returned a flattened user
          if ((profileResponse as any).id || (profileResponse as any).email) {
            return profileResponse as any;
          }
        }

        // Fallback to token payload (client-side only)
        const tokenUser = auth.getUser();
        if (tokenUser) {
          return {
            id: tokenUser.sub,
            email: tokenUser.email,
            name: tokenUser.name,
            role: tokenUser.role,
          };
        }

        throw new Error("Not authenticated");
      } catch (err) {
        // Bubble up error so react-query knows the user isn't authenticated
        throw err;
      }
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = async () => {
    try {
      await auth.logout();
    } finally {
      queryClient.clear();
      setIsAuthenticated(false);
      setLocation("/");
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
  };
}
