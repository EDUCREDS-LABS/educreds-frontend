/**
 * TrustTierBadge — shows institution trust tier as a small, business-friendly badge.
 *
 * Used in:
 * - VerificationCenter result card (after successful verification)
 * - CredentialCard in student wallet
 * - Public /verify result
 *
 * No score internals exposed to non-institution users — just the tier label.
 */

import { ShieldCheck, Shield, AlertTriangle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TrustTier = "platinum" | "gold" | "silver" | "bronze" | "unverified" | null | undefined;

interface TrustTierBadgeProps {
  tier?: TrustTier;
  score?: number | null;
  showScore?: boolean; // only show score in institution workspace
  size?: "sm" | "md";
  className?: string;
}

const TIER_CFG: Record<Exclude<TrustTier, null | undefined>, {
  label: string;
  icon: typeof ShieldCheck;
  color: string;
  bg: string;
  border: string;
}> = {
  platinum: {
    label: "Platinum Issuer",
    icon: ShieldCheck,
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  gold: {
    label: "Gold Issuer",
    icon: ShieldCheck,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  silver: {
    label: "Silver Issuer",
    icon: Shield,
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
  bronze: {
    label: "Registered Issuer",
    icon: Shield,
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  unverified: {
    label: "Pending Verification",
    icon: AlertTriangle,
    color: "text-neutral-500 dark:text-neutral-400",
    bg: "bg-neutral-50 dark:bg-neutral-800",
    border: "border-neutral-200 dark:border-neutral-700",
  },
};

/** Map a 0–100 score to a tier */
export function scoreToTier(score: number | null | undefined): TrustTier {
  if (score == null) return null;
  if (score >= 90) return "platinum";
  if (score >= 75) return "gold";
  if (score >= 55) return "silver";
  if (score >= 30) return "bronze";
  return "unverified";
}

export function TrustTierBadge({ tier, score, showScore = false, size = "sm", className }: TrustTierBadgeProps) {
  const resolvedTier = tier ?? scoreToTier(score);
  if (!resolvedTier) return null;

  const cfg = TIER_CFG[resolvedTier];
  const Icon = cfg.icon;
  const isSmall = size === "sm";

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 font-black border rounded-full",
        isSmall ? "text-[9px] px-2 py-0.5 tracking-widest uppercase" : "text-[11px] px-3 py-1 tracking-wider uppercase",
        cfg.bg, cfg.color, cfg.border,
        className
      )}
    >
      <Icon className={cn("shrink-0", isSmall ? "size-2.5" : "size-3.5")} />
      {cfg.label}
      {showScore && score != null && (
        <span className="opacity-60 font-bold normal-case">{score}/100</span>
      )}
    </Badge>
  );
}
