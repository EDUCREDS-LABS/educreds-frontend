import { useNavigate } from "react-router-dom";
import { Building2, GraduationCap, Briefcase, Landmark, Code2, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WORKSPACES, getWorkspaceDef, type WorkspaceId } from "@/lib/workspaces";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const WORKSPACE_ICONS: Record<WorkspaceId, LucideIcon> = {
  institution: Building2,
  student: GraduationCap,
  verifier: Briefcase,
  government: Landmark,
  developer: Code2,
  admin: ShieldCheck,
};

interface WorkspaceSelectorProps {
  workspaces: WorkspaceId[];
  onSelect: (id: WorkspaceId) => void;
  onCancel?: () => void;
}

/**
 * Phase0 — "Select Workspace" screen.
 *
 * Shown after login when a user belongs to more than one workspace (Azure
 * tenant/subscription picker behaviour). Picking a tile enters that workspace.
 */
export function WorkspaceSelector({ workspaces, onSelect, onCancel }: WorkspaceSelectorProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-neutral-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="size-8 rounded-xl bg-[#0057FF] flex items-center justify-center text-white font-black text-sm">
              E
            </div>
            <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100">
              EduCreds Trust Platform
            </span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
            Select Workspace
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Choose the workspace you want to enter. Each is a separate product built on the same trust platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((id) => {
            const def = getWorkspaceDef(id);
            const Icon = WORKSPACE_ICONS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className="group text-left rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm hover:shadow-md hover:border-[#0057FF]/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0057FF]/40"
              >
                <div className="size-12 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] flex items-center justify-center mb-4 group-hover:bg-[#0057FF] group-hover:text-white transition-colors">
                  <Icon className="size-6" />
                </div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {def.label}
                </h2>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {def.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Back to login
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate("/")}>
            Go to public site
          </Button>
        </div>
      </div>
    </div>
  );
}

export { WORKSPACE_ICONS };
