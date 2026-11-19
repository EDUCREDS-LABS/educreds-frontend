/**
 * Verification History — /verifier/history
 *
 * Paginated, filterable log of all past verifications.
 * Export to CSV. No blockchain terminology.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, AlertTriangle, Search, Download,
  Building2, User, Calendar, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { format } from "date-fns";

type ResultFilter = "all" | "valid" | "failed" | "flagged";

const RESULT_CFG = {
  valid:   { label: "Verified",  icon: CheckCircle, color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" },
  failed:  { label: "Failed",    icon: XCircle,      color: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"               },
  flagged: { label: "Flagged",   icon: AlertTriangle, color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"       },
};

const PAGE_SIZE = 20;

export default function VerifierHistoryPage() {
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["verifier-history", filter, page],
    queryFn: async () => {
      try {
        return await (api as any).getVerificationHistory?.({
          result: filter === "all" ? undefined : filter,
          page,
          limit: PAGE_SIZE,
        });
      } catch { return null; }
    },
    staleTime: 30_000,
  });

  const items: any[] = Array.isArray(data) ? data : (data?.results ?? data?.verifications ?? []);
  const total: number = data?.total ?? items.length;

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.studentName?.toLowerCase().includes(q) ||
      item.credentialTitle?.toLowerCase().includes(q) ||
      item.institutionName?.toLowerCase().includes(q) ||
      item.verifiedBy?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const rows = [
      ["Date", "Credential", "Student", "Institution", "Result", "Verified By"],
      ...items.map((i) => [
        i.verifiedAt ? format(new Date(i.verifiedAt), "yyyy-MM-dd HH:mm") : "",
        i.credentialTitle ?? i.courseName ?? "",
        i.studentName ?? "",
        i.institutionName ?? "",
        i.result ?? i.status ?? "",
        i.verifiedBy ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `verification-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const tabs: { id: ResultFilter; label: string }[] = [
    { id: "all",     label: "All"      },
    { id: "valid",   label: "Verified" },
    { id: "failed",  label: "Failed"   },
    { id: "flagged", label: "Flagged"  },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Verification History
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{total} total verifications</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 self-start sm:self-center"
          onClick={exportCSV}
          disabled={items.length === 0}
        >
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setFilter(t.id); setPage(1); }}
              className={cn(
                "py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                filter === t.id
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-9 rounded-xl border-neutral-200 dark:border-neutral-700 h-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900 overflow-hidden">
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <Search className="size-10 text-neutral-200 dark:text-neutral-700 mx-auto" />
              <p className="text-sm text-neutral-400 font-medium">No results found</p>
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
            <div>
              {/* Header */}
              <div className="grid grid-cols-12 px-6 py-3 border-b border-neutral-50 dark:border-neutral-800">
                {["Date", "Credential", "Student", "Institution", "Result"].map((h, i) => (
                  <div
                    key={h}
                    className={cn(
                      "text-[10px] font-black text-neutral-400 uppercase tracking-widest",
                      i === 0 ? "col-span-2" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-3" : "col-span-2"
                    )}
                  >
                    {h}
                  </div>
                ))}
              </div>
              {filtered.map((item, idx) => {
                const result = item.result ?? (item.status === "valid" ? "valid" : item.status === "revoked" ? "failed" : "failed");
                const cfg = RESULT_CFG[result as keyof typeof RESULT_CFG] ?? RESULT_CFG.valid;
                const Icon = cfg.icon;
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 px-6 py-4 border-b border-neutral-50 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="col-span-2 flex items-center">
                      <p className="text-xs text-neutral-500">
                        {item.verifiedAt ? format(new Date(item.verifiedAt), "MMM d, h:mm a") : "—"}
                      </p>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                        {item.credentialTitle ?? item.courseName ?? "—"}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <User className="size-3 text-neutral-400 shrink-0" />
                      <p className="text-xs text-neutral-500 truncate">{item.studentName ?? "—"}</p>
                    </div>
                    <div className="col-span-3 flex items-center gap-1">
                      <Building2 className="size-3 text-neutral-400 shrink-0" />
                      <p className="text-xs text-neutral-500 truncate">{item.institutionName ?? "—"}</p>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-0 gap-1", cfg.color)}>
                        <Icon className="size-2.5" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" className="rounded-xl gap-1"
              disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-3" /> Previous
            </Button>
            <Button
              variant="outline" size="sm" className="rounded-xl gap-1"
              disabled={page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
