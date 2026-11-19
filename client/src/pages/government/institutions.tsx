import { governmentRequest } from "@/lib/api";
import { GovernmentRequestError } from "./request-error";
/**
 * Government Institutions — /government/institutions
 * Full registry with filters, risk sorting, PoIC, compliance status, and actions.
 */
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Building2, Globe, Search, Download, ChevronRight,
  ShieldCheck, AlertTriangle, XCircle, CheckCircle, Filter,
  Lock, Unlock, Eye, Flag, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Sort = "az" | "za" | "risk-high" | "risk-low" | "credentials-desc";
type StatusFilter = "all" | "active" | "suspended" | "pending" | "flagged";

export default function GovernmentInstitutionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("risk-high");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gov-institutions-full", sort, status, search, page],
    queryFn: async () => {
      const p = new URLSearchParams({ sort, status, q: search, page: String(page), limit: String(limit) });
      return governmentRequest(`/api/government/institutions?${p}`);
    },
    staleTime: 60_000,
  });

  const items: any[] = Array.isArray(data) ? data : (data?.institutions ?? data?.results ?? []);
  const total: number = data?.total ?? items.length;

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return governmentRequest(`/api/government/institutions/${id}/${action}`, { method: "POST" });
    },
    onSuccess: (_, { action }) => {
      toast({ title: `Action applied`, description: `Institution ${action} processed.` });
      refetch();
    },
    onError: (err: Error) => {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    },
  });

  const statusCfg: Record<string, { label: string; cls: string }> = {
    active:    { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400" },
    suspended: { label: "Suspended", cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400" },
    pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400" },
    flagged:   { label: "Flagged",   cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400" },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <GovernmentRequestError error={error} retry={() => { void refetch(); }} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="size-4 text-primary" />
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">Government Portal</p>
          </div>
          <h1 className="text-3xl font-black text-[--foreground] tracking-tighter">Institution Registry</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">Full national registry with compliance status, risk scores, and enforcement controls</p>
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

      <Card className="rounded-[24px] border border-[--border] bg-[--card]">
        <CardHeader className="px-6 py-4 border-b border-[--border]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--muted-foreground]" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, type, or jurisdiction…"
                className="h-10 pl-9 rounded-xl bg-[--muted] border-none text-sm" />
            </div>
            <div className="flex items-center bg-[--muted] rounded-xl p-1 gap-1 text-[10px]">
              {(["all","active","pending","flagged","suspended"] as const).map(s => (
                <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                  className={cn("font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                    status === s ? "bg-[--card] text-[--foreground] shadow-sm" : "text-[--muted-foreground]")}>
                  {s}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)}
              className="text-xs font-bold h-10 rounded-xl border border-[--border] bg-[--card] text-[--foreground] px-3">
              <option value="risk-high">Highest Risk First</option>
              <option value="risk-low">Lowest Risk First</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="credentials-desc">Most Credentials</option>
            </select>
          </div>
          <p className="text-xs text-[--muted-foreground] mt-3">{total > 0 ? `${total} institutions` : "Loading…"}</p>
        </CardHeader>

        <CardContent className="px-6 py-0">
          {isLoading ? (
            <div className="space-y-1 py-4">{[1,2,3,4,5,6].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="size-10 text-[--muted-foreground]/20 mx-auto mb-3" />
              <p className="font-bold text-[--muted-foreground]">No institutions match your filters</p>
              <p className="text-xs text-[--muted-foreground] mt-1">Data loads from <code className="bg-[--muted] px-1 rounded">/api/government/institutions</code></p>
            </div>
          ) : items.map((inst: any, i: number) => {
            const score = inst.trustScore ?? inst.score ?? null;
            const instStatus = inst.status ?? "active";
            const cfg = statusCfg[instStatus] ?? statusCfg.active;
            const risk = score === null ? "unknown" : score >= 80 ? "low" : score >= 60 ? "medium" : "high";
            return (
              <div key={inst.id ?? i} className="flex items-center gap-4 py-4 border-b border-[--border] last:border-0 group">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  instStatus === "active" ? "bg-emerald-50 dark:bg-emerald-950/30" :
                  instStatus === "flagged" ? "bg-orange-50 dark:bg-orange-950/30" :
                  instStatus === "suspended" ? "bg-red-50 dark:bg-red-950/30" : "bg-[--muted]")}>
                  <Building2 className={cn("w-4 h-4",
                    instStatus === "active" ? "text-emerald-600" :
                    instStatus === "flagged" ? "text-orange-600" :
                    instStatus === "suspended" ? "text-red-600" : "text-[--muted-foreground]")} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[--foreground] truncate">{inst.name ?? "—"}</p>
                  <p className="text-xs text-[--muted-foreground]">
                    {inst.type ?? "University"} · {inst.jurisdiction ?? inst.country ?? "—"}
                    {inst.totalCredentials ? ` · ${inst.totalCredentials.toLocaleString()} credentials` : ""}
                  </p>
                </div>

                <div className="hidden md:block w-24 shrink-0">
                  {score !== null ? (
                    <>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-[--muted-foreground]">PoIC</span>
                        <span className={risk === "high" ? "text-red-600" : ""}>{score}</span>
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </>
                  ) : <p className="text-xs text-[--muted-foreground]">No score</p>}
                </div>

                <Badge className={cn("text-[10px] font-black border rounded-full px-2.5 py-0.5 shrink-0", cfg.cls)}>
                  {cfg.label}
                </Badge>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"
                    onClick={() => actionMutation.mutate({ id: inst.id, action: "review" })}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  {instStatus === "active" && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-amber-600"
                      onClick={() => actionMutation.mutate({ id: inst.id, action: "flag" })}>
                      <Flag className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {instStatus === "active" && risk === "high" && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-red-600"
                      onClick={() => actionMutation.mutate({ id: inst.id, action: "suspend" })}>
                      <Lock className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {instStatus === "suspended" && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl text-emerald-600"
                      onClick={() => actionMutation.mutate({ id: inst.id, action: "reinstate" })}>
                      <Unlock className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>

        {total > limit && (
          <div className="px-6 py-4 border-t border-[--border] flex items-center justify-between">
            <p className="text-xs text-[--muted-foreground]">Page {page} of {Math.ceil(total / limit)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 1} onClick={() => setPage(p=>p-1)}>Previous</Button>
              <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= Math.ceil(total/limit)} onClick={() => setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
