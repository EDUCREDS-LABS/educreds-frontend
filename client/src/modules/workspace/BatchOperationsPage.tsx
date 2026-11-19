import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BulkCSVUploader } from "@/components/institution/BulkCSVUploader";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Pause,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { api } from "@/lib/api";

interface BatchJob {
  id: string;
  name: string;
  type: "issue" | "revoke" | "verify";
  status: "pending" | "processing" | "completed" | "failed" | "paused";
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  createdAt: string;
  completedAt: string | null;
  fileName: string;
}

// Backend returns different field names - map them safely
function mapBackendJobToBatchJob(job: any): BatchJob {
  // Backend uses: totalItems, processedItems, failedItems
  // Frontend expects: totalRecords, processedRecords, failedRecords
  const totalRecords = typeof job.totalItems === 'number' ? job.totalItems : 
                       typeof job.totalRecords === 'number' ? job.totalRecords : 0;
  const processedRecords = typeof job.processedItems === 'number' ? job.processedItems : 
                           typeof job.processedRecords === 'number' ? job.processedRecords : 0;
  const failedRecords = typeof job.failedItems === 'number' ? job.failedItems : 
                        typeof job.failedRecords === 'number' ? job.failedRecords : 0;
  
  return {
    id: job.id || '',
    name: job.name || job.batchName || 'Unnamed Job',
    type: (job.type as BatchJob['type']) || 'issue',
    status: (job.status as BatchJob['status']) || 'pending',
    totalRecords,
    processedRecords,
    failedRecords,
    createdAt: job.createdAt || new Date().toISOString(),
    completedAt: job.completedAt || null,
    fileName: job.fileName || job.sourceFileName || 'unknown.csv',
  };
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  completed: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle },
  processing: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", icon: Loader2 },
  pending:   { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", icon: Clock },
  failed:    { bg: "bg-red-50 dark:bg-red-950/40",     text: "text-red-700 dark:text-red-400",         icon: XCircle },
  paused:    { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400",     icon: Pause },
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  issue:  { label: "Issuance",     color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  revoke: { label: "Revocation",   color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  verify: { label: "Verification", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
};

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BatchOperationsPage() {
  const [showWizard, setShowWizard] = useState(false);

  const { data: batchData, isLoading } = useQuery({
    queryKey: ["batch-operations"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_CONFIG.CERT}/api/institutions/batch-operations`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
      } catch {
        return null;
      }
    },
    staleTime: 10000,
  });

  const rawJobs = batchData?.jobs ?? [];
  const jobs: BatchJob[] = rawJobs.map(mapBackendJobToBatchJob);
  const isApiError = !isLoading && !batchData;

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => j.status === "processing").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    totalRecords: jobs.reduce((s, j) => s + (j.totalRecords || 0), 0),
  };

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ["issuance-templates"],
    queryFn: async () => {
      try {
        return await api.getTemplates();
      } catch {
        return { templates: [], data: [] };
      }
    },
    staleTime: 30000,
  });

  const templates = (templatesData?.templates ?? templatesData?.data ?? []) as any[];

  // ── Wizard overlay ─────────────────────────────────────────────────────────
  if (showWizard) {
    return (
      <div className="animate-in fade-in duration-300 space-y-4">
        <Button variant="ghost" className="gap-2 rounded-xl" onClick={() => setShowWizard(false)}>
          ← Back to jobs
        </Button>
        <BulkCSVUploader templates={templates.map((t) => ({ id: t.metadata?.id ?? t.id, name: t.metadata?.name ?? t.name, category: t.metadata?.category ?? 'academic' }))} isLimitExceeded={false} />
        {templatesLoading && (
          <p className="text-xs text-neutral-400">Loading templates…</p>
        )}
      </div>
    );
  }

  // ── Main list view ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-[32px]" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[40px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
            Bulk Issuance
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            Issue credentials to multiple students at once
          </p>
        </div>
        <Button
          className="rounded-xl font-bold text-xs uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setShowWizard(true)}
        >
          <Plus className="size-4" />
          New issuance
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: "Total Jobs",      value: stats.total,                      color: "text-neutral-900 dark:text-neutral-100" },
          { label: "Active",          value: stats.active,                     color: "text-blue-600 dark:text-blue-400" },
          { label: "Completed",       value: stats.completed,                  color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total Records",   value: (stats.totalRecords ?? 0).toLocaleString(), color: "text-neutral-900 dark:text-neutral-100" },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
            <CardContent className="p-6 text-center">
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isApiError && (
        <Alert className="rounded-2xl border-amber-200 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="size-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            Could not load batch job history. Your previous jobs will appear once the connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {!isApiError && jobs.length === 0 && (
        <Card
          className="border-2 border-dashed rounded-3xl cursor-pointer hover:border-blue-400 transition-colors bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
          onClick={() => setShowWizard(true)}
        >
          <CardContent className="py-16 text-center space-y-4">
            <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto">
              <Upload className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-neutral-700 dark:text-neutral-200">No issuance jobs yet</p>
              <p className="text-sm text-neutral-400 mt-1">Click to issue your first batch of credentials</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs list */}
      {jobs.length > 0 && (
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
              Issuance History
            </CardTitle>
            <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Recent and active batch jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-4">
              {jobs.map((job) => {
                const statusStyle = STATUS_STYLES[job.status] ?? STATUS_STYLES.pending;
                const typeLabel = TYPE_LABELS[job.type] ?? TYPE_LABELS.issue;
                const StatusIcon = statusStyle.icon;
                const progress = job.totalRecords > 0
                  ? Math.round((job.processedRecords / job.totalRecords) * 100)
                  : 0;

                return (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("size-10 rounded-xl flex items-center justify-center", statusStyle.bg, statusStyle.text)}>
                          <StatusIcon className={cn("size-5", job.status === "processing" && "animate-spin")} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{job.name}</span>
                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", typeLabel.color)}>
                              {typeLabel.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-1">
                              <FileText className="size-3" /> {job.fileName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" /> {formatDate(job.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full self-start sm:self-center", statusStyle.bg, statusStyle.text)}>
                        {job.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{(job.processedRecords ?? 0).toLocaleString()} / {(job.totalRecords ?? 0).toLocaleString()} records</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 rounded-full" />
                      {job.failedRecords > 0 && (
                        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                          <AlertTriangle className="size-3" />
                          {job.failedRecords} failed records
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
