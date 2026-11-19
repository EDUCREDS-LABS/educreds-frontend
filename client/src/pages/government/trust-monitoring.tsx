import { governmentRequest } from "@/lib/api";
import { GovernmentRequestError } from "./request-error";
/**
 * Government Trust Monitoring — /government/trust-monitoring
 * Live trust score drift, alerts, online presence, distributed data signals.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, Globe, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Search, Download, RefreshCw, Eye, Bell,
  CheckCircle, XCircle, Wifi, WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type DriftFilter = "all" | "declining" | "improving" | "critical";

export default function GovernmentTrustMonitoringPage() {
  const [search, setSearch] = useState("");
  const [drift, setDrift] = useState<DriftFilter>("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gov-trust-monitoring", drift, search],
    queryFn: async () => {
      const p = new URLSearchParams({ drift, q: search });
      return governmentRequest(`/api/government/trust-monitoring?${p}`);
    },
    staleTime: 60_000,
    refetchInterval: 300_000, // Auto-refresh every 5 min
  });

  const items: any[] = Array.isArray(data) ? data : (data?.institutions ?? data?.results ?? []);
  const summary = data?.summary ?? null;
  const alerts: any[] = Array.isArray(data?.alerts) ? data.alerts : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <GovernmentRequestError error={error} retry={() => { void refetch(); }} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="size-4 text-primary" />
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">Government Portal</p>
          </div>
          <h1 className="text-3xl font-black text-[--foreground] tracking-tighter">Trust Monitoring</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">Real-time trust score drift, online presence, distributed data signals, and compliance alerts</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 px-3 py-1.5 rounded-xl">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Live
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Monitored",      value: summary.total       ?? "—", color: "text-[--foreground]" },
            { label: "Critical",       value: summary.critical    ?? "—", color: "text-red-600" },
            { label: "Declining",      value: summary.declining   ?? "—", color: "text-amber-600" },
            { label: "Online (24h)",   value: summary.online      ?? "—", color: "text-emerald-600" },
          ].map(s => (
            <Card key={s.label} className="rounded-[20px] border border-[--border] bg-[--card]">
              <CardContent className="p-4">
                <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">{s.label}</p>
                <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">{a.message ?? a.description}</p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/60">{a.institution ?? ""}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl border-red-300 text-red-700 hover:bg-red-100 text-xs font-bold shrink-0">
                Investigate
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Trust drift table */}
      <Card className="rounded-[24px] border border-[--border] bg-[--card]">
        <CardHeader className="px-6 py-4 border-b border-[--border]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--muted-foreground]" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search institutions…"
                className="h-10 pl-9 rounded-xl bg-[--muted] border-none text-sm" />
            </div>
            <div className="flex items-center bg-[--muted] rounded-xl p-1 gap-1 text-[10px]">
              {(["all","declining","improving","critical"] as const).map(d => (
                <button key={d} onClick={() => setDrift(d)}
                  className={cn("font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                    drift === d ? "bg-[--card] text-[--foreground] shadow-sm" : "text-[--muted-foreground]")}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-0">
          {isLoading ? (
            <div className="space-y-1 py-4">{[1,2,3,4,5].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <ShieldCheck className="size-10 text-[--muted-foreground]/20 mx-auto mb-3" />
              <p className="font-bold text-[--muted-foreground]">No trust monitoring data available</p>
              <p className="text-xs text-[--muted-foreground] mt-1">Loads from <code className="bg-[--muted] px-1 rounded">/api/government/trust-monitoring</code></p>
            </div>
          ) : items.map((item: any, i: number) => {
            const score = item.trustScore ?? item.score ?? null;
            const prev = item.previousScore ?? null;
            const isOnline = item.online ?? item.isOnline ?? null;
            const driftVal = prev !== null && score !== null ? score - prev : null;
            return (
              <div key={item.id ?? i} className="flex items-center gap-4 py-4 border-b border-[--border] last:border-0 group">
                <div className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center shrink-0">
                  {isOnline === true ? <Wifi className="w-4 h-4 text-emerald-500" />
                    : isOnline === false ? <WifiOff className="w-4 h-4 text-red-500" />
                    : <Activity className="w-4 h-4 text-[--muted-foreground]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[--foreground] truncate">{item.name ?? "—"}</p>
                  <p className="text-xs text-[--muted-foreground]">
                    {item.jurisdiction ?? "—"}
                    {item.lastSeen ? ` · Last seen ${new Date(item.lastSeen).toLocaleDateString()}` : ""}
                  </p>
                </div>

                {score !== null && (
                  <div className="hidden sm:block w-28 shrink-0">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-[--muted-foreground]">PoIC</span>
                      <span className={cn(score < 60 ? "text-red-600" : score < 80 ? "text-amber-600" : "text-emerald-600")}>{score}</span>
                    </div>
                    <Progress value={score} className="h-1.5"
                      style={{ "--progress-fill": score < 60 ? "#ef4444" : score < 80 ? "#f59e0b" : "#10b981" } as any} />
                  </div>
                )}

                {driftVal !== null && (
                  <div className={cn("flex items-center gap-1 text-xs font-bold shrink-0",
                    driftVal > 0 ? "text-emerald-600" : driftVal < 0 ? "text-red-600" : "text-[--muted-foreground]")}>
                    {driftVal > 0 ? <TrendingUp className="w-3.5 h-3.5"/> : driftVal < 0 ? <TrendingDown className="w-3.5 h-3.5"/> : null}
                    {driftVal > 0 ? `+${driftVal}` : driftVal}
                  </div>
                )}

                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
