import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthType } from "@/lib/dualAuth";
import { getInstitutionTierDestination } from "@/lib/deploymentTier";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredType?: AuthType;
  /** Override the default /login redirect — used by WorkspaceRoute for persona-specific logins */
  loginPath?: string;
}

export default function ProtectedRoute({ children, requiredType, loginPath = "/login" }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, authType, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(loginPath, { replace: true });
      } else if (requiredType && authType !== requiredType) {
        // Role mismatch - redirect to relevant dashboard or home
        navigate(getInstitutionTierDestination(user?.deploymentTier), { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, authType, navigate, requiredType, loginPath, user?.deploymentTier]);

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

  // Navigation runs in an effect; never render protected content while access is denied.
  if (!isAuthenticated || (requiredType && authType !== requiredType)) return null;

  return <>{children}</>;
}
