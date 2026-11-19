import { governmentRequest } from "@/lib/api";
import { GovernmentRequestError } from "./request-error";
/**
 * Government National Analytics — /government/analytics
 * Jurisdiction trends, issuance volume, review signals, verification throughput.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, TrendingUp, TrendingDown, Globe, Download,
  Calendar, Shield, AlertTriangle, Activity, Award, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d" | "1y";

function TrendCard({ label, value, change, changeDir, sub, icon: Icon, color = "blue" }: {
  label: string; value: string | number; change?: string; changeDir?: "up" | "down";
  sub?: string; icon: typeof BarChart3; color?: "blue" | "green" | "amber" | "red";
}) {
  const c = {
    blue:  { bg: "bg-blue-50 dark:bg-blue-950/30",   icon: "text-blue-600 dark:text-blue-400"   },
    green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30",  icon: "text-amber-600 dark:text-amber-400" },
    red:   { bg: "bg-red-50 dark:bg-red-950/30",     icon: "text-red-600 dark:text-red-400"    },
  }[color];
  return (
    <Card className="rounded-[24px] border border-[--border] bg-[--card] shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-black text-[--foreground] leading-none">{value ?? "—"}</p>
            {change && (
              <p className={cn("text-xs font-bold flex items-center gap-1",
                changeDir === "up" ? "text-emerald-600" : "text-red-500")}>
                {changeDir === "up" ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                {change} vs prior period
              </p>
            )}
            {sub && <p className="text-xs text-[--muted-foreground]">{sub}</p>}
          </div>
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", c.bg)}>
            <Icon className={cn("size-6", c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GovernmentAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [jurisdiction, setJurisdiction] = useState("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["gov-analytics", period, jurisdiction],
    queryFn: async () => {
      const p = new URLSearchParams({ period, jurisdiction });
      return governmentRequest(`/api/government/analytics?${p}`);
    },
    staleTime: 120_000,
  });

  const { data: jData } = useQuery({
    queryKey: ["gov-jurisdictions"],
    queryFn: async () => {
      return governmentRequest("/api/government/jurisdictions");
    },
  });

  const jurisdictions: string[] = Array.isArray(jData) ? jData : (jData?.jurisdictions ?? []);

  const metrics = [
    { label: "Credentials Issued",       value: data?.credentialsIssued   ?? "—", change: data?.issuanceDelta,    changeDir: "up"   as const, icon: Award,         color: "blue"  as const },
    { label: "Verification Requests",    value: data?.verificationRequests ?? "—", change: data?.verificationDelta, changeDir: "up"  as const, icon: Shield,        color: "green" as const },
    { label: "Avg. Verification Time",   value: data?.avgVerificationMs    ? `${data.avgVerificationMs}ms` : "—", sub: "End-to-end", icon: Activity, color: "amber" as const },
    { label: "Cross-border Verifications", value: data?.crossBorder        ?? "—", sub: "International requests",  icon: Globe,     color: "blue"  as const },
    { label: "Compliance Rate",          value: data?.complianceRate        ? `${data.complianceRate}%` : "—",    icon: BarChart3,  color: (data?.complianceRate ?? 0) >= 90 ? "green" as const : "amber" as const },
  ];

  // Legacy fraud aggregates have no case/source contract: do not display as findings.
  const fraudItems: any[] = [];
  const jurisdictionStats: any[] = Array.isArray(data?.jurisdictionStats) ? data.jurisdictionStats : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <GovernmentRequestError error={error} retry={() => { void refetch(); }} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="size-4 text-primary" />
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">Government Portal</p>
          </div>
          <h1 className="text-3xl font-black text-[--foreground] tracking-tighter">National Analytics</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">Issuance volume, review signalss, verification throughput, and jurisdiction trends</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={period} onValueChange={v => setPeriod(v as Period)}>
            <SelectTrigger className="w-32 h-9 rounded-xl text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          {jurisdictions.length > 0 && (
            <Select value={jurisdiction} onValueChange={setJurisdiction}>
              <SelectTrigger className="w-36 h-9 rounded-xl text-xs font-bold">
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue placeholder="All jurisdictions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All jurisdictions</SelectItem>
                {jurisdictions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" disabled title="Export coming soon — no authorized export endpoint is available" className="rounded-xl gap-2 h-9">
            <Download className="w-3.5 h-3.5" /> Export coming soon
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i=><Skeleton key={i} className="h-32 rounded-[24px]"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map(m=><TrendCard key={m.label} {...m} />)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud breakdown */}
        <Card className="rounded-[24px] border border-[--border] bg-[--card]">
          <CardHeader className="px-6 py-4 border-b border-[--border]">
            <CardTitle className="text-sm font-black tracking-tight text-[--foreground] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Reported Signals Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-10 rounded-xl"/>)}</div>
            ) : fraudItems.length === 0 ? (
              <div className="text-center py-10">
                <AlertTriangle className="size-8 text-[--muted-foreground]/20 mx-auto mb-2" />
                <p className="text-sm text-[--muted-foreground]">No sourced review signals available</p>
              </div>
            ) : fraudItems.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[--border] last:border-0">
                <div>
                  <p className="text-sm font-bold text-[--foreground]">{"Signal for review"}</p>
                  <p className="text-xs text-[--muted-foreground]">{f.description ?? ""}</p>
                </div>
                <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 font-black text-[10px]">
                  {f.count ?? f.incidents ?? "—"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Jurisdiction stats */}
        <Card className="rounded-[24px] border border-[--border] bg-[--card]">
          <CardHeader className="px-6 py-4 border-b border-[--border]">
            <CardTitle className="text-sm font-black tracking-tight text-[--foreground] flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Jurisdiction Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-10 rounded-xl"/>)}</div>
            ) : jurisdictionStats.length === 0 ? (
              <div className="text-center py-10">
                <Globe className="size-8 text-[--muted-foreground]/20 mx-auto mb-2" />
                <p className="text-sm text-[--muted-foreground]">No jurisdiction data yet</p>
              </div>
            ) : jurisdictionStats.map((j: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[--border] last:border-0">
                <p className="text-sm font-bold text-[--foreground] w-32 shrink-0 truncate">{j.name ?? j.jurisdiction ?? "—"}</p>
                <div className="flex-1 bg-[--muted] rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${j.pct ?? 0}%` }} />
                </div>
                <p className="text-xs font-bold text-[--muted-foreground] w-10 text-right shrink-0">{j.pct ?? 0}%</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {data === null && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Live analytics load from <code className="text-[11px] bg-amber-100 dark:bg-amber-950/40 px-1.5 rounded">/api/government/analytics</code>. Metrics show "—" until backend endpoint is live.</span>
        </div>
      )}
    </div>
  );
}
