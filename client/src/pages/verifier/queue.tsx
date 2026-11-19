/**
 * Verification Queue — /verifier/queue
 *
 * Real data from GET /api/verifier/queue.
 * Status tabs: Review | All | Verified | Failed
 * Per-row: Mark Verified / Mark Failed / View Details
 * Auto-refresh every 30s.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Clock, CheckCircle, XCircle, AlertTriangle, Eye,
  Building2, RefreshCw, Loader2, ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";
import { getAuthHeaders } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QueueItem {
  id: string;
  credentialId: string | null;
  verifierId: string | null;
  status: string;
  method: string | null;
  institutionName: string | null;
  institutionDID: string | null;
  latencyMs: number | null;
  purpose: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

type TabStatus = "review" | "all" | "verified" | "failed";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; colour: string; icon: React.ElementType }> = {
  review:   { label: "Review",   colour: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0",   icon: Clock        },
  verified: { label: "Verified", colour: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0", icon: CheckCircle  },
  failed:   { label: "Failed",   colour: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-0",           icon: XCircle      },
  flagged:  { label: "Flagged",  colour: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-0", icon: AlertTriangle },
};

function getStatusCfg(status: string) {
  return STATUS_CFG[status?.toLowerCase()] ?? STATUS_CFG.review;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchQueue(status: string): Promise<QueueItem[]> {
  const params = new URLSearchParams({ status, limit: "50" });
  const res = await fetch(
    `${API_CONFIG.CERT}/api/verifier/queue?${params.toString()}`,
    { headers: getAuthHeaders() },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.items ?? data?.queue ?? []);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VerifierQueuePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabStatus>("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<QueueItem[]>({
    queryKey: ["verifier-queue", tab],
    queryFn: () => fetchQueue(tab),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  const items: QueueItem[] = Array.isArray(data) ? data : [];

  // For "all" tab, show everything; otherwise the server filters by status
  const displayed = tab === "all" ? items : items;

  // Keep the prior status visible until the backend acknowledges the review decision.
  const markMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "verified" | "failed" }) => {
      // Persist to backend via PATCH /api/verifier/queue/:id
      const res = await fetch(`${API_CONFIG.CERT}/api/verifier/queue/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    },
    onSuccess: (_, { status }) => {
      toast({ title: status === "verified" ? "Marked as verified" : "Marked as failed" });
      queryClient.invalidateQueries({ queryKey: ["verifier-queue"] });
    },
    onError: (e: Error) => {
      void queryClient.invalidateQueries({ queryKey: ["verifier-queue"] });
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    },
  });

  const TABS: { id: TabStatus; label: string }[] = [
    { id: "review",   label: "Review"   },
    { id: "all",      label: "All"      },
    { id: "verified", label: "Verified" },
    { id: "failed",   label: "Failed"   },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-3">
            <ShieldCheck className="size-7 text-amber-500" /> Verification Queue
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Credentials pending human review</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 self-start sm:self-center"
          onClick={() => refetch()}
        >
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              tab === t.id
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table header */}
      {!isLoading && displayed.length > 0 && (
        <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-2 px-4 py-2">
          {["Credential", "Institution", "Method", "Submitted", "Actions"].map((h) => (
            <p key={h} className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{h}</p>
          ))}
        </div>
      )}

      {/* Items */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
            <CheckCircle className="size-8 text-neutral-300 dark:text-neutral-600" />
          </div>
          <p className="font-bold text-neutral-500">
            {tab === "review" ? "No credentials pending review" : `No ${tab} items`}
          </p>
          <p className="text-sm text-neutral-400">
            {tab === "review"
              ? "All verifications are up to date. Check back soon."
              : "Try switching to a different status tab."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((item) => {
            const cfg = getStatusCfg(item.status);
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === item.id;
            const credShort = item.credentialId
              ? item.credentialId.slice(0, 8).toUpperCase()
              : item.id.slice(0, 8).toUpperCase();

            return (
              <Card
                key={item.id}
                className="rounded-2xl border-none shadow-sm bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 space-y-3">
                  {/* Main row */}
                  <div className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-3 items-center">
                    {/* Credential */}
                    <div className="flex items-center gap-3">
                      <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", cfg.colour.split(" ").slice(0, 2).join(" "))}>
                        <StatusIcon className={cn("size-4", cfg.colour.split(" ").slice(2).join(" "))} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-mono">
                          #{credShort}
                        </p>
                        <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0 rounded-full", cfg.colour)}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Institution */}
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-neutral-400 shrink-0" />
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                        {item.institutionName ?? item.institutionDID?.slice(0, 16) ?? "Unknown"}
                      </p>
                    </div>

                    {/* Method */}
                    <p className="text-xs text-neutral-500 font-medium">
                      {item.method ?? "—"}
                    </p>

                    {/* Submitted */}
                    <p className="text-xs text-neutral-400">
                      {item.createdAt ? format(new Date(item.createdAt), "MMM d, HH:mm") : "—"}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {item.status === "review" && (
                        <>
                          <Button
                            size="sm"
                            className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3"
                            disabled={markMutation.isPending}
                            onClick={() => markMutation.mutate({ id: item.id, status: "verified" })}
                          >
                            {markMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : "✓ Verify"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 px-3"
                            disabled={markMutation.isPending}
                            onClick={() => markMutation.mutate({ id: item.id, status: "failed" })}
                          >
                            ✗ Fail
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs h-7 px-3 gap-1"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        <Eye className="size-3" /> Details
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-neutral-400 font-medium mb-0.5">Credential ID</p>
                        <p className="font-mono text-neutral-700 dark:text-neutral-300 break-all">
                          {item.credentialId ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-400 font-medium mb-0.5">Purpose</p>
                        <p className="text-neutral-700 dark:text-neutral-300">{item.purpose ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400 font-medium mb-0.5">Latency</p>
                        <p className="text-neutral-700 dark:text-neutral-300">
                          {item.latencyMs != null ? `${item.latencyMs}ms` : "—"}
                        </p>
                      </div>
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-neutral-400 font-medium mb-0.5">Metadata</p>
                          <pre className="text-neutral-600 dark:text-neutral-400 text-[10px] bg-neutral-50 dark:bg-neutral-800 p-2 rounded-lg overflow-auto max-h-24">
                            {JSON.stringify(item.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
