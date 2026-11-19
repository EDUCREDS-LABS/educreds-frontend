/**
 * Verifier Billing — /verifier/billing/plan
 */

import { useQuery } from "@tanstack/react-query";
import { CreditCard, CheckCircle, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export default function VerifierBillingPage() {
  const { data: sub, isLoading } = useQuery({
    queryKey: ["verifier-subscription"],
    queryFn: async () => {
      try { return await (api as any).getVerifierSubscription?.(); } catch { return null; }
    },
    staleTime: 120_000,
  });

  const rawPlanName = sub?.planName ?? sub?.plan ?? "Free";
  const planName = rawPlanName === "Starter" ? "Starter (30-day trial)" : (rawPlanName === "Professional" ? "Pro" : rawPlanName);
  const verifications = sub?.usage?.verifications ?? 0;
  const verificationLimit = sub?.limits?.verifications ?? 100;
  const pct = verificationLimit ? Math.round((verifications / verificationLimit) * 100) : 0;

  const plans = [
    {
      name: "Starter (30-day trial)",
      price: "$0",
      period: "/mo",
      features: ["100 verifications/mo", "Single user", "EVF Professional", "Email support"],
      current: planName === "Free" || planName === "Starter (30-day trial)",
    },
    {
      name: "Professional",
      price: "$130",
      period: "/mo",
      features: ["5,000 verifications/mo", "5 users", "Bulk screening CSV", "Priority support", "Analytics"],
      current: planName === "Professional",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      features: ["Unlimited verifications", "Unlimited users", "SSO / SAML", "SLA guarantee", "Dedicated support"],
      current: planName === "Enterprise",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Plan & Billing</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your verifier subscription</p>
      </div>

      {/* Current usage */}
      {isLoading
        ? <Skeleton className="h-32 rounded-[24px]" />
        : (
          <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Current Plan</p>
                  <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-1">{planName}</p>
                </div>
                <Badge className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-0 font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                  Active
                </Badge>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-neutral-500 mb-2">
                  <span>Verifications used</span>
                  <span>{verifications.toLocaleString()} / {verificationLimit.toLocaleString()}</span>
                </div>
                <Progress value={pct} className="h-2 rounded-full" />
                {pct >= 80 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
                    Approaching your monthly limit — consider upgrading
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "rounded-[24px] border-none shadow-md overflow-hidden",
              plan.highlight
                ? "bg-blue-600 dark:bg-blue-700 text-white"
                : "bg-white dark:bg-neutral-900"
            )}
          >
            <CardContent className="p-6 space-y-5">
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", plan.highlight ? "text-blue-100" : "text-neutral-400")}>
                  {plan.name}
                </p>
                <p className={cn("text-3xl font-black mt-1", plan.highlight ? "text-white" : "text-neutral-900 dark:text-neutral-100")}>
                  {plan.price}<span className={cn("text-sm font-medium ml-1", plan.highlight ? "text-blue-200" : "text-neutral-400")}>{plan.period}</span>
                </p>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className={cn("flex items-center gap-2 text-xs font-medium", plan.highlight ? "text-blue-100" : "text-neutral-600 dark:text-neutral-400")}>
                    <CheckCircle className={cn("size-3.5 shrink-0", plan.highlight ? "text-blue-200" : "text-emerald-500")} />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.current
                ? <Badge className={cn("w-full justify-center py-2 rounded-xl border-0 font-black text-xs uppercase tracking-widest", plan.highlight ? "bg-white/20 text-white" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400")}>
                    Current plan
                  </Badge>
                : <Button
                    className={cn("w-full rounded-xl font-bold gap-2", plan.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 hover:bg-blue-700 text-white")}
                    size="sm"
                  >
                    {plan.name === "Enterprise" ? "Contact sales" : "Upgrade"} <ArrowRight className="size-3.5" />
                  </Button>
              }
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
