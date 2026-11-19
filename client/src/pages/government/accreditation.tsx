import { governmentRequest, governmentExport } from "@/lib/api";
import { GovernmentRequestError } from "./request-error";
/**
 * Government Accreditation — /government/accreditation
 * Jurisdiction overview, body status, A-Z / Z-A / expiry sort, gap detection.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Globe, Search, Filter, Download, ChevronRight, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SortMode = "az" | "za" | "expiry-asc" | "expiry-desc" | "score-low";

const STATUS_CONFIG = {
  active:   { label: "Active",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40" },
  expiring: { label: "Expiring", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40" },
  expired:  { label: "Expired",  cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40" },
  pending:  { label: "Pending",  cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400" },
};

export default function GovernmentAccreditationPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("az");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gov-accreditation", sort, statusFilter, search],
    queryFn: async () => {
      const p = new URLSearchParams({ sort, status: statusFilter, q: search });
      return governmentRequest(`/api/government/accreditation?${p}`);
    },
    staleTime: 120_000,
  });

  const items: any[] = Array.isArray(data) ? data : (data?.institutions ?? data?.items ?? data?.results ?? []);
  const summary = data?.summary ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <GovernmentRequestError error={error} retry={() => { void refetch(); }} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="size-4 text-primary" />
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">Government Portal</p>
          </div>
          <h1 className="text-3xl font-black text-[--foreground] tracking-tighter">Accreditation Registry</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">Bodies, institution status, expiry tracking, and compliance gaps</p>
        </div>
        {/* P2-G2: Export compliance report dropdown */}
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => {
              governmentExport("csv")
                .then((blob) => {
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                })
                .catch((err: Error) => alert(err.message));
            }}
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => {
              governmentExport("pdf")
                .then((blob) => {
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                })
                .catch((err: Error) => alert(err.message));
            }}
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Accredited", value: summary.active ?? "—", color: "text-emerald-600" },
            { label: "Expiring (90d)", value: summary.expiring ?? "—", color: "text-amber-600" },
            { label: "Expired", value: summary.expired ?? "—", color: "text-red-600" },
            { label: "Coverage %", value: summary.coveragePct ? `${summary.coveragePct}%` : "—", color: "text-primary" },
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

      {/* Controls */}
      <Card className="rounded-[24px] border border-[--border] bg-[--card]">
        <CardHeader className="px-6 py-4 border-b border-[--border]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--muted-foreground]" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by institution or accreditation body…"
                className="h-10 pl-9 rounded-xl bg-[--muted] border-none text-sm" />
            </div>
            <div className="flex items-center bg-[--muted] rounded-xl p-1 gap-1">
              {(["all","active","expiring","expired"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                    statusFilter === s ? "bg-[--card] text-[--foreground] shadow-sm" : "text-[--muted-foreground]")}>
                  {s}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value as SortMode)}
              className="text-xs font-bold h-10 rounded-xl border border-[--border] bg-[--card] text-[--foreground] px-3">
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="expiry-asc">Expiry (soonest)</option>
              <option value="expiry-desc">Expiry (latest)</option>
              <option value="score-low">Score (lowest first)</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-0">
          {isLoading && <div className="space-y-2 py-4">{[1,2,3,4,5].map(i=><Skeleton key={i} className="h-14 rounded-xl"/>)}</div>}
          {!isLoading && items.length === 0 && (
            <div className="text-center py-20">
              <Award className="size-10 text-[--muted-foreground]/20 mx-auto mb-3" />
              <p className="font-bold text-[--muted-foreground]">No accreditation records match your filters</p>
              <p className="text-xs text-[--muted-foreground] mt-1">Data loads from <code className="bg-[--muted] px-1 rounded">/api/government/accreditation</code></p>
            </div>
          )}
          {!isLoading && items.map((item: any, i: number) => {
            const status = item.status ?? "active";
            const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            const score = item.trustScore ?? item.score ?? null;
            return (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-[--border] last:border-0 group">
                <div className="w-9 h-9 rounded-xl bg-[--muted] flex items-center justify-center shrink-0">
                  {status === "active" ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : status === "expired" ? <XCircle className="w-4 h-4 text-red-500" />
                    : <Clock className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[--foreground] truncate">{item.name ?? item.institution ?? "—"}</p>
                  <p className="text-xs text-[--muted-foreground]">{item.body ?? item.accreditationBody ?? "—"} · {item.jurisdiction ?? "—"}</p>
                </div>
                {score !== null && (
                  <div className="hidden sm:block w-20 shrink-0">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-[--muted-foreground]">PoIC</span>
                      <span>{score}</span>
                    </div>
                    <Progress value={score} className="h-1.5" />
                  </div>
                )}
                {item.expiryDate && (
                  <p className="hidden sm:block text-xs text-[--muted-foreground] shrink-0">{new Date(item.expiryDate).toLocaleDateString()}</p>
                )}
                <Badge className={cn("text-[10px] font-black border rounded-full px-2.5 py-0.5 shrink-0", cfg.cls)}>{cfg.label}</Badge>
                <Button size="sm" variant="ghost" className="h-8 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Review <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
