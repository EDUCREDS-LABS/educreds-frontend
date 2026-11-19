import { governmentRequest } from "@/lib/api";
import { GovernmentRequestError } from "./request-error";
/**
 * Government Investigations — /government/investigations
 * Active fraud flags, risk cases, mitigations, take-action controls.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, Globe, Search, Filter, Download,
  CheckCircle, Clock, XCircle, Eye, ArrowRight,
  Flag, Shield, RefreshCw, ChevronDown, AlertOctagon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type CaseStatus = "all" | "open" | "in-review" | "resolved" | "closed";
type Severity = "all" | "critical" | "high" | "medium" | "low";

const SEVERITY_CFG = {
  critical: { cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400", label: "Critical" },
  high:     { cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400", label: "High" },
  medium:   { cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400", label: "Medium" },
  low:      { cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800", label: "Low" },
};

const STATUS_CFG = {
  open:      { icon: AlertOctagon, cls: "text-red-500",     label: "Open" },
  "in-review": { icon: Clock,     cls: "text-amber-500",   label: "In Review" },
  resolved:  { icon: CheckCircle, cls: "text-emerald-500", label: "Resolved" },
  closed:    { icon: XCircle,     cls: "text-neutral-400", label: "Closed" },
};

export default function GovernmentInvestigationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [caseStatus, setCaseStatus] = useState<CaseStatus>("open");
  const [severity, setSeverity] = useState<Severity>("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gov-investigations", caseStatus, severity, search],
    queryFn: async () => {
      const p = new URLSearchParams({ status: caseStatus, severity, q: search });
      return governmentRequest(`/api/government/investigations?${p}`);
    },
    staleTime: 60_000,
  });

  const items: any[] = Array.isArray(data) ? data : (data?.investigations ?? data?.cases ?? data?.results ?? []);
  const summary = data?.summary ?? null;

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return governmentRequest(`/api/government/investigations/${id}/${action}`, { method: "POST" });
    },
    onSuccess: (_, { action }) => {
      toast({ title: "Case updated", description: `Case ${action} applied.` });
      qc.invalidateQueries({ queryKey: ["gov-investigations"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <GovernmentRequestError error={error} retry={() => { void refetch(); }} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="size-4 text-primary" />
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">Government Portal</p>
          </div>
          <h1 className="text-3xl font-black text-[--foreground] tracking-tighter">Investigations</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">Fraud flags, anomalies, risk mitigations, and enforcement actions</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Open Cases",     value: summary.open      ?? "—", color: "text-red-600" },
            { label: "In Review",      value: summary.inReview  ?? "—", color: "text-amber-600" },
            { label: "Resolved",       value: summary.resolved  ?? "—", color: "text-emerald-600" },
            { label: "Fraud Rate",     value: summary.fraudRate ? `${summary.fraudRate}%` : "—", color: "text-[--foreground]" },
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

      <Card className="rounded-[24px] border border-[--border] bg-[--card]">
        <CardHeader className="px-6 py-4 border-b border-[--border]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--muted-foreground]" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search cases by institution or reference…"
                className="h-10 pl-9 rounded-xl bg-[--muted] border-none text-sm" />
            </div>
            <div className="flex items-center bg-[--muted] rounded-xl p-1 gap-1 text-[10px]">
              {(["all","open","in-review","resolved","closed"] as const).map(s => (
                <button key={s} onClick={() => setCaseStatus(s)}
                  className={cn("font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                    caseStatus === s ? "bg-[--card] text-[--foreground] shadow-sm" : "text-[--muted-foreground]")}>
                  {s}
                </button>
              ))}
            </div>
            <select value={severity} onChange={e => setSeverity(e.target.value as Severity)}
              className="text-xs font-bold h-10 rounded-xl border border-[--border] bg-[--card] text-[--foreground] px-3">
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-0">
          {isLoading ? (
            <div className="space-y-1 py-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-20 rounded-xl"/>)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <AlertTriangle className="size-10 text-[--muted-foreground]/20 mx-auto mb-3" />
              <p className="font-bold text-[--muted-foreground]">No cases match your filters</p>
              <p className="text-xs text-[--muted-foreground] mt-1">Data loads from <code className="bg-[--muted] px-1 rounded">/api/government/investigations</code></p>
            </div>
          ) : items.map((item: any, i: number) => {
            const sev = item.severity ?? "medium";
            const st = item.status ?? "open";
            const sevCfg = SEVERITY_CFG[sev as keyof typeof SEVERITY_CFG] ?? SEVERITY_CFG.medium;
            const stCfg = STATUS_CFG[st as keyof typeof STATUS_CFG] ?? STATUS_CFG.open;
            const StatusIcon = stCfg.icon;
            return (
              <div key={item.id ?? i} className="py-4 border-b border-[--border] last:border-0 group">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">
                    <StatusIcon className={cn("w-5 h-5 shrink-0", stCfg.cls)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-[--foreground]">{item.title ?? item.description ?? "Unnamed case"}</p>
                      <Badge className={cn("text-[10px] font-black border rounded-full px-2 py-0.5", sevCfg.cls)}>{sevCfg.label}</Badge>
                    </div>
                    <p className="text-xs text-[--muted-foreground]">
                      {item.institution ?? "—"} · Case #{item.reference ?? item.id ?? i}
                      {item.reportedAt ? ` · ${format(new Date(item.reportedAt), "dd MMM yyyy")}` : ""}
                    </p>
                    {item.mitigation && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">{item.mitigation}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"
                      onClick={() => actionMutation.mutate({ id: item.id, action: "review" })}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {(st === "open") && (
                      <Button size="sm" variant="ghost" className="h-8 text-xs font-bold rounded-xl text-amber-600"
                        onClick={() => actionMutation.mutate({ id: item.id, action: "escalate" })}>
                        Escalate
                      </Button>
                    )}
                    {(st === "open" || st === "in-review") && (
                      <Button size="sm" variant="ghost" className="h-8 text-xs font-bold rounded-xl text-emerald-600"
                        onClick={() => actionMutation.mutate({ id: item.id, action: "resolve" })}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
