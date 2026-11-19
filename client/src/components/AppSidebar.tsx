/**
 * AppSidebar — persistent, labelled workspace navigation.
 * Nav comes from the capability matrix (tier- and staff-aware); no hardcoded routes.
 */
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveWorkspace } from "@/lib/useActiveWorkspace";
import { cn } from "@/lib/utils";
import { getCapabilitiesForWorkspace, type NavCapability } from "@/lib/capabilityMatrix";
import { getStaffAllowedTabs } from "@/lib/authStorage";
import type { DeploymentTier } from "@/lib/deploymentTier";
import { getTierInfo } from "@/lib/institutionTiers";

const WORKSPACE_LABELS: Record<string, string> = {
  institution: "Institution console",
  student: "Student wallet",
  verifier: "Verifier portal",
  government: "Government oversight",
  developer: "Developer portal",
  admin: "EduCreds operations",
};

const isPathActive = (pathname: string, url: string) =>
  url !== "#" && (pathname === url || pathname.startsWith(`${url}/`));

function NavLink({ item, pathname, onNavigate, nested }: {
  item: NavCapability; pathname: string; onNavigate?: () => void; nested?: boolean;
}) {
  const active = isPathActive(pathname, item.path);
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      data-testid={`nav-${item.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 text-sm transition-colors",
        nested ? "h-8 pl-9 text-[13px]" : "h-9 font-medium",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
      )}
    >
      {!nested && <Icon className="size-4 shrink-0" />}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroup({ item, pathname, onNavigate }: { item: NavCapability; pathname: string; onNavigate?: () => void }) {
  const children = item.children ?? [];
  const containsActive = children.some((c) => isPathActive(pathname, c.path));
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => { if (containsActive) setOpen(true); }, [containsActive]);
  const Icon = item.icon;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid={`nav-group-${item.id}`}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 h-9 text-sm font-medium transition-colors",
          containsActive ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {children.map((c) => <NavLink key={c.id} item={c} pathname={pathname} onNavigate={onNavigate} nested />)}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({ deploymentTier = "workspace", onNavigate }: {
  deploymentTier?: DeploymentTier;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { active } = useActiveWorkspace();
  const workspaceId = active ?? "institution";
  const isInstitution = workspaceId === "institution";

  const caps = getCapabilitiesForWorkspace(
    workspaceId,
    isInstitution ? deploymentTier : null,
    isInstitution ? getStaffAllowedTabs() : null,
  );
  const tier = isInstitution ? getTierInfo(deploymentTier) : null;

  return (
    <aside
      className="flex h-full w-64 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      data-testid="app-sidebar"
    >
      <Link to={caps.primary[0]?.path ?? "/"} onClick={onNavigate} className="flex items-center gap-3 px-5 h-16 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-4.5" />
        </div>
        <div className="leading-tight">
          <p className="font-bold text-neutral-900 dark:text-neutral-100">EduCreds</p>
          <p className="text-[11px] text-neutral-500">{WORKSPACE_LABELS[workspaceId] ?? "Console"}</p>
        </div>
      </Link>

      {tier && (
        <Link
          to="/institution/subscription"
          onClick={onNavigate}
          data-testid="sidebar-tier-badge"
          className="mx-4 mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2 hover:border-primary/40 transition-colors"
        >
          <p className="text-[11px] uppercase tracking-wider text-neutral-500">Deployment tier</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{tier.name}</p>
        </Link>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Workspace navigation">
        {caps.primary.map((item) =>
          item.children && item.children.length > 0
            ? <NavGroup key={item.id} item={item} pathname={pathname} onNavigate={onNavigate} />
            : <NavLink key={item.id} item={item} pathname={pathname} onNavigate={onNavigate} />,
        )}
        {caps.secondary.length > 0 && (
          <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
            <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-neutral-400">Administration</p>
            {caps.secondary.map((item) => <NavLink key={item.id} item={item} pathname={pathname} onNavigate={onNavigate} />)}
          </div>
        )}
      </nav>

      <div className="border-t border-neutral-100 dark:border-neutral-800 p-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="size-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
            {user?.name?.charAt(0) ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">{user?.name ?? "User"}</p>
            <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            data-testid="sidebar-sign-out"
            className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
