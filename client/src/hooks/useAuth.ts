import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DualAuth, AuthType, AuthUser } from "@/lib/dualAuth";
import { useNavigate } from "react-router-dom";
import {
  DEV_BYPASS_AUTH,
  ensureDevBypassSession,
  getDevBypassRole,
} from "@/lib/devBypass";

const BYPASS_AUTH = DEV_BYPASS_AUTH;

// When bypassing auth, pick the institution deployment tier used for the dev
// user so all tiers can be exercised (set VITE_BYPASS_AUTH_TIER). Defaults to
// enterprise-connector so the connector UI is visible out of the box. The
// Deployment Tier dropdown inside the Connector form also switches tiers live.
const BYPASS_TIER = (() => {
  const valid = ["workspace", "cloud-connector", "enterprise-connector"] as const;
  const t = String(import.meta.env.VITE_BYPASS_AUTH_TIER ?? "enterprise-connector").toLowerCase();
  return (valid as readonly string[]).includes(t)
    ? (t as (typeof valid)[number])
    : "enterprise-connector";
})();

function buildDevUser(): AuthUser {
  const role = getDevBypassRole();
  if (role === "student") {
    return { id: "dev-student-1", email: "student@educreds.local", name: "Dev Student", type: AuthType.STUDENT, isVerified: true };
  }
  if (role === "verifier") {
    return { id: "dev-verifier-1", email: "verifier@educreds.local", name: "Dev Verifier Org", type: AuthType.VERIFIER, isVerified: true, organizationName: "Dev Verify Co.", subscriptionPlan: "Starter" };
  }
  if (role === "government") {
    return { id: "dev-government-1", email: "gov@educreds.local", name: "Dev Ministry", type: AuthType.GOVERNMENT, isVerified: true };
  }
  if (role === "developer") {
    return { id: "dev-developer-1", email: "dev@educreds.local", name: "Dev Developer", type: AuthType.DEVELOPER, isVerified: true, organizationName: "Dev Corp" };
  }
  return { id: "dev-institution-1", email: "dev@educreds.local", name: "Dev Institution", type: AuthType.INSTITUTION, walletAddress: "dev-wallet", isVerified: true, deploymentTier: BYPASS_TIER };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const initialUser = BYPASS_AUTH ? buildDevUser() : DualAuth.getCurrentUser();
  const [isAuthenticated, setIsAuthenticated] = useState(
    BYPASS_AUTH ? true : DualAuth.isAuthenticated()
  );
  const [authType, setAuthType] = useState<AuthType | null>(
    BYPASS_AUTH ? initialUser?.type ?? AuthType.INSTITUTION : DualAuth.getCurrentAuthType()
  );
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    BYPASS_AUTH ? initialUser : DualAuth.getCurrentUser()
  );
  const navigate = useNavigate();

  // Update authentication state when token changes
  useEffect(() => {
    const checkAuth = () => {
      if (BYPASS_AUTH) {
        ensureDevBypassSession();
        const user = buildDevUser();
        setIsAuthenticated(true);
        setAuthType(user.type);
        setCurrentUser(user);
        return;
      }
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
      if (BYPASS_AUTH) {
        ensureDevBypassSession();
        return buildDevUser();
      }
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
        deploymentTier: currentUser.deploymentTier,
        connectorApiUrl: currentUser.connectorApiUrl,
        connectorEndpoint: currentUser.connectorEndpoint,
        eduCredsId: currentUser.eduCredsId,

        // Verifier/org context
        organizationName: currentUser.organizationName,
        organizationId: currentUser.organizationId,
        subscriptionPlan: currentUser.subscriptionPlan,
      };
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    try {
      await DualAuth.logout();
    } finally {
      queryClient.clear();
      setIsAuthenticated(false);
      setAuthType(null);
      setCurrentUser(null);
      navigate("/", { replace: true });
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
