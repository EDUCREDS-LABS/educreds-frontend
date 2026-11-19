import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, Check, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  WORKSPACES,
  getWorkspaceDef,
  type WorkspaceId,
} from "@/lib/workspaces";
import { useActiveWorkspace } from "@/lib/useActiveWorkspace";

/**
 * Phase A — Workspace switcher (Azure tenant-picker, top bar).
 *
 * Shows the active workspace and lets a multi-workspace user jump to another
 * without logging out. Single-workspace users see the label only (no menu).
 */
export function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const { workspaces, active, setActive } = useActiveWorkspace();

  if (workspaces.length === 0) return null;

  const current: WorkspaceId = active && workspaces.includes(active)
    ? active
    : workspaces[0];
  const def = getWorkspaceDef(current);
  const canSwitch = workspaces.length > 1;

  const switchTo = (id: WorkspaceId) => {
    setActive(id);
    navigate(WORKSPACES[id].homePath);
  };

  if (!canSwitch) {
    return (
      <div className="flex items-center gap-2 text-xs font-black text-neutral-400 uppercase tracking-[0.2em] hidden md:flex">
        <ShieldCheck className="size-4 text-primary" />
        {def.label} Workspace
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors hidden md:flex"
          aria-label="Switch workspace"
        >
          <ShieldCheck className="size-4 text-primary" />
          <span className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.2em]">
            {def.label}
          </span>
          <ChevronsUpDown className="size-3.5 text-neutral-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72 mt-3 rounded-2xl p-2 border-neutral-200 dark:border-neutral-800 shadow-2xl dark:bg-neutral-900"
        align="start"
        forceMount
      >
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Switch Workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
        {workspaces.map((id) => {
          const w = WORKSPACES[id];
          const isCurrent = id === current;
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => switchTo(id)}
              className="rounded-xl h-12 px-3 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {w.label}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {w.description}
                  </span>
                </div>
                {isCurrent && <Check className="size-4 text-primary" />}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
