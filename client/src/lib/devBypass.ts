import { AuthType } from "@/lib/dualAuth";
import {
  setAuthItem,
  setSessionBackedItem,
} from "@/lib/authStorage";

export const DEV_BYPASS_AUTH =
  import.meta.env.DEV &&
  String(import.meta.env.VITE_BYPASS_AUTH ?? "false").toLowerCase() === "true";

const INSTITUTION_TOKEN = String(import.meta.env.VITE_DEV_BYPASS_TOKEN ?? "").trim();
const STUDENT_TOKEN     = String(import.meta.env.VITE_DEV_BYPASS_STUDENT_TOKEN ?? "").trim();
const ADMIN_TOKEN       = String(import.meta.env.VITE_DEV_BYPASS_ADMIN_TOKEN ?? "").trim();
const VERIFIER_TOKEN    = String(import.meta.env.VITE_DEV_BYPASS_VERIFIER_TOKEN ?? "").trim();
const GOVERNMENT_TOKEN  = String(import.meta.env.VITE_DEV_BYPASS_GOVERNMENT_TOKEN ?? "").trim();
const DEVELOPER_TOKEN   = String(import.meta.env.VITE_DEV_BYPASS_DEVELOPER_TOKEN ?? "").trim();

export type DevBypassRole = "institution" | "student" | "verifier" | "government" | "developer";

export function getDevBypassRole(): DevBypassRole {
  if (typeof window === "undefined") return "institution";
  const fromQuery = new URLSearchParams(window.location.search).get("as");
  const validRoles: DevBypassRole[] = ["institution", "student", "verifier", "government", "developer"];
  if (fromQuery && validRoles.includes(fromQuery as DevBypassRole)) {
    window.sessionStorage.setItem("dev_bypass_role", fromQuery);
    return fromQuery as DevBypassRole;
  }
  const stored = window.sessionStorage.getItem("dev_bypass_role");
  return (validRoles.includes(stored as DevBypassRole) ? stored : "institution") as DevBypassRole;
}

const ACTIVE_WORKSPACE_KEY = "educreds_active_workspace";

/** Seed local session tokens so protected routes and commercial APIs work without login. */
export function ensureDevBypassSession(role: DevBypassRole = getDevBypassRole()) {
  if (!DEV_BYPASS_AUTH || typeof window === "undefined") return;

  // Set active workspace to match role so AppSidebar switches immediately
  const roleToWorkspace: Record<DevBypassRole, string> = {
    institution: "institution", student: "student",
    verifier: "verifier", government: "government", developer: "developer",
  };
  try { window.sessionStorage.setItem(ACTIVE_WORKSPACE_KEY, roleToWorkspace[role]); } catch { /* ignore */ }

  if (role === "student" && STUDENT_TOKEN) {
    setAuthItem("student_token", STUDENT_TOKEN);
    setAuthItem("student_user", JSON.stringify({
      id: "dev-student-1",
      email: "student@educreds.local",
      name: "Dev Student",
      type: AuthType.STUDENT,
    }));
    setAuthItem("auth_type", AuthType.STUDENT);

  } else if (role === "verifier") {
    const token = VERIFIER_TOKEN || "dev-verifier-token";
    setAuthItem("verifier_token", token);
    setAuthItem("verifier_user", JSON.stringify({
      id: "dev-verifier-1",
      email: "verifier@educreds.local",
      name: "Dev Verifier Org",
      type: AuthType.VERIFIER,
      organizationName: "Dev Verify Co.",
      subscriptionPlan: "Starter",
    }));
    setAuthItem("auth_type", AuthType.VERIFIER);

  } else if (role === "government") {
    const token = GOVERNMENT_TOKEN || "dev-government-token";
    setAuthItem("government_token", token);
    setAuthItem("government_user", JSON.stringify({
      id: "dev-government-1",
      email: "gov@educreds.local",
      name: "Dev Ministry",
      type: AuthType.GOVERNMENT,
    }));
    setAuthItem("auth_type", AuthType.GOVERNMENT);

  } else if (role === "developer") {
    const token = DEVELOPER_TOKEN || "dev-developer-token";
    setAuthItem("developer_token", token);
    setAuthItem("developer_user", JSON.stringify({
      id: "dev-developer-1",
      email: "dev@educreds.local",
      name: "Dev Developer",
      type: AuthType.DEVELOPER,
      organizationName: "Dev Corp",
    }));
    setAuthItem("auth_type", AuthType.DEVELOPER);

  } else if (INSTITUTION_TOKEN) {
    setAuthItem("institution_token", INSTITUTION_TOKEN);
    setAuthItem("institution_user", JSON.stringify({
      id: "dev-institution-1",
      email: "dev@educreds.local",
      name: "Dev Institution",
      type: AuthType.INSTITUTION,
      deploymentTier: String(import.meta.env.VITE_BYPASS_AUTH_TIER ?? "workspace"),
    }));
    setAuthItem("auth_type", AuthType.INSTITUTION);
  }

  if (ADMIN_TOKEN) {
    setSessionBackedItem("admin_token", ADMIN_TOKEN);
    try {
      window.localStorage.setItem("admin_token", ADMIN_TOKEN);
    } catch { /* ignore */ }
  }
}
