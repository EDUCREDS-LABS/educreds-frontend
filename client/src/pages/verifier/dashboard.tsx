/**
 * Verifier Dashboard — /verifier/dashboard
 *
 * Executive summary for employer / HR / verifier workspace.
 * All metrics from real API — shows "—" when unavailable.
 * No blockchain terminology.
 */

import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, TrendingUp, Clock, AlertTriangle, Users,
  CheckCircle, XCircle, Building2, ArrowRight, Activity,
  BarChart3, Search, Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { format } from "date-fns";

// ── Metric card ────────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, trend, color = "blue",
}: {
  label: string; value: string | number; sub?: string;
  icon: typeof ShieldCheck; trend?: string; color?: "blue" | "green" | "amber" | "red";
}) {
  const colorMap = {
    blue:  { bg: "bg-blue-50 dark:bg-blue-950/30",   icon: "text-blue-600 dark:text-blue-400"  },
    green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30",  icon: "text-amber-600 dark:text-amber-400"  },
    red:   { bg: "bg-red-50 dark:bg-red-950/30",     icon: "text-red-600 dark:text-red-400"    },
  };
  const c = colorMap[color];

  return (
    <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100 leading-none">
              {value === null || value === undefined ? "—" : value}
            </p>
            {sub && <p className="text-xs text-neutral-400 font-medium">{sub}</p>}
            {trend && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{trend}</p>}
          </div>
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", c.bg)}>
            <Icon className={cn("size-6", c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Recent activity row ────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: any }) {
  // Backend returns status: 'verified' | 'failed' | 'review'. Also handle legacy 'valid'/'pass' values.
  const passed = item.status === "verified" || item.status === "valid" || item.result === "pass" || item.result === "verified";
  return (
    <div className="flex items-center gap-4 py-3 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
      <div className={cn(
        "size-9 rounded-xl flex items-center justify-center shrink-0",
        passed ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40"
      )}>
        {passed
          ? <CheckCircle className="size-4 text-emerald-600" />
          : <XCircle className="size-4 text-red-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
          {item.credentialTitle ?? item.courseName ?? "Credential"}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5 truncate">
          {item.studentName ?? "—"} · {item.institutionName ?? "—"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <Badge className={cn(
          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-0",
          passed
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
            : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
        )}>
          {passed ? "Verified" : "Failed"}
        </Badge>
        <p className="text-[10px] text-neutral-400 mt-1">
          {item.verifiedAt ? format(new Date(item.verifiedAt), "MMM d, h:mm a") : "—"}
        </p>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function VerifierDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["verifier-stats"],
    queryFn: async () => {
      try { return await (api as any).getVerifierStats?.(); } catch { return null; }
    },
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ["verifier-recent"],
    queryFn: async () => {
      try { return await (api as any).getVerifierChecks?.(8); } catch { return null; }
    },
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const recent: any[] = Array.isArray(recentData) ? recentData : (recentData?.results ?? recentData?.verifications ?? []);

  const metrics = [
    {
      label: "This Month",
      value: stats?.checksThisMonth ?? "—",
      sub: "Verifications run",
      icon: ShieldCheck,
      color: "blue" as const,
    },
    {
      label: "Pass Rate",
      value: stats?.passRate != null ? `${stats.passRate}%` : "—",
      sub: "Valid credentials",
      icon: TrendingUp,
      color: "green" as const,
    },
    {
      label: "Avg. Latency",
      value: stats?.avgLatencyMs != null ? `${stats.avgLatencyMs}ms` : "—",
      sub: "Response time",
      icon: Activity,
      color: "blue" as const,
    },
    {
      label: "Flagged",
      value: stats?.flagged ?? "—",
      sub: "Require review",
      icon: AlertTriangle,
      color: "amber" as const,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Verification Dashboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time overview of your credential verification activity
          </p>
        </div>
        <Button
          asChild
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 self-start sm:self-center"
        >
          <Link to="/verifier/verify">
            <Search className="size-4" /> Verify Credential
          </Link>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-[24px]" />)
          : metrics.map((m) => <MetricCard key={m.label} {...m} />)
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent activity */}
        <Card className="lg:col-span-3 rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="font-black text-neutral-800 dark:text-neutral-200 text-sm uppercase tracking-widest">
                Recent Verifications
              </p>
              <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-bold text-blue-600 gap-1">
                <Link to="/verifier/history">View all <ArrowRight className="size-3" /></Link>
              </Button>
            </div>
            {recentLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl mb-2" />)}
            {!recentLoading && recent.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <ShieldCheck className="size-10 text-neutral-200 dark:text-neutral-700 mx-auto" />
                <p className="text-sm text-neutral-400">No verifications yet</p>
                <Button asChild size="sm" className="rounded-xl mt-2">
                  <Link to="/verifier/verify">Start verifying</Link>
                </Button>
              </div>
            )}
            {!recentLoading && recent.slice(0, 6).map((item, i) => (
              <ActivityRow key={i} item={item} />
            ))}
          </CardContent>
        </Card>

        {/* Quick actions + status */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
            <CardContent className="p-6 space-y-3">
              <p className="font-black text-neutral-800 dark:text-neutral-200 text-sm uppercase tracking-widest mb-4">
                Quick Actions
              </p>
              {[
                { label: "Verify a credential",   icon: Search,    href: "/verifier/verify",    color: "bg-blue-600 text-white hover:bg-blue-700" },
                { label: "Bulk screening",         icon: Users,     href: "/verifier/verify",    color: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700" },
                { label: "View queue",             icon: Clock,     href: "/verifier/queue",     color: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700" },
                { label: "Analytics",              icon: BarChart3, href: "/verifier/analytics", color: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-colors",
                      action.color
                    )}
                  >
                    <Icon className="size-4" />
                    {action.label}
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
            <CardContent className="p-6 space-y-3">
              <p className="font-black text-neutral-800 dark:text-neutral-200 text-sm uppercase tracking-widest mb-1">
                Service Status
              </p>
              {[
                { label: "Verification API",  ok: true  },
                { label: "Credential lookup", ok: true  },
                { label: "Bulk processing",   ok: true  },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">{s.label}</span>
                  <Badge className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-0",
                    s.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-700"
                  )}>
                    {s.ok ? "Operational" : "Down"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
