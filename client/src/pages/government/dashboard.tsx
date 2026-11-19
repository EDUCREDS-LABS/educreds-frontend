import { governmentRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { GovernmentRequestError } from "./request-error";
/**
 * Government National Overview — /government/dashboard
 *
 * Primary command surface for ministry-level oversight.
 * Shows live metrics, compliance alerts, institution trust assessments,
 * and quick-action controls. Wires to /api/government/* endpoints.
 * Falls back to "—" gracefully when backend data is absent.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, ShieldCheck, Award, AlertTriangle, TrendingUp, TrendingDown,
  ArrowRight, BarChart3, CheckCircle, XCircle, Globe, Search, Filter,
  Download, RefreshCw, Clock, Landmark, Activity, Lock, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

// ── Metric card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color = "blue", trend, alert }: {
  label: string; value: string | number; sub?: string; icon: typeof ShieldCheck;
  color?: "blue" | "green" | "amber" | "red"; trend?: "up" | "down"; alert?: boolean;
}) {
  const colorMap = {
    blue:  { bg: "bg-blue-50 dark:bg-blue-950/30",   text: "text-blue-600 dark:text-blue-400"   },
    green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30",  text: "text-amber-600 dark:text-amber-400" },
    red:   { bg: "bg-red-50 dark:bg-red-950/30",     text: "text-red-600 dark:text-red-400"    },
  }[color];

  return (
    <Card className="rounded-[24px] border border-[--border] bg-[--card] shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-black text-[--foreground] leading-none">
              {value === null || value === undefined ? "—" : value}
            </p>
            {sub && <p className="text-xs text-[--muted-foreground]">{sub}</p>}
            {trend && (
              <p className={cn("text-xs font-bold flex items-center gap-1",
                trend === "up" ? "text-emerald-600" : "text-red-500")}>
                {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend === "up" ? "Improving" : "Needs attention"}
              </p>
            )}
          </div>
          <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0 relative", colorMap.bg)}>
            <Icon className={cn("size-6", colorMap.text)} />
            {alert && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-[--card]" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Compliance row ─────────────────────────────────────────────────────────────

function ComplianceRow({ item, onAction }: { item: any; onAction: (id: string, action: string) => void }) {
  const score = item.trustScore ?? item.score ?? null;
  const assessment = score === null ? "unknown" : score >= 80 ? "strong" : score >= 60 ? "moderate" : "review";
  const assessmentColors = {
    strong:     "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
    moderate:  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
    review:    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
    unknown: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800",
  }[assessment];

  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[--border] last:border-0 group">
      <div className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center shrink-0">
        <Building2 className="w-4 h-4 text-[--muted-foreground]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[--foreground] truncate">{item.name ?? "Institution"}</p>
        <p className="text-xs text-[--muted-foreground]">{item.jurisdiction ?? item.country ?? "—"} · {item.type ?? "University"}</p>
      </div>
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        {score !== null && (
          <div className="w-24">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-[--muted-foreground]">PoIC</span>
              <span className={assessment === "review" ? "text-red-600" : "text-[--foreground]"}>{score}</span>
            </div>
            <Progress value={score} className="h-1.5" />
          </div>
        )}
        <Badge className={cn("text-[10px] font-black uppercase tracking-widest border rounded-full px-2.5 py-0.5", assessmentColors)}>
          {assessment === "unknown" ? "No assessment" : assessment === "review" ? "Review recommended" : `${assessment} PoIC`}
        </Badge>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm" variant="ghost"
          className="h-8 text-xs font-bold rounded-xl"
          onClick={() => onAction(item.id, "review")}
        >
          Review
        </Button>

      </div>
      <ChevronRight className="w-4 h-4 text-[--muted-foreground] shrink-0" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function GovernmentDashboardPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"az" | "za">("az");

  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch } = useQuery({
    queryKey: ["gov-overview"],
    queryFn: async () => {
      return governmentRequest("/api/government/overview");
    },
    staleTime: 120_000,
  });

  const { data: institutions, isLoading: instLoading, error: institutionsError } = useQuery({
    queryKey: ["gov-institutions", sortOrder, search],
    queryFn: async () => {
      const params = new URLSearchParams({ sort: sortOrder, q: search });
      return governmentRequest(`/api/government/institutions?${params}`);
    },
    staleTime: 60_000,
  });

  const { data: alerts, error: alertsError } = useQuery({
    queryKey: ["gov-alerts"],
    queryFn: async () => {
      return governmentRequest("/api/government/alerts");
    },
    staleTime: 60_000,
  });

  const instList: any[] = Array.isArray(institutions)
    ? institutions
    : (institutions?.institutions ?? institutions?.results ?? []);

  const alertList: any[] = Array.isArray(alerts)
    ? alerts
    : (alerts?.alerts ?? alerts?.results ?? []);

  const kpis = [
    { label: "Registered Institutions", value: overview?.totalInstitutions ?? "—", sub: "Nationally registered",    icon: Building2,   color: "blue"  as const, trend: undefined },
    { label: "Credentials Issued",       value: overview?.totalCredentials  ?? "—", sub: "All time",                icon: Award,       color: "blue"  as const, trend: "up"   as const },
    { label: "Verifications Today",      value: overview?.verificationsToday ?? "—", sub: "Last 24 hours",          icon: ShieldCheck, color: "green" as const, trend: undefined },
    { label: "Compliance Alerts",        value: (overview?.complianceAlerts ?? alertList.length) || "—", sub: "Require action", icon: AlertTriangle, color: (overview?.complianceAlerts ?? 0) > 0 ? "red" as const : "amber" as const, alert: (overview?.complianceAlerts ?? 0) > 0 },
    { label: "Items Flagged for Review",              value: overview?.fraudFlags ?? "—", sub: "Not a fraud finding",          icon: Lock,        color: "red"   as const, trend: overview?.fraudFlags > 0 ? "down" as const : undefined },
    { label: "Active Jurisdictions",     value: overview?.jurisdictions ?? "—", sub: "Covered regions",            icon: Globe,       color: "blue"  as const, trend: undefined },
    { label: "Avg. Trust Score",         value: overview?.avgTrustScore ? `${overview.avgTrustScore}/100` : "—", sub: "National average", icon: BarChart3, color: (overview?.avgTrustScore ?? 0) >= 75 ? "green" as const : "amber" as const, trend: "up" as const },
    { label: "Accreditation Coverage",   value: overview?.accreditedPct ? `${overview.accreditedPct}%` : "—", sub: "Accredited institutions", icon: Landmark, color: "green" as const },
  ];

  const sortOptions: { value: typeof sortOrder; label: string }[] = [
    { value: "az",        label: "A → Z"              },
    { value: "za",        label: "Z → A"              },
  ];

  const handleAction = async (id: string, action: string) => {
    try {
      await governmentRequest(`/api/government/institutions/${id}/${action}`, { method: "POST" });
      refetch();
    } catch (err) {
      toast({ title: "Action failed", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">

      <GovernmentRequestError error={overviewError || institutionsError || alertsError} retry={() => { void refetch(); }} />
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="size-4 text-primary" />
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">National Oversight</p>
          </div>
          <h1 className="text-3xl font-black text-[--foreground] tracking-tighter">Control Center</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">
            Real-time view of national credential network — compliance, trust scores, review signals, and accreditation status.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" disabled title="Export coming soon — no authorized export endpoint is available" className="rounded-xl gap-2">
            <Download className="w-3.5 h-3.5" />
            Export coming soon
          </Button>
          <Link to="/government/analytics">
            <Button size="sm" className="rounded-xl gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Full Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      {overviewLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-28 rounded-[24px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      )}

      {/* Active alerts */}
      {alertList.length > 0 && (
        <Card className="rounded-[24px] border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="font-black text-sm text-red-700 dark:text-red-400 uppercase tracking-widest">
                {alertList.length} Active Compliance Alert{alertList.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-2">
              {alertList.slice(0, 3).map((alert: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-red-950/30 border border-red-100 dark:border-red-800/30">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">{alert.message ?? alert.description ?? "Compliance issue detected"}</p>
                  <Button size="sm" variant="destructive" className="h-7 text-xs rounded-lg shrink-0 ml-3">
                    Take Action
                  </Button>
                </div>
              ))}
            </div>
            {alertList.length > 3 && (
              <Link to="/government/investigations">
                <Button variant="link" size="sm" className="text-red-600 dark:text-red-400 mt-2 px-0">
                  View all {alertList.length} alerts →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Institutions control table */}
      <Card className="rounded-[24px] border border-[--border] bg-[--card]">
        <CardHeader className="px-6 py-5 border-b border-[--border]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-black text-[--foreground] tracking-tight">
                Institution Registry
              </CardTitle>
              <p className="text-xs text-[--muted-foreground] mt-0.5">
                Compliance status and PoIC assessments across all registered institutions
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort */}
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as typeof sortOrder)}
                className="text-xs font-bold h-9 rounded-xl border border-[--border] bg-[--card] text-[--foreground] px-3 cursor-pointer"
              >
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--muted-foreground]" />
            <Input
              placeholder="Search institutions by name or jurisdiction…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 rounded-xl pl-10 bg-[--muted] border-none text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="px-6 py-0">
          {instLoading ? (
            <div className="space-y-1 py-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : instList.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Building2 className="size-10 text-[--muted-foreground]/20 mx-auto" />
              <p className="font-bold text-[--muted-foreground]">No institutions match your filters</p>
              <p className="text-xs text-[--muted-foreground]">Adjust filters or check when the backend endpoint <code className="text-[10px] bg-[--muted] px-1.5 py-0.5 rounded">/api/government/institutions</code> is live.</p>
            </div>
          ) : (
            <div>
              {instList.map((inst: any, i: number) => (
                <ComplianceRow key={inst.id ?? i} item={inst} onAction={handleAction} />
              ))}
            </div>
          )}
        </CardContent>
        {instList.length > 0 && (
          <div className="px-6 py-4 border-t border-[--border] flex items-center justify-between">
            <p className="text-xs text-[--muted-foreground]">Showing {instList.length} institutions</p>
            <Link to="/government/institutions">
              <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs font-bold">
                Full Registry <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Quick nav to sub-pages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: "/government/accreditation",   icon: Landmark,       label: "Accreditation",     desc: "Bodies & status"      },
          { to: "/government/analytics",       icon: BarChart3,      label: "Analytics",          desc: "National trends"      },
          { to: "/government/investigations",  icon: AlertTriangle,  label: "Investigations",     desc: "Cases & review"        },
          { to: "/government/trust-monitoring",icon: Activity,       label: "Trust Monitoring",   desc: "Score trends & drift" },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to}>
            <Card className="rounded-[20px] border border-[--border] bg-[--card] hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4">
                <Icon className="w-5 h-5 text-primary mb-2" />
                <p className="font-black text-xs text-[--foreground] tracking-tight">{label}</p>
                <p className="text-[10px] text-[--muted-foreground] mt-0.5">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
