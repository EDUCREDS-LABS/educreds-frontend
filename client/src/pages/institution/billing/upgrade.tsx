/**
 * Institution Billing — Upgrade / Plan Comparison
 * Shows Starter / Professional / Enterprise plan cards.
 * Current plan highlighted. Usage progress bar. Upgrade CTA.
 * Real API via api lib; shows "—" if unavailable.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, Zap, Star, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Plan {
  planKey: string;
  name: string;
  price: number | null;
  currency: string;
  interval: string;
  contactSales: boolean;
  features: string[];
  entitlements?: Record<string, string | number>;
}

// ── Plan icon map ─────────────────────────────────────────────────────────────

const PLAN_ICON: Record<string, React.ElementType> = {
  starter:      Zap,
  professional: Star,
  enterprise:   Building2,
};

const PLAN_COLOR: Record<string, string> = {
  starter:      "border-blue-200 dark:border-blue-900/50",
  professional: "border-purple-400 dark:border-purple-600",
  enterprise:   "border-amber-300 dark:border-amber-700",
};

const PLAN_HIGHLIGHT: Record<string, string> = {
  starter:      "",
  professional: "ring-2 ring-purple-400 dark:ring-purple-600",
  enterprise:   "ring-2 ring-amber-300 dark:ring-amber-700",
};

function formatPrice(price: number | null, currency: string, interval: string): string {
  if (price == null) return "—";
  if (price === 0) return "Free";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() || "USD",
    minimumFractionDigits: 0,
  }).format(price / 100);
  return `${formatted} / ${interval}`;
}

function planSlug(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("enterprise")) return "enterprise";
  if (n.includes("professional") || n.includes("pro")) return "professional";
  return "starter";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const { toast } = useToast();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["commercial-plans", "institution"],
    queryFn: () => api.listCommercialPlans("institution"),
    retry: 1,
  });

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ["commercial-subscription", "institution"],
    queryFn: () => api.getCommercialSubscription("institution"),
    retry: 1,
  });

  const { data: usageData } = useQuery({
    queryKey: ["commercial-usage", "institution"],
    queryFn: () => api.getCommercialUsage("institution"),
    retry: 1,
  });

  const checkoutMutation = useMutation({
    mutationFn: (planKey: string) =>
      api.createCommercialCheckout({ workspace: "institution", planKey }),
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
      else toast({ title: "Contact sales", description: "This plan requires a sales conversation." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => setCheckingOut(null),
  });

  const plans: Plan[] = Array.isArray((plansData as any)?.plans)
    ? (plansData as any).plans
    : Array.isArray(plansData)
      ? plansData as Plan[]
      : [];

  const currentPlanKey = (subData as any)?.planKey as string | undefined;
  const usedCredentials = (usageData as any)?.credentialsIssued ?? (usageData as any)?.used ?? null;
  const limitCredentials = (usageData as any)?.credentialLimit ?? (usageData as any)?.limit ?? null;
  const usagePct =
    usedCredentials != null && limitCredentials != null && limitCredentials > 0
      ? Math.min(100, Math.round((usedCredentials / limitCredentials) * 100))
      : null;

  const isLoading = plansLoading || subLoading;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Upgrade Your Plan</h1>
        <p className="text-sm text-neutral-500 mt-1">Compare plans and unlock more features for your institution.</p>
      </div>

      {/* Usage bar */}
      {usagePct != null && (
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-neutral-700 dark:text-neutral-300">Credential Usage</span>
              <span className="text-neutral-500">
                {usedCredentials ?? "—"} / {limitCredentials ?? "∞"} issued
              </span>
            </div>
            <Progress
              value={usagePct}
              className={cn("h-2.5 rounded-full", usagePct > 90 ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-500")}
            />
            <p className="text-xs text-neutral-400">{usagePct}% of monthly quota used</p>
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-12">Plan information unavailable — please contact support.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const slug = planSlug(plan.name);
            const Icon = PLAN_ICON[slug] ?? Zap;
            const isCurrent = currentPlanKey === plan.planKey;
            const borderCls = PLAN_COLOR[slug] ?? "";
            const ringCls = PLAN_HIGHLIGHT[slug] ?? "";

            return (
              <Card
                key={plan.planKey}
                className={cn(
                  "rounded-2xl border-2 flex flex-col transition-all",
                  borderCls,
                  ringCls,
                  isCurrent && "bg-blue-50/40 dark:bg-blue-950/20"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "p-2 rounded-xl",
                      slug === "starter" ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600" :
                      slug === "professional" ? "bg-purple-100 dark:bg-purple-950/40 text-purple-600" :
                      "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                    )}>
                      <Icon className="size-5" />
                    </div>
                    {isCurrent && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-xs font-bold rounded-lg">
                        Current Plan
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                    {plan.name}
                  </CardTitle>
                  <p className="text-xl font-black text-neutral-800 dark:text-neutral-200 mt-1">
                    {plan.contactSales
                      ? "Contact Sales"
                      : formatPrice(plan.price, plan.currency, plan.interval)}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2 flex-1">
                    {(plan.features ?? []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {(plan.features ?? []).length === 0 && (
                      <li className="text-sm text-neutral-400">—</li>
                    )}
                  </ul>
                  <Button
                    className={cn(
                      "w-full rounded-xl font-bold gap-2",
                      isCurrent
                        ? "variant-outline text-neutral-500 cursor-default pointer-events-none opacity-60"
                        : ""
                    )}
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || checkingOut === plan.planKey}
                    onClick={() => {
                      if (plan.contactSales) {
                        toast({ title: "Contact sales", description: "Enterprise plans require a sales conversation." });
                        return;
                      }
                      setCheckingOut(plan.planKey);
                      checkoutMutation.mutate(plan.planKey);
                    }}
                  >
                    {checkingOut === plan.planKey && <Loader2 className="size-4 animate-spin" />}
                    {isCurrent ? "Current Plan" : plan.contactSales ? "Talk to Sales" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
