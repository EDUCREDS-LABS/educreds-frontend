import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Download,
  Pause,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const MOCK_JOBS: BatchJob[] = [
  { id: "BATCH-0047", name: "Spring 2026 Graduation", type: "issue", status: "completed", totalRecords: 342, processedRecords: 342, failedRecords: 3, createdAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 82800000).toISOString(), fileName: "spring_2026_graduates.csv" },
  { id: "BATCH-0046", name: "Employer Verification Batch", type: "verify", status: "processing", totalRecords: 89, processedRecords: 54, failedRecords: 0, createdAt: new Date(Date.now() - 3600000).toISOString(), completedAt: null, fileName: "employer_verify_batch.csv" },
  { id: "BATCH-0045", name: "Expired Certificate Revocation", type: "revoke", status: "pending", totalRecords: 15, processedRecords: 0, failedRecords: 0, createdAt: new Date(Date.now() - 7200000).toISOString(), completedAt: null, fileName: "revoke_expired_q1.csv" },
  { id: "BATCH-0044", name: "Fall 2025 Supplementary", type: "issue", status: "failed", totalRecords: 128, processedRecords: 96, failedRecords: 32, createdAt: new Date(Date.now() - 172800000).toISOString(), completedAt: new Date(Date.now() - 169200000).toISOString(), fileName: "fall_2025_supplementary.csv" },
  { id: "BATCH-0043", name: "Partner University Import", type: "issue", status: "completed", totalRecords: 567, processedRecords: 567, failedRecords: 0, createdAt: new Date(Date.now() - 604800000).toISOString(), completedAt: new Date(Date.now() - 601200000).toISOString(), fileName: "partner_import_2026.csv" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  completed: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle },
  processing: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", icon: Loader2 },
  pending: { bg: "bg-neutral-100 dark:bg-neutral-800", text: "text-neutral-600 dark:text-neutral-400", icon: Clock },
  failed: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", icon: XCircle },
  paused: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", icon: Pause },
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  issue: { label: "Issuance", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  revoke: { label: "Revocation", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  verify: { label: "Verification", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
};

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BatchOperationsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

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

  const jobs: BatchJob[] = batchData?.jobs ?? MOCK_JOBS;

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => j.status === "processing").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    totalRecords: jobs.reduce((s, j) => s + j.totalRecords, 0),
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a CSV file.", variant: "destructive" });
      return;
    }
    toast({ title: "File uploaded", description: `${file.name} ready for processing. Configure batch options and start.` });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-[32px]" />)}
        </div>
        <Skeleton className="h-[500px] w-full rounded-[40px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
            Batch Operations
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            Bulk credential issuance, verification, and revocation
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-neutral-200 dark:border-neutral-700 font-bold text-xs uppercase tracking-widest gap-2">
            <Download className="size-4" />
            Template CSV
          </Button>
          <Button
            className="rounded-xl font-bold text-xs uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            New Batch
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{stats.total}</p>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.active}</p>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{stats.totalRecords.toLocaleString()}</p>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Total Records</p>
          </CardContent>
        </Card>
      </div>

      {/* Drop Zone */}
      <Card
        className={cn(
          "border-2 border-dashed rounded-[32px] cursor-pointer transition-all",
          dragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            : "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:border-blue-400"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-10 text-center">
          <Upload className="size-10 mx-auto text-neutral-400 mb-4" />
          <p className="text-sm font-bold text-neutral-600 dark:text-neutral-300">
            Drag & drop a CSV file here, or click to browse
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Supports bulk issuance, revocation, and verification. Max 10,000 records per batch.
          </p>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
            Batch Jobs
          </CardTitle>
          <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Recent and active batch operations
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-4">
            {jobs.map((job) => {
              const statusStyle = STATUS_STYLES[job.status];
              const typeLabel = TYPE_LABELS[job.type];
              const StatusIcon = statusStyle.icon;
              const progress = job.totalRecords > 0 ? Math.round((job.processedRecords / job.totalRecords) * 100) : 0;

              return (
                <div key={job.id} className="p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
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
                          <span>{job.id}</span>
                          <span className="flex items-center gap-1"><FileText className="size-3" /> {job.fileName}</span>
                          <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDate(job.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full self-start sm:self-center", statusStyle.bg, statusStyle.text)}>
                      {job.status}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{job.processedRecords.toLocaleString()} / {job.totalRecords.toLocaleString()} records</span>
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
    </div>
  );
}
