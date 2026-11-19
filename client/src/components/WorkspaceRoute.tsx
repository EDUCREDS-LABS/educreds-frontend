/**
 * WorkspaceRoute — workspace-aware ProtectedRoute.
 *
 * Wraps ProtectedRoute and additionally checks that the authenticated user has
 * membership in the required workspace. If the user is not authenticated at all,
 * redirects to the persona-specific login page for that workspace.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { getWorkspacesForUser } from "@/lib/workspaces";
import type { WorkspaceId } from "@/lib/workspaces";

/** Map each workspace to its dedicated login route */
const WORKSPACE_LOGIN: Record<WorkspaceId, string> = {
  institution: "/login",
  student:     "/student/login",
  developer:   "/developer/login",
  verifier:    "/verifier/login",
  government:  "/government/login",
  admin:       "/login",
};

interface WorkspaceRouteProps {
  children: React.ReactNode;
  workspace: WorkspaceId;
}

function WorkspaceGuard({ children, workspace }: WorkspaceRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const allowedWorkspaces = getWorkspacesForUser(user);
  const hasAccess = allowedWorkspaces.includes(workspace);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      // Not logged in at all — send to this workspace's login
      navigate(WORKSPACE_LOGIN[workspace], { replace: true });
      return;
    }
    if (!hasAccess) {
      // Logged in but wrong role — send to their workspace's login
      navigate(WORKSPACE_LOGIN[workspace], { replace: true });
    }
  }, [isLoading, isAuthenticated, hasAccess, navigate, workspace]);

  if (isLoading) return null;
  if (!isAuthenticated || !hasAccess) return null;

  return <>{children}</>;
}

export default function WorkspaceRoute({ children, workspace }: WorkspaceRouteProps) {
  return (
    <ProtectedRoute loginPath={WORKSPACE_LOGIN[workspace]}>
      <WorkspaceGuard workspace={workspace}>
        {children}
      </WorkspaceGuard>
    </ProtectedRoute>
  );
}
