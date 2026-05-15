import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Database,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
  ChevronRight,
  Search,
  Download,
  Trash2,
  HardDrive
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

const DATA_TYPES = [
  { value: "STUDENTS", label: "Student Registry", icon: Users },
  { value: "CERTIFICATES", label: "Certificate Ledger", icon: FileText },
  { value: "COURSES", label: "Curriculum Assets", icon: Database },
  { value: "ENROLLMENTS", label: "Enrollment Matrix", icon: Activity },
];

export default function LmsMigrationPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [batchName, setBatchName] = useState("");
  const [dataType, setDataType] = useState(DATA_TYPES[0].value);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const { data: batchesResponse, isLoading: batchesLoading } = useQuery({
    queryKey: ["/api/lms-import/batches", user?.id],
    queryFn: () => api.getLmsImportBatches(),
    enabled: !!user?.id,
  });

  const { data: logsResponse, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/lms-import/logs", selectedBatchId],
    queryFn: () => selectedBatchId ? api.getLmsImportLogs(selectedBatchId) : Promise.resolve({ data: [] }),
    enabled: !!selectedBatchId,
  });

  const batches = batchesResponse?.data || [];
  const logs = logsResponse?.data || [];

  const uploadMutation = useMutation({
    mutationFn: (data: FormData) => api.uploadLmsImport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms-import/batches"] });
      toast({ title: "Protocol Initiated", description: "LMS data batch uploaded for secure ingestion." });
      setCsvFile(null);
      setBatchName("");
    },
    onError: (error: any) => {
      toast({ title: "Ingestion Failed", description: error?.message || "Verify CSV schema and retry.", variant: "destructive" });
    },
  });

  const handleUpload = () => {
    if (!csvFile || !batchName) {
      toast({ title: "Missing Assets", description: "Batch name and CSV payload required.", variant: "destructive" });
      return;
    }
    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("name", batchName);
    formData.append("dataType", dataType);
    uploadMutation.mutate(formData);
  };

  const selectedBatch = useMemo(() => 
    batches.find((b: any) => b.id === selectedBatchId), [batches, selectedBatchId]
  );

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <RefreshCw className="size-4" />
            Strategic Migration
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
            LMS <span className="text-primary">Bridge</span>.
          </h1>
          <p className="text-neutral-500 font-medium max-w-xl">
            Synchronize legacy academic records with decentralised protocol infrastructure via secure batch ingestion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Upload Interface */}
        <div className="xl:col-span-5 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
            <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800">
              <CardTitle className="text-2xl font-black">Ingestion Payload</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">New Migration Batch</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Batch Identifier</label>
                  <Input 
                    placeholder="Q3 Academic Cycle 2024" 
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Resource Schema</label>
                  <Select value={dataType} onValueChange={setDataType}>
                    <SelectTrigger className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl p-2 border-neutral-100 dark:border-neutral-800">
                      {DATA_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value} className="rounded-xl font-bold py-3">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">CSV Source</label>
                  <div className={cn(
                    "border-2 border-dashed rounded-[32px] p-10 transition-all flex flex-col items-center gap-4 cursor-pointer",
                    csvFile ? "border-primary bg-primary/5" : "border-neutral-200 dark:border-neutral-800 hover:border-primary/50"
                  )} onClick={() => document.getElementById('lms-csv-input')?.click()}>
                    <input 
                      type="file" 
                      id="lms-csv-input" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)} 
                    />
                    <div className={cn(
                      "size-16 rounded-[24px] flex items-center justify-center transition-all",
                      csvFile ? "bg-primary text-white scale-110" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                    )}>
                      {csvFile ? <CheckCircle className="size-8" /> : <Upload className="size-8" />}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                        {csvFile ? csvFile.name : "Select CSV payload"}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">
                        {csvFile ? `${(csvFile.size / 1024).toFixed(2)} KB` : "Max file size: 50MB"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !csvFile || !batchName}
                className="w-full h-16 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                {uploadMutation.isPending ? <RefreshCw className="size-5 mr-2 animate-spin" /> : <HardDrive className="size-5 mr-2" />}
                Initiate Synchronisation
              </Button>
            </CardContent>
          </Card>

          {/* Security Banner */}
          <div className="p-8 bg-neutral-900 rounded-[40px] text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <ShieldCheck className="size-32" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/5">
                <Lock className="size-6 text-primary" />
              </div>
              <h4 className="text-2xl font-black tracking-tight leading-tight">Integrity Guaranteed.</h4>
              <p className="text-white/60 text-sm font-medium leading-relaxed">All LMS assets are cryptographically hashed and verified before protocol deployment. Data is encrypted at rest during the ingestion phase.</p>
            </div>
          </div>
        </div>

        {/* Status & Logs */}
        <div className="xl:col-span-7 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
            <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black">Registry State</CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Active & Historic Batches</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-neutral-400 hover:text-primary">
                <RefreshCw className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left">
                      <th className="px-10 py-5">Protocol Batch</th>
                      <th className="px-10 py-5">Classification</th>
                      <th className="px-10 py-5">Telemetry</th>
                      <th className="px-10 py-5">Status</th>
                      <th className="px-10 py-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {batchesLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}><td colSpan={5} className="px-10 py-6"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>
                      ))
                    ) : batches.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-10 py-24 text-center">
                          <div className="flex flex-col items-center gap-4 text-neutral-300">
                            <FileSpreadsheet className="size-16 opacity-20" />
                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">No active migrations detected</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch: any) => (
                        <tr key={batch.id} className={cn(
                          "hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group",
                          selectedBatchId === batch.id && "bg-primary/[0.03] border-l-4 border-l-primary"
                        )} onClick={() => setSelectedBatchId(batch.id)}>
                          <td className="px-10 py-6">
                            <p className="text-sm font-black text-neutral-900 dark:text-neutral-100">{batch.name}</p>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                              {batch.createdAt && isValid(new Date(batch.createdAt)) ? format(new Date(batch.createdAt), "MMM dd, yyyy") : "Pending"}
                            </p>
                          </td>
                          <td className="px-10 py-6">
                            <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-widest border-neutral-200">
                              {batch.dataType}
                            </Badge>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                              <div className="space-y-1 flex-1 min-w-[100px]">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1">
                                  <span>Load</span>
                                  <span>{Math.round(((batch.processedCount || 0) / (batch.totalCount || 1)) * 100)}%</span>
                                </div>
                                <Progress value={((batch.processedCount || 0) / (batch.totalCount || 1)) * 100} className="h-1.5" />
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <StatusBadge status={batch.status} />
                          </td>
                          <td className="px-10 py-6 text-right">
                            <ChevronRight className="size-4 text-neutral-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Logs for selected batch */}
          {selectedBatchId && (
            <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900 animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Audit Trail: {selectedBatch?.name}</CardTitle>
                  <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Item-level ingestion results</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-9 px-4">
                    <Download className="size-3.5 mr-2" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto no-scrollbar">
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {logsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-6"><Skeleton className="h-12 w-full rounded-xl" /></div>
                    ))
                  ) : logs.length === 0 ? (
                    <div className="p-20 text-center text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                      No audit logs generated for this registry block.
                    </div>
                  ) : (
                    logs.map((log: any, i: number) => (
                      <div key={i} className="p-6 hover:bg-neutral-50/50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "size-10 rounded-xl flex items-center justify-center",
                            log.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          )}>
                            {log.status === 'SUCCESS' ? <CheckCircle className="size-5" /> : <XCircle className="size-5" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                              {log.entityIdentifier || `Item #${i+1}`}
                            </p>
                            <p className="text-[10px] font-medium text-neutral-500 max-w-md truncate">
                              {log.message || "Processed successfully"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="ghost" className="text-[9px] font-black text-neutral-400 group-hover:text-neutral-900">
                          {log.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = status?.toLowerCase() || "pending";
  
  const styles: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-600",
    partially_completed: "bg-amber-50 text-amber-600",
    processing: "bg-blue-50 text-blue-600",
    failed: "bg-red-50 text-red-600",
    cancelled: "bg-neutral-100 text-neutral-500",
    pending: "bg-neutral-50 text-neutral-400",
  };

  return (
    <Badge className={cn(
      "border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest",
      styles[normalized] || styles.pending
    )}>
      {normalized.replace('_', ' ')}
    </Badge>
  );
}

const Users = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
