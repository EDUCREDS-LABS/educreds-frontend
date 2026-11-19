/**
 * Institution Audit Trail — Real data from /api/institutions/me/audit-trail
 *
 * Table: Timestamp | Action | Actor | Details | IP Address
 * Filters: action type, date range. Export CSV. Auto-refresh every 30s.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Shield, Download, RefreshCw, Filter, Clock,
  ChevronDown, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";
import { API_CONFIG } from "@/config/api";
import { getAuthHeaders } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  details: Record<string, any> | null;
  createdAt: string;
  ipAddress: string | null;
}

type ActionFilter = "all" | "credential.issued" | "credential.revoked" | "institution.login" | "student.enrolled" | "api_key";

// ── Action badge colours ──────────────────────────────────────────────────────

const ACTION_COLOURS: Record<string, string> = {
  issue:  "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0",
  revoke: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-0",
  update: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0",
  login:  "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0",
  rotate: "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-0",
};

function actionColour(action: string): string {
  const lower = (action ?? "").toLowerCase();
  for (const [key, cls] of Object.entries(ACTION_COLOURS)) {
    if (lower.includes(key)) return cls;
  }
  return "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-0";
}

function actionLabel(action: string): string {
  return (action ?? "unknown").split(".").pop() ?? action;
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCsv(entries: AuditEntry[]) {
  const header = ["Timestamp", "Action", "Actor", "Details", "IP Address"];
  const rows = entries.map((e) => [
    e.createdAt,
    e.action,
    e.actor,
    e.details ? JSON.stringify(e.details).replace(/"/g, '""') : "",
    e.ipAddress ?? "",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-trail-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState(50);

  const queryParams = new URLSearchParams({ limit: String(limit) });
  if (actionFilter !== "all") queryParams.set("action", actionFilter);
  if (fromDate) queryParams.set("from", fromDate);
  if (toDate) queryParams.set("to", toDate);

  const { data, isLoading, refetch } = useQuery<AuditEntry[]>({
    queryKey: ["institution-audit-trail", actionFilter, fromDate, toDate, limit],
    queryFn: async () => {
      const res = await fetch(
        `${API_CONFIG.CERT}/api/institutions/me/audit-trail?${queryParams.toString()}`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  const entries: AuditEntry[] = Array.isArray(data) ? data : [];

  const ACTION_TABS: { id: ActionFilter; label: string }[] = [
    { id: "all",                label: "All"      },
    { id: "credential.issued",  label: "Issued"   },
    { id: "credential.revoked", label: "Revoked"  },
    { id: "institution.login",  label: "Logins"   },
    { id: "student.enrolled",   label: "Enrolled" },
    { id: "api_key",            label: "API Keys" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-3">
            <Shield className="size-7 text-indigo-500" /> Audit Trail
          </h1>
          <p className="text-sm text-neutral-500 mt-1">All activity on your institution account</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            disabled={entries.length === 0}
            onClick={() => exportCsv(entries)}
          >
            <Download className="size-3.5" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-[24px] border-none shadow-sm bg-white dark:bg-neutral-900">
        <CardContent className="p-4 space-y-3">
          {/* Action tabs */}
          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1">
            {ACTION_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActionFilter(t.id)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  actionFilter === t.id
                    ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <label className="text-xs text-neutral-500 whitespace-nowrap font-medium">From</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <label className="text-xs text-neutral-500 whitespace-nowrap font-medium">To</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl h-8 text-xs"
              />
            </div>
            {(fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => { setFromDate(""); setToDate(""); }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit table */}
      <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="size-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
                <Clock className="size-6 text-neutral-300 dark:text-neutral-600" />
              </div>
              <p className="font-bold text-neutral-500">No audit entries</p>
              <p className="text-sm text-neutral-400">
                {actionFilter !== "all" || fromDate || toDate
                  ? "Try adjusting the filters"
                  : "No account activity recorded yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[1.4fr_1fr_1fr_2fr_1fr] gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                {["Timestamp", "Action", "Actor", "Details", "IP"].map((h) => (
                  <p key={h} className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{h}</p>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[1.4fr_1fr_1fr_2fr_1fr] gap-2 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors items-center"
                  >
                    <p className="text-xs text-neutral-500 font-mono">
                      {entry.createdAt
                        ? format(new Date(entry.createdAt), "MMM d, HH:mm:ss")
                        : "—"}
                    </p>
                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit", actionColour(entry.action))}>
                      {actionLabel(entry.action)}
                    </Badge>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">
                      {entry.actor || "System"}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {entry.details
                        ? Object.entries(entry.details)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                            .join(", ")
                        : "—"}
                    </p>
                    <p className="text-xs text-neutral-400 font-mono truncate">
                      {entry.ipAddress || "—"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Load more */}
              {entries.length >= limit && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs gap-2"
                    onClick={() => setLimit((l) => l + 50)}
                  >
                    <ChevronDown className="size-3.5" /> Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
