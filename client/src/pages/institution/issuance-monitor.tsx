/**
 * Institution Issuance Monitor
 *
 * Operational dashboard for monitoring the certificate issuance pipeline.
 *
 * Notes:
 * - This page is intentionally read-only except for explicit retry actions.
 * - All data must come from real API endpoints (no fabricated metrics).
 * - Route wiring/navigation is handled elsewhere (protected files) and is NOT
 *   modified here.
 */

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/loading-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type RetryJobType = "ANCHOR" | "IPFS" | "MINT" | "VERIFY" | string;

type PipelineSummary = {
  totals?: Record<string, number | null | undefined>;
  byStatus?: Record<string, number | null | undefined>;
  byStage?: Record<string, number | null | undefined>;
  lastUpdatedAt?: string | null;
  window?: string | null;
};

type PipelineCertificate = {
  id: string;
  status?: string | null;
  stage?: string | null;
  jobType?: string | null;
  lastError?: string | null;
  studentName?: string | null;
  courseName?: string | null;
  programName?: string | null;
  issuedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

function safeNumber(v: unknown): number | null {
  if (typeof v !== "number") return null;
  if (!Number.isFinite(v)) return null;
  return v;
}

function fmtCount(v: unknown, fallback = "—"): string {
  const n = safeNumber(v);
  if (n == null) return fallback;
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function fmtDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shorten(value?: string | null, lead = 10, tail = 6): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= lead + tail + 1) return trimmed;
  return `${trimmed.slice(0, lead)}…${trimmed.slice(-tail)}`;
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "unknown").toLowerCase();
  const cfg =
    s.includes("fail") || s.includes("error")
      ? { cls: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300", label: status ?? "Failed" }
      : s.includes("pending") || s.includes("queue")
        ? { cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300", label: status ?? "Pending" }
        : s.includes("anchor") || s.includes("mint") || s.includes("ipfs") || s.includes("processing")
          ? { cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300", label: status ?? "Processing" }
          : s.includes("issued") || s.includes("success") || s.includes("complete")
            ? { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300", label: status ?? "Issued" }
            : { cls: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200", label: status ?? "Unknown" };

  return <Badge className={cn("border-0", cfg.cls)}>{cfg.label}</Badge>;
}

function StatPill({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">{label}</p>
            <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 leading-none">{value}</p>
          </div>
          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-2.5">
            <Icon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IssuanceMonitorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSeconds, setRefreshSeconds] = useState(15);

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [search, setSearch] = useState("");
  const [retryBusyId, setRetryBusyId] = useState<string | null>(null);

  const summaryQuery = useQuery({
    queryKey: ["institution-pipeline-summary"],
    queryFn: () => api.getPipelineSummary() as Promise<PipelineSummary>,
    refetchOnMount: true,
    staleTime: 10_000,
  });

  const certificatesParams = useMemo(
    () => ({
      limit: 50,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: search.trim() ? search.trim() : undefined,
      sortBy: "updatedAt",
      sortDir: "desc" as const,
    }),
    [statusFilter, search]
  );

  const certificatesQuery = useQuery({
    queryKey: ["institution-certificates", certificatesParams],
    queryFn: async () => {
      const res: any = await api.getCertificates(certificatesParams);
      // api.getCertificates normalizes either array or { certificates, meta }
      const list: any[] = Array.isArray(res) ? res : Array.isArray(res?.certificates) ? res.certificates : [];
      return list as PipelineCertificate[];
    },
    refetchOnMount: true,
    staleTime: 10_000,
  });

  const certificates = certificatesQuery.data ?? [];

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["institution-pipeline-summary"] });
    queryClient.invalidateQueries({ queryKey: ["institution-certificates"] });
  };

  useEffect(() => {
    if (!autoRefresh) return;
    if (!Number.isFinite(refreshSeconds) || refreshSeconds < 5) return;

    const id = window.setInterval(() => {
      refreshAll();
    }, refreshSeconds * 1000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshSeconds]);

  const retryMutation = useMutation({
    mutationFn: ({ certificateId, jobType }: { certificateId: string; jobType: RetryJobType }) =>
      api.retryAnchorJob(certificateId, jobType),
    onMutate: ({ certificateId }) => setRetryBusyId(certificateId),
    onSuccess: (result: any) => {
      toast({
        title: "Retry triggered",
        description: result?.message || "The pipeline retry request has been queued.",
      });
      refreshAll();
    },
    onError: (error: unknown) => {
      toast({
        title: "Retry failed",
        description: error instanceof Error ? error.message : "Could not trigger a retry for this credential.",
        variant: "destructive",
      });
    },
    onSettled: () => setRetryBusyId(null),
  });

  const summary = summaryQuery.data;

  const totalIssued = fmtCount(summary?.totals?.issued ?? summary?.byStatus?.issued);
  const totalPending = fmtCount(summary?.totals?.pending ?? summary?.byStatus?.pending);
  const totalFailed = fmtCount(summary?.totals?.failed ?? summary?.byStatus?.failed);

  const lastUpdated = summary?.lastUpdatedAt ? fmtDateTime(summary.lastUpdatedAt) : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">Issuance Monitor</h1>
          <p className="text-sm text-muted-foreground">
            Live view of credentials moving through IPFS → anchoring → minting. Use retries only when a job is genuinely stuck.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={summaryQuery.isFetching || certificatesQuery.isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", (summaryQuery.isFetching || certificatesQuery.isFetching) && "animate-spin")} />
            Refresh
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh((v) => !v)}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Auto
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Auto-refresh every {refreshSeconds}s</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Select value={String(refreshSeconds)} onValueChange={(v) => setRefreshSeconds(Number(v))}>
            <SelectTrigger className="h-9 w-[120px]">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10s</SelectItem>
              <SelectItem value="15">15s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">60s</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatPill label="Issued" value={summaryQuery.isLoading ? "…" : totalIssued} icon={CheckCircle2} />
        <StatPill label="Pending" value={summaryQuery.isLoading ? "…" : totalPending} icon={Clock} />
        <StatPill label="Failed" value={summaryQuery.isLoading ? "…" : totalFailed} icon={ShieldAlert} />
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Pipeline status</CardTitle>
          <CardDescription>
            Last updated: <span className="font-medium text-foreground">{lastUpdated}</span>
            {summary?.window ? <span className="text-muted-foreground"> · Window: {summary.window}</span> : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summaryQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : summaryQuery.isError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load pipeline summary.</p>
              <Button variant="outline" size="sm" onClick={refreshAll}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">By stage</p>
                  <div className="space-y-1">
                    {Object.entries(summary?.byStage ?? {}).length ? (
                      Object.entries(summary?.byStage ?? {}).slice(0, 6).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-semibold">{fmtCount(v)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No stage breakdown available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">By status</p>
                  <div className="space-y-1">
                    {Object.entries(summary?.byStatus ?? {}).length ? (
                      Object.entries(summary?.byStatus ?? {}).slice(0, 6).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-semibold">{fmtCount(v)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No status breakdown available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Totals</p>
                  <div className="space-y-1">
                    {Object.entries(summary?.totals ?? {}).length ? (
                      Object.entries(summary?.totals ?? {}).slice(0, 6).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-semibold">{fmtCount(v)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No totals available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Recent credentials</CardTitle>
            <CardDescription>
              Filter by status and retry specific pipeline jobs when needed.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student / course"
                className="pl-9 w-[260px]"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {certificatesQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : certificatesQuery.isError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Could not load credentials.</p>
              <Button variant="outline" size="sm" onClick={refreshAll}>
                Try again
              </Button>
            </div>
          ) : certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-medium">No matching credentials</p>
              <p className="text-sm text-muted-foreground">Try a different filter or search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((c) => {
                    const stage = c.stage ?? c.jobType ?? "—";
                    const updated = c.updatedAt ?? c.issuedAt ?? c.createdAt;
                    const isBusy = retryBusyId === c.id;

                    return (
                      <TableRow key={c.id} className="align-top">
                        <TableCell className="font-medium">
                          <div className="space-y-0.5">
                            <div>{c.studentName || "—"}</div>
                            <div className="text-xs text-muted-foreground">{shorten(c.id)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{c.courseName || c.programName || "—"}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <StatusBadge status={c.status} />
                            {c.lastError ? (
                              <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-300">
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
                                <span className="line-clamp-2" title={c.lastError}>
                                  {c.lastError}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{stage}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDateTime(updated)}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex flex-wrap justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isBusy}
                                    onClick={() => retryMutation.mutate({ certificateId: c.id, jobType: "ANCHOR" })}
                                  >
                                    <RotateCcw className={cn("mr-2 h-4 w-4", isBusy && "animate-spin")} />
                                    Retry anchor
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Re-run the anchoring job for this credential.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isBusy}
                                    onClick={() => retryMutation.mutate({ certificateId: c.id, jobType: "IPFS" })}
                                  >
                                    <RotateCcw className={cn("mr-2 h-4 w-4", isBusy && "animate-spin")} />
                                    IPFS
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Retry the IPFS pin/upload job (if supported).</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Retry guidance</p>
                  <p>
                    Only retry if a credential has been stuck longer than expected, or the last error clearly indicates a transient failure
                    (rate limits, temporary RPC issues, IPFS timeouts). If failures persist, capture the credential ID and escalate to engineering.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
