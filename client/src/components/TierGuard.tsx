import React from "react";
import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading-skeleton";
import type { DeploymentTier } from "@/lib/deploymentTier";
import { getTierInfo, isConnectorTier } from "@/lib/institutionTiers";

interface TierGuardProps {
  allowedTiers: DeploymentTier[];
  children: React.ReactNode;
}

/** Renders children only for the allowed deployment tiers; otherwise explains why the page is unavailable. */
export function TierGuard({ allowedTiers, children }: TierGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-8 max-w-lg mx-auto mt-20">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  const currentTier = (user?.deploymentTier as DeploymentTier) ?? "workspace";
  if (allowedTiers.includes(currentTier)) return <>{children}</>;

  const current = getTierInfo(currentTier);
  const connector = isConnectorTier(currentTier);
  const reason = connector
    ? `${current.issuance} Manual issuance and record management pages are not used on ${current.short} deployments, so your SIS remains the single source of truth.`
    : "This page manages a student information system connector. It becomes available when your institution moves to a Connected or Enterprise deployment.";

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6" data-testid="tier-guard-restricted">
      <div className="max-w-lg w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0">
            <Lock className="w-5 h-5 text-neutral-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Not part of your deployment tier</h2>
            <p className="text-sm text-neutral-500 mt-1">You are on <span className="font-medium text-neutral-800 dark:text-neutral-200">{current.name}</span>.</p>
          </div>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{reason}</p>
        <p className="text-xs text-neutral-500 mb-6">
          Available on: {allowedTiers.map((t) => getTierInfo(t).name).join(", ")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline" className="flex-1" data-testid="tier-guard-back">
            <Link to="/institution/overview">Back to overview</Link>
          </Button>
          <Button asChild className="flex-1" data-testid="tier-guard-plan">
            <Link to="/institution/subscription">Plan & tiers <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
