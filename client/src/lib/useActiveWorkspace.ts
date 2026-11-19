import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import {
  getWorkspacesForUser,
  setWorkspaceMembership,
  type WorkspaceId,
} from "@/lib/workspaces";

const ACTIVE_KEY = "educreds_active_workspace";

/** Map AuthType → canonical WorkspaceId (single-workspace users never hit the picker) */
const AUTH_TYPE_TO_WORKSPACE: Partial<Record<AuthType, WorkspaceId>> = {
  [AuthType.INSTITUTION]: "institution",
  [AuthType.STUDENT]:     "student",
  [AuthType.VERIFIER]:    "verifier",
  [AuthType.GOVERNMENT]:  "government",
  [AuthType.DEVELOPER]:   "developer",
};

function readActive(): WorkspaceId | null {
  try {
    return (window.sessionStorage.getItem(ACTIVE_KEY) as WorkspaceId) || null;
  } catch {
    return null;
  }
}

function writeActive(id: WorkspaceId | null): void {
  try {
    if (id) window.sessionStorage.setItem(ACTIVE_KEY, id);
    else window.sessionStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Workspace Resolver.
 *
 * Priority order for the active workspace:
 *  1. Explicitly stored in sessionStorage (user clicked "Switch workspace")
 *  2. Derived automatically from user.type — each auth role maps 1:1 to a workspace
 *  3. Falls back to "institution" only if nothing else resolves
 *
 * This means verifier/government/developer users always see their correct sidebar
 * without any manual workspace selection step.
 */
export function useActiveWorkspace() {
  const { user } = useAuth();
  const [storedActive, setStoredActive] = useState<WorkspaceId | null>(() => readActive());

  // Seed ?ws= URL param for dev/testing
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const ws = params.get("ws");
    if (ws) {
      const ids = ws.split(",").map(s => s.trim()).filter(Boolean) as WorkspaceId[];
      if (ids.length > 0) setWorkspaceMembership(ids);
    }
  }, [user]);

  // Auto-derive workspace from user.type when nothing is stored
  const derived: WorkspaceId | null = user?.type
    ? (AUTH_TYPE_TO_WORKSPACE[user.type] ?? null)
    : null;

  // Stored takes priority; derived is the automatic fallback
  const active: WorkspaceId = storedActive ?? derived ?? "institution";

  // Auto-persist derived workspace so sidebar and AppSidebar always agree
  useEffect(() => {
    if (!storedActive && derived) {
      writeActive(derived);
      setStoredActive(derived);
    }
  }, [storedActive, derived]);

  const workspaces = getWorkspacesForUser(user);

  const setActive = useCallback((id: WorkspaceId) => {
    writeActive(id);
    setStoredActive(id);
  }, []);

  const clearActive = useCallback(() => {
    writeActive(null);
    setStoredActive(null);
  }, []);

  return { user, workspaces, active, setActive, clearActive };
}
