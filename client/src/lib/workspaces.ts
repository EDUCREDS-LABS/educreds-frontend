import type { AuthUser } from "@/lib/dualAuth";
import { AuthType } from "@/lib/dualAuth";
import type { DeploymentTier } from "@/lib/deploymentTier";

/**
 * Phase 0 — Workspace layer.
 *
 * EduCreds is ONE platform (cert_backend + EVF + ETA + Identity + Connectors)
 * exposed as SIX workspaces. Each stakeholder logs into a workspace built around
 * their workflow, not the underlying technology. This file is the data model for
 * the six workspaces; `capabilityMatrix.ts` defines what each one can do, and
 * `workspaceResolver.ts` decides which workspace(s) a user may enter.
 *
 * This is intentionally data, not routes: navigation is generated from the
 * capability matrix so a persona only ever sees the functions relevant to them.
 */

export type WorkspaceId =
  | "institution"
  | "student"
  | "verifier"
  | "government"
  | "developer"
  | "admin";

export interface WorkspaceDef {
  id: WorkspaceId;
  /** Human label shown on the Select Workspace tiles. */
  label: string;
  /** Short descriptor under the label. */
  description: string;
  /** Landing route once inside the workspace. */
  homePath: string;
  /** Which institution deployment tiers apply inside this workspace (institution-only concept). */
  supportedTiers?: DeploymentTier[];
}

export const WORKSPACES: Record<WorkspaceId, WorkspaceDef> = {
  institution: {
    id: "institution",
    label: "Academic Institution",
    description: "Issue, manage, and verify credentials for your institution.",
    homePath: "/institution/overview",
    supportedTiers: ["workspace", "cloud-connector", "enterprise-connector"],
  },
  student: {
    id: "student",
    label: "Student",
    description: "Your credentials, identity, and sharing controls.",
    homePath: "/student/login",
  },
  verifier: {
    id: "verifier",
    label: "Employer / Verifier",
    description: "Verify credentials and review verification requests.",
    homePath: "/employer/verify",
  },
  government: {
    id: "government",
    label: "Government",
    description: "Monitor institutional trust across the national network.",
    homePath: "/government/dashboard",
  },
  developer: {
    id: "developer",
    label: "Developer",
    description: "API keys, SDKs, webhooks, and integration tooling.",
    homePath: "/developer-portal",
  },
  admin: {
    id: "admin",
    label: "EduCreds Administration",
    description: "Platform operations, governance, and infrastructure.",
    homePath: "/admin/dashboard",
  },
};

export const WORKSPACE_ORDER: WorkspaceId[] = [
  "institution",
  "student",
  "verifier",
  "government",
  "developer",
  "admin",
];

const MEMBERSHIP_OVERRIDE_KEY = "educreds_workspace_membership";

/**
 * The backend currently issues institution / student / marketplace auth types.
 * The verifier / government / developer / admin workspaces are reachable once
 * the platform issues the corresponding memberships (future backend claims) or a
 * developer override is set. We persist an override in sessionStorage so the
 * workspace layer is real and testable today, and so future backend claims can
 * simply call `setWorkspaceMembership`.
 */
export function getWorkspaceMembership(): WorkspaceId[] | null {
  try {
    const raw = window.sessionStorage.getItem(MEMBERSHIP_OVERRIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceId[];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((w) => w in WORKSPACES);
  } catch {
    return null;
  }
}

export function setWorkspaceMembership(ids: WorkspaceId[]): void {
  try {
    window.sessionStorage.setItem(MEMBERSHIP_OVERRIDE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function clearWorkspaceMembership(): void {
  try {
    window.sessionStorage.removeItem(MEMBERSHIP_OVERRIDE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Derive the workspaces a user may enter.
 *
 * Base membership comes from the authenticated auth type; an explicit membership
 * override (backend claims / dev override) expands it. An institution admin who
 * is also a developer, for example, would see both workspaces.
 */
export function getWorkspacesForUser(user: AuthUser | null | undefined): WorkspaceId[] {
  if (!user) return [];

  const base: WorkspaceId[] = [];
  switch (user.type) {
    case AuthType.INSTITUTION:
      base.push("institution");
      break;
    case AuthType.STUDENT:
      base.push("student");
      break;
    case AuthType.DEVELOPER:
      base.push("developer");
      break;
    case AuthType.VERIFIER:
      base.push("verifier");
      break;
    case AuthType.GOVERNMENT:
      base.push("government");
      break;
    // MARKETPLACE auth type is retained for backward compatibility but maps to no
    // active workspace (the Marketplace feature was removed).
    default:
      break;
  }

  const override = getWorkspaceMembership();
  if (override && override.length > 0) {
    const merged = new Set<WorkspaceId>([...base, ...override]);
    return WORKSPACE_ORDER.filter((id) => merged.has(id));
  }

  return base;
}

export function getWorkspaceDef(id: WorkspaceId): WorkspaceDef {
  return WORKSPACES[id];
}
