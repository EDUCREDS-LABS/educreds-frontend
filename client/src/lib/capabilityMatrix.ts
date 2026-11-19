import {
  LayoutDashboard, User, GraduationCap, Award, ShieldCheck, Shield, LineChart,
  Plug, Code2, Settings, CreditCard, FileText, Zap, Palette, ScrollText,
  Package, Webhook, Activity, Link2, Key, Vote,
  Globe, Building2, Landmark, Users, BarChart3,
  Network, Server, Gavel, AlertTriangle, History,
  Share2, Eye, Bell, Search, Star, BookOpen, Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DeploymentTier } from "@/lib/deploymentTier";
import type { WorkspaceId } from "@/lib/workspaces";

/**
 * Capability Matrix — single source of truth for workspace navigation.
 *
 * Labels reflect business outcomes, never technology:
 *   EVF             → Verification
 *   DID / IIN       → Organization Identity / My Identity
 *   PoIC            → Trust Score
 *   Connector Agent → Integrations
 *   Trust Agent     → Trust Intelligence
 *   Blockchain      → Credential Integrity (internal only)
 *
 * Navigation is generated from this; no hardcoded routes in sidebars.
 */

export interface NavCapability {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  tiers?: DeploymentTier[];
  children?: NavCapability[];
}

export interface WorkspaceCapabilities {
  primary: NavCapability[];
  secondary: NavCapability[];
}

// ── Institution workspace ────────────────────────────────────────────────────
// One navigation tree grouped by product pillar. `tiers` limits an item to the
// deployment tiers that can actually use it (workspace is Tier 3, cloud-connector
// is Tier 2, enterprise-connector is Tier 1). Items without `tiers` are
// available to every institution.
const T1: DeploymentTier[] = ["workspace"];
const CONNECTED: DeploymentTier[] = ["cloud-connector", "enterprise-connector"];

const institutionNav: NavCapability[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard, path: "/institution/overview" },
  {
    id: "credentials", label: "Credentials", icon: Award, path: "#", children: [
      { id: "certificates",    label: "All credentials",    icon: FileText, path: "/institution/certificates" },
      { id: "issue",           label: "Issue credential",   icon: Zap,      path: "/institution/issue", tiers: T1 },
      { id: "bulk-issue",      label: "Bulk issuance",      icon: Package,  path: "/institution/bulk-issue", tiers: T1 },
      { id: "lms-import",      label: "LMS import",         icon: Package,  path: "/institution/lms-import", tiers: T1 },
      { id: "activity",        label: "Issuance activity",  icon: Activity, path: "/institution/activity" },
      { id: "credential-branding", label: "Credential design", icon: Palette, path: "/institution/credential-design" },
    ],
  },
  {
    id: "academic", label: "Academic records", icon: GraduationCap, path: "#", tiers: T1, children: [
      { id: "students",   label: "Students",   icon: GraduationCap, path: "/institution/students" },
      { id: "programs",   label: "Programmes", icon: BookOpen,      path: "/institution/programs" },
      { id: "cohorts",    label: "Cohorts",    icon: Network,       path: "/institution/cohorts" },
      { id: "enrollment", label: "Enrolment",  icon: Users,         path: "/institution/enrollment" },
    ],
  },
  {
    id: "identity", label: "Institutional identity", icon: Building2, path: "#", children: [
      { id: "profile",        label: "Profile",            icon: Building2,   path: "/institution/profile" },
      { id: "did",            label: "Identity & keys",    icon: Key,         path: "/institution/did-management" },
      { id: "trust-score",    label: "Trust score (PoIC)", icon: Star,        path: "/compliance/trust-score" },
      { id: "trust-overview", label: "Trust intelligence", icon: ShieldCheck, path: "/compliance/enterprise-overview" },
    ],
  },
  {
    id: "integrations", label: "Integrations", icon: Plug, path: "#", children: [
      { id: "connector",         label: "SIS connector",     icon: Link2,    path: "/connect/connector", tiers: CONNECTED },
      { id: "data-mapping",      label: "Data mapping",      icon: Network,  path: "/connect/data-mapping", tiers: CONNECTED },
      { id: "health",            label: "Connection health", icon: Activity, path: "/connect/health-dashboard", tiers: CONNECTED },
      { id: "delegated-signing", label: "Delegated signing", icon: Shield,   path: "/connect/delegated-signing", tiers: CONNECTED },
      { id: "api-access",        label: "API keys",          icon: Code2,    path: "/connect/api-keys" },
      { id: "webhooks",          label: "Webhooks",          icon: Webhook,  path: "/institution/webhooks" },
    ],
  },
  {
    id: "oversight", label: "Governance & reports", icon: LineChart, path: "#", children: [
      { id: "analytics",   label: "Reports & analytics", icon: BarChart3,  path: "/institution/analytics", tiers: T1 },
      { id: "audit-trail", label: "Audit trail",         icon: ScrollText, path: "/institution/audit-trail", tiers: T1 },
      { id: "governance",  label: "Governance",          icon: Vote,       path: "/institution/governance-workspace" },
    ],
  },
];

const institutionSecondary: NavCapability[] = [
  { id: "staff",       label: "Team & access",   icon: Users,      path: "/institution/staff" },
  { id: "billing",     label: "Plan & billing",  icon: CreditCard, path: "/institution/subscription" },
  { id: "white-label", label: "White label",     icon: Palette,    path: "/institution/white-label", tiers: T1 },
  { id: "settings",    label: "Settings",        icon: Settings,   path: "/institution/settings" },
];

function filterByTier(items: NavCapability[], tier: DeploymentTier): NavCapability[] {
  return items
    .filter((i) => !i.tiers || i.tiers.includes(tier))
    .map((i) => (i.children ? { ...i, children: filterByTier(i.children, tier) } : i))
    .filter((i) => !i.children || i.children.length > 0);
}

/** Flat list of every institution page reachable for a tier (used by search). */
export function getInstitutionPages(tier: DeploymentTier = "workspace"): NavCapability[] {
  const flat = (items: NavCapability[]): NavCapability[] =>
    items.flatMap((i) => (i.children ? flat(i.children) : [i]));
  return flat([...filterByTier(institutionNav, tier), ...institutionSecondary]);
}

// ── Student workspace ──────────────────────────────────────────────────────────
const studentCapabilities: NavCapability[] = [
  { id: "dashboard",       label: "Dashboard",              icon: LayoutDashboard, path: "/student/dashboard" },
  { id: "my-credentials",  label: "My Credentials",         icon: Award,           path: "/student/credentials" },
  { id: "my-identity",     label: "My Identity",            icon: User,            path: "/student/identity" },
  { id: "activity",        label: "Verification Activity",  icon: Eye,             path: "/student/activity" },
  { id: "campaigns",      label: "Campaigns",              icon: Target,          path: "/student/campaigns" },
  // Note: Share Credential is intentionally omitted from the sidebar.
  // Sharing requires a specific credential ID and is accessed per-credential
  // from the My Credentials page (share button on each credential card).
];

const studentSecondary: NavCapability[] = [
  { id: "settings", label: "Settings", icon: Settings, path: "/student/settings" },
];

// ── Verifier workspace ─────────────────────────────────────────────────────────
const verifierCapabilities: NavCapability[] = [
  { id: "dashboard",     label: "Dashboard",            icon: LayoutDashboard, path: "/verifier/dashboard" },
  { id: "verify",        label: "Verify Credential",    icon: ShieldCheck,     path: "/verifier/verify" },
  { id: "bulk",          label: "Bulk Screening",       icon: Users,           path: "/verifier/verify" },
  { id: "queue",         label: "Verification Queue",   icon: Activity,        path: "/verifier/queue" },
  { id: "history",       label: "History",              icon: History,         path: "/verifier/history" },
  { id: "analytics",     label: "Analytics",            icon: BarChart3,       path: "/verifier/analytics" },
  { id: "api",           label: "API Access",           icon: Code2,           path: "/verifier/api-access" },
];

const verifierSecondary: NavCapability[] = [
  { id: "billing",  label: "Billing",  icon: CreditCard, path: "/verifier/billing/plan" },
  { id: "settings", label: "Settings", icon: Settings,   path: "/verifier/settings" },
];

// ── Government workspace ───────────────────────────────────────────────────────
const governmentCapabilities: NavCapability[] = [
  { id: "dashboard",        label: "Control Center",            icon: LayoutDashboard, path: "/government/dashboard" },
  { id: "institutions",     label: "Institution Registry",      icon: Building2,       path: "/government/institutions" },
  { id: "accreditation",    label: "Accreditation",             icon: Gavel,           path: "/government/accreditation" },
  { id: "trust-monitoring", label: "Trust Monitoring",          icon: ShieldCheck,     path: "/government/trust-monitoring" },
  { id: "investigations",   label: "Investigations & Fraud",    icon: AlertTriangle,   path: "/government/investigations" },
  { id: "analytics",        label: "National Analytics",        icon: LineChart,       path: "/government/analytics" },
  { id: "api",              label: "API Access",                icon: Code2,           path: "/government/api-access" },
];

const governmentSecondary: NavCapability[] = [
  { id: "export",   label: "Export Reports", icon: Share2,   path: "/government/analytics" },
  { id: "settings", label: "Settings",       icon: Settings, path: "/government/dashboard" },
];

// ── Developer workspace ────────────────────────────────────────────────────────
const developerCapabilities: NavCapability[] = [
  { id: "overview",  label: "Overview",         icon: LayoutDashboard, path: "/developer-portal" },
  { id: "api-keys",  label: "API Keys",         icon: Key,             path: "/developer-portal" },
  { id: "sandbox",   label: "API Explorer",     icon: Server,          path: "/developer-portal/api-explorer" },
  { id: "webhooks",  label: "Webhooks",         icon: Webhook,         path: "/developer-portal/webhooks" },
  { id: "sdks",      label: "SDKs & Libraries", icon: Code2,           path: "/developer-portal" },
  { id: "docs",      label: "Documentation",    icon: BookOpen,        path: "/documentation" },
  { id: "usage",     label: "Usage",            icon: BarChart3,       path: "/developer-portal/usage" },
  { id: "logs",      label: "Logs",             icon: ScrollText,      path: "/developer-portal" },
];

const developerSecondary: NavCapability[] = [];

// ── Admin workspace ────────────────────────────────────────────────────────────
const adminCapabilities: NavCapability[] = [
  { id: "dashboard",      label: "Dashboard",              icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "organizations",  label: "Organizations",          icon: Network,         path: "/admin/dashboard" },
  { id: "institutions",   label: "Institutions",           icon: Building2,       path: "/admin/users" },
  { id: "governance",     label: "Governance",             icon: Gavel,           path: "/admin/governance" },
  { id: "billing",        label: "Billing",                icon: CreditCard,      path: "/admin/dashboard" },
  { id: "infrastructure", label: "System Operations",      icon: Server,          path: "/admin/infrastructure" },
  { id: "support",        label: "Support",                icon: Users,           path: "/admin/users" },
  { id: "monitoring",     label: "Monitoring",             icon: Activity,        path: "/admin/observability" },
  { id: "trust-policies", label: "Trust Score Policies",   icon: Star,            path: "/admin/governance" },
  { id: "feature-flags",  label: "Feature Flags",          icon: Settings,        path: "/admin/dashboard" },
  { id: "audit",          label: "Audit Logs",             icon: ScrollText,      path: "/admin/audit" },
  { id: "incidents",      label: "Incidents",              icon: AlertTriangle,   path: "/admin/observability" },
  { id: "trust-layer",    label: "Enterprise Trust Layer", icon: ShieldCheck,     path: "/trust-layer" },
];

const adminSecondary: NavCapability[] = [];

// ── Matrix ─────────────────────────────────────────────────────────────────────
const MATRIX: Record<WorkspaceId, WorkspaceCapabilities> = {
  institution: { primary: institutionNav, secondary: institutionSecondary },
  student:     { primary: studentCapabilities,     secondary: studentSecondary    },
  verifier:    { primary: verifierCapabilities,    secondary: verifierSecondary   },
  government:  { primary: governmentCapabilities,  secondary: governmentSecondary },
  developer:   { primary: developerCapabilities,   secondary: developerSecondary  },
  admin:       { primary: adminCapabilities,       secondary: adminSecondary      },
};

/**
 * Filter nav capabilities for staff members with allowedTabs restrictions.
 * If the user is a staff member (role === 'staff') and has an allowedTabs array,
 * only nav items whose id is in allowedTabs are shown.
 * An empty allowedTabs array means no restriction (all tabs visible).
 */
export function filterCapabilitiesForStaff(
  capabilities: WorkspaceCapabilities,
  allowedTabs: string[] | null | undefined,
): WorkspaceCapabilities {
  if (!allowedTabs || allowedTabs.length === 0) return capabilities;
  // Overview is always visible; ids match the staff tab ids in staff-management.
  const tabs = [...allowedTabs, "dashboard"];

  function filterItems(items: NavCapability[]): NavCapability[] {
    return items
      .filter(item => tabs.includes(item.id) || (item.children && item.children.some(c => tabs.includes(c.id))))
      .map(item => ({
        ...item,
        children: item.children ? item.children.filter(c => tabs.includes(c.id)) : undefined,
      }));
  }

  return {
    primary: filterItems(capabilities.primary),
    secondary: filterItems(capabilities.secondary),
  };
}

export function getCapabilitiesForWorkspace(
  workspace: WorkspaceId,
  tier?: DeploymentTier | null,
  staffAllowedTabs?: string[] | null,
): WorkspaceCapabilities {
  if (workspace === "institution") {
    const caps = {
      primary: filterByTier(institutionNav, tier ?? "workspace"),
      secondary: institutionSecondary,
    };
    return staffAllowedTabs && staffAllowedTabs.length > 0
      ? filterCapabilitiesForStaff(caps, staffAllowedTabs)
      : caps;
  }
  return MATRIX[workspace];
}
