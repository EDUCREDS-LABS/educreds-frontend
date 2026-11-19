/**
 * Verifier Analytics — /verifier/analytics
 *
 * Business intelligence for the verifier workspace.
 * Pass rate, volume trends, top institutions, top credential types.
 * Real API — shows "—" when unavailable.
 */

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, ShieldCheck, XCircle, BarChart3, Building2,
  Award, Calendar, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

function StatCard({ label, value, sub, icon: Icon, color = "blue" }: {
  label: string; value: string | number; sub?: string;
  icon: typeof ShieldCheck; color?: "blue" | "green" | "amber" | "red";
}) {
  const c = {
    blue:  "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    red:   "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
  }[color];
  return (
    <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", c.split(" ").slice(0, 2).join(" "))}>
          <Icon className={cn("size-6", c.split(" ").slice(2).join(" "))} />
        </div>
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-0.5">
            {value === null || value === undefined ? "—" : value}
          </p>
          {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function RankedList({ title, items, valueLabel }: {
  title: string;
  items: { name: string; value: number | string; sub?: string }[];
  valueLabel: string;
}) {
  return (
    <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
      <CardContent className="p-6">
        <p className="font-black text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-widest mb-4">{title}</p>
        {items.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-6">No data available</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
            <div className="size-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-neutral-400">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{item.name}</p>
              {item.sub && <p className="text-xs text-neutral-400">{item.sub}</p>}
            </div>
            <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-0 font-black text-xs">
              {item.value} {valueLabel}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function VerifierAnalyticsPage() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["verifier-analytics"],
    queryFn: () => api.getVerifierAnalytics(),
    staleTime: 120_000,
  });

  const topInstitutions: { name: string; value: number | string; sub?: string }[] =
    stats?.topInstitutions?.map((i: any) => ({ name: i.name, value: i.count, sub: i.passRate ? `${i.passRate}% pass rate` : undefined })) ?? [];

  const topCredentials: { name: string; value: number | string }[] =
    stats?.topCredentialTypes?.map((c: any) => ({ name: c.type, value: c.count })) ?? [];

  const summaryCards = [
    { label: "Total Verifications",  value: stats?.total ?? "—",                         icon: ShieldCheck, color: "blue"  as const },
    { label: "Pass Rate",            value: stats?.passRate != null ? `${stats.passRate}%` : "—", icon: TrendingUp,  color: "green" as const },
    { label: "Failed",               value: stats?.failed ?? "—",                          icon: XCircle,     color: "red"   as const },
    { label: "Flagged",              value: stats?.flagged ?? "—",                          icon: AlertTriangle, color: "amber" as const },
    { label: "This Month",           value: stats?.thisMonth ?? "—",                        icon: Calendar,    color: "blue"  as const },
    { label: "Unique Institutions",  value: stats?.uniqueInstitutions ?? "—",               icon: Building2,   color: "blue"  as const },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
          Verification Analytics
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Insights into your credential verification activity</p>
      </div>

      {isError && (
        <div role="alert" className="rounded-xl border border-red-200 p-4 text-sm text-red-700">
          Verification analytics could not be loaded. These figures are unavailable, not zero.
          <button type="button" className="ml-2 underline" onClick={() => refetch()}>Retry</button>
        </div>
      )}
      {!isError && (<>
      {/* Summary metrics */}
      {isLoading
        ? <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-24 rounded-[24px]" />)}</div>
        : <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryCards.map((c) => <StatCard key={c.label} {...c} />)}
          </div>
      }

      {/* Volume trend placeholder */}
      <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
        <CardContent className="p-6">
          <p className="font-black text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-widest mb-2">
            Verification Volume — Last 30 Days
          </p>
          <p className="text-xs text-neutral-400 mb-4">Daily breakdown of verifications</p>
          {isLoading
            ? <Skeleton className="h-32 rounded-xl" />
            : stats?.dailyVolume && stats.dailyVolume.length > 0
              ? (
                  <div className="flex items-end gap-1 h-32">
                    {stats.dailyVolume.map((d: any, i: number) => {
                      const max = Math.max(...stats.dailyVolume.map((x: any) => x.count ?? 0)) || 1;
                      const h = Math.max(4, Math.round(((d.count ?? 0) / max) * 100));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                          <div
                            className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm transition-all group-hover:bg-blue-600"
                            style={{ height: `${h}%` }}
                            title={`${d.date}: ${d.count}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )
              : <div className="h-32 flex items-center justify-center text-sm text-neutral-400">
                  <BarChart3 className="size-8 text-neutral-200 dark:text-neutral-700 mr-2" />
                  No volume data available yet
                </div>
          }
        </CardContent>
      </Card>

      {/* Top lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankedList title="Top Institutions Verified" items={topInstitutions} valueLabel="verifs" />
        <RankedList title="Top Credential Types" items={topCredentials} valueLabel="checks" />
      </div>
      </>)}
    </div>
  );
}
