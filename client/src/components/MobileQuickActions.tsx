import { Link } from "react-router-dom";
import { Search, ShieldCheck, Award, Activity } from "lucide-react";
import { useActiveWorkspace } from "@/lib/useActiveWorkspace";

/**
 * Phase B.5 — Mobile quick-action bar.
 *
 * Real work stays on desktop (AWS/GitHub model). On small screens we surface
 * only the highest-value actions: search, verify, notifications, wallet.
 * Route-connected; not a feature-parity rebuild.
 */
const INSTITUTION_ITEMS = [
  { to: "/institution/overview", icon: Search, label: "Overview" },
  { to: "/institution/certificates", icon: Award, label: "Credentials" },
  { to: "/verify", icon: ShieldCheck, label: "Verify" },
  { to: "/institution/activity", icon: Activity, label: "Activity" },
];

export function MobileQuickActions() {
  const { active } = useActiveWorkspace();
  if ((active ?? "institution") !== "institution") return null;
  const ITEMS = INSTITUTION_ITEMS;
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400 active:text-primary"
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
