import { useNavigate } from "react-router-dom";
import { Plus, FileText, Palette, Key, Link2, User, Webhook, ShieldCheck, Share2, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveWorkspace } from "@/lib/useActiveWorkspace";
import type { WorkspaceId } from "@/lib/workspaces";
import { useAuth } from "@/hooks/useAuth";
import { isConnectorTier } from "@/lib/institutionTiers";

interface QuickCreateAction {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Only for hosted (Tier 1) or connector (Tier 2/3) institutions. */
  only?: "hosted" | "connector";
}

/** Phase B.1 — workspace-scoped Quick Create catalog.
 *  Each workspace surfaces only the create actions relevant to its users,
 *  matching the Azure "Create" dropdown behaviour. */
const QUICK_CREATE: Record<WorkspaceId, QuickCreateAction[]> = {
  institution: [
    { label: "Issue credential", icon: FileText, path: "/institution/issue", only: "hosted" },
    { label: "Bulk issuance", icon: Palette, path: "/institution/bulk-issue", only: "hosted" },
    { label: "SIS connector", icon: Link2, path: "/connect/connector", only: "connector" },
    { label: "Invite team member", icon: User, path: "/institution/staff" },
    { label: "API key", icon: Key, path: "/connect/api-keys" },
    { label: "Webhook", icon: Webhook, path: "/institution/webhooks" },
  ],
  student: [
    { label: "Share Credential", icon: Share2, path: "/student/login" },
  ],
  verifier: [
    { label: "Verification Request", icon: Search, path: "/verifier/verify" },
  ],
  government: [
    { label: "Institution Review", icon: ShieldCheck, path: "/compliance/enterprise-overview" },
  ],
  developer: [
    { label: "API Key", icon: Key, path: "/developer-portal" },
    { label: "Webhook", icon: Webhook, path: "/developer-portal" },
  ],
  admin: [
    { label: "Organization", icon: User, path: "/admin/users" },
    { label: "Policy", icon: ShieldCheck, path: "/admin/governance" },
  ],
};

export function QuickCreateButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaces, active } = useActiveWorkspace();
  if (workspaces.length === 0) return null;

  const current: WorkspaceId = active && workspaces.includes(active) ? active : workspaces[0];
  const connector = isConnectorTier(user?.deploymentTier);
  const actions = (QUICK_CREATE[current] ?? []).filter(
    (a) => !a.only || (a.only === "connector" ? connector : !connector),
  );
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="hidden md:flex items-center gap-2 bg-[#0057FF] hover:bg-[#0057FF]/90 text-white rounded-xl h-10 px-4 shadow-sm"
          aria-label="Quick create"
          data-testid="header-quick-create"
        >
          <Plus className="size-4" />
          <span className="text-sm font-bold">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60 mt-3 rounded-2xl p-2 border-neutral-200 dark:border-neutral-800 shadow-2xl dark:bg-neutral-900"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Create New
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              data-testid={`quick-create-${action.path.split("/").pop()}`}
              onClick={() => navigate(action.path)}
              className="rounded-xl h-11 px-3 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer"
            >
              <Icon className="mr-3 size-4 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {action.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
