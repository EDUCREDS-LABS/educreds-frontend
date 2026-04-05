import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Upload,
  FileSpreadsheet,
  RefreshCcw,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const DATA_TYPES = [
  { value: "STUDENTS", label: "Students" },
  { value: "CERTIFICATES", label: "Certificates" },
  { value: "COURSES", label: "Courses" },
  { value: "ENROLLMENTS", label: "Enrollments" },
];

type BatchStatusTone = {
  label: string;
  className: string;
};

const getStatusTone = (status?: string): BatchStatusTone => {
  const normalized = status?.toLowerCase() || "pending";
  if (["completed"].includes(normalized)) {
    return { label: "Completed", className: "bg-emerald-100/70 text-emerald-700 border border-emerald-300" };
  }
  if (["partially_completed"].includes(normalized)) {
    return { label: "Partial", className: "bg-amber-100/70 text-amber-700 border border-amber-300" };
  }
  if (["processing"].includes(normalized)) {
    return { label: "Processing", className: "bg-blue-100/70 text-blue-700 border border-blue-300" };
  }
  if (["failed"].includes(normalized)) {
    return { label: "Failed", className: "bg-rose-100/70 text-rose-700 border border-rose-300" };
  }
  if (["cancelled"].includes(normalized)) {
    return { label: "Cancelled", className: "bg-neutral-200 text-neutral-700 border border-neutral-300" };
  }
  return { label: "Pending", className: "bg-slate-100 text-slate-700 border border-slate-300" };
};

const getLogTone = (status?: string) => {
  const normalized = status?.toLowerCase() || "";
  if (normalized === "success") return "bg-emerald-100/70 text-emerald-700 border border-emerald-300";
  if (normalized === "warning") return "bg-amber-100/70 text-amber-700 border border-amber-300";
  if (normalized === "skipped") return "bg-slate-100 text-slate-700 border border-slate-300";
  return "bg-rose-100/70 text-rose-700 border border-rose-300";
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "MMM dd, yyyy");
};

export default function LmsMigrationPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [batchName, setBatchName] = useState("");
  const [dataType, setDataType] = useState(DATA_TYPES[0].value);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ["/api/lms-import/batches"],
    queryFn: () => api.getLmsImportBatches({ limit: 20, offset: 0 }),
    enabled: !!user,
  });

  const batches = useMemo(() => {
    if (Array.isArray(batchesData)) return batchesData;
    if (Array.isArray((batchesData as any)?.batches)) return (batchesData as any).batches;
    if (Array.isArray((batchesData as any)?.data)) return (batchesData as any).data;
    return [];
  }, [batchesData]);

  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const selectedBatch = useMemo(
    () => batches.find((batch: any) => batch.id === selectedBatchId),
    [batches, selectedBatchId],
  );

  const { data: batchStatus } = useQuery({
    queryKey: ["lms-import-batch-status", selectedBatchId],
    queryFn: () => api.getLmsImportBatchStatus(selectedBatchId as string),
    enabled: !!selectedBatchId,
    refetchInterval: (data) => {
      const status = (data as any)?.status || selectedBatch?.status;
      return ["processing", "pending"].includes(String(status).toLowerCase()) ? 5000 : false;
    },
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["lms-import-batch-logs", selectedBatchId],
    queryFn: () => api.getLmsImportLogs(selectedBatchId as string, { limit: 8, offset: 0 }),
    enabled: !!selectedBatchId,
  });

  const logs = useMemo(() => {
    if (Array.isArray(logsData)) return logsData;
    if (Array.isArray((logsData as any)?.logs)) return (logsData as any).logs;
    if (Array.isArray((logsData as any)?.data)) return (logsData as any).data;
    return [];
  }, [logsData]);

  const { data: schemaData, isLoading: schemaLoading } = useQuery({
    queryKey: ["lms-import-schema", dataType],
    queryFn: () => api.getLmsImportSchema(dataType),
    enabled: !!dataType && !!user,
  });

  const requiredFields = (schemaData as any)?.required || (schemaData as any)?.requiredFields || [];
  const optionalFields = (schemaData as any)?.optional || (schemaData as any)?.optionalFields || [];

  const createBatchMutation = useMutation({
    mutationFn: async () => {
      const fallbackName = `${DATA_TYPES.find((item) => item.value === dataType)?.label || "LMS"} Import ${format(new Date(), "MMM dd, yyyy")}`;
      const payload = {
        batchName: batchName.trim() || fallbackName,
        dataType,
      };
      return api.createLmsImportBatch(payload);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import Batch Created",
        description: `Batch ${data?.batchName || "created"} is ready for upload.`,
      });
      setBatchName("");
      setSelectedBatchId(data?.id || null);
      setCsvFile(null);
      setUploadResult(null);
      setPreviewRows([]);
      queryClient.invalidateQueries({ queryKey: ["/api/lms-import/batches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Batch Creation Failed",
        description: error.message || "Unable to create import batch.",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBatchId || !csvFile) {
        throw new Error("Select a batch and upload a CSV file.");
      }
      return api.uploadLmsImportCsv(selectedBatchId, csvFile);
    },
    onSuccess: (data: any) => {
      setUploadResult(data);
      toast({
        title: "CSV Uploaded",
        description: `Detected ${data?.recordCount || 0} records. Import job queued.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lms-import/batches"] });
      queryClient.invalidateQueries({ queryKey: ["lms-import-batch-status", selectedBatchId] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Unable to upload CSV file.",
        variant: "destructive",
      });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBatchId) {
        throw new Error("Select a batch to preview.");
      }
      return api.previewLmsImportBatch(selectedBatchId);
    },
    onSuccess: (data: any) => {
      const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.preview) ? data.preview : data?.data || [];
      setPreviewRows(rows);
      toast({
        title: "Preview Ready",
        description: "Review the first rows and schema validation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Preview Failed",
        description: error.message || "Unable to generate preview.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBatchId) {
        throw new Error("Select a batch to cancel.");
      }
      return api.cancelLmsImportBatch(selectedBatchId);
    },
    onSuccess: () => {
      toast({
        title: "Batch Cancelled",
        description: "The import was cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lms-import/batches"] });
      queryClient.invalidateQueries({ queryKey: ["lms-import-batch-status", selectedBatchId] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancel Failed",
        description: error.message || "Unable to cancel this batch.",
        variant: "destructive",
      });
    },
  });

  const status = (batchStatus as any)?.status || selectedBatch?.status;
  const statusTone = getStatusTone(status);
  const totalRecords = (batchStatus as any)?.totalRecords ?? selectedBatch?.totalRecords ?? 0;
  const processedRecords = (batchStatus as any)?.processedRecords ?? selectedBatch?.processedRecords ?? 0;
  const progressPercentage =
    (batchStatus as any)?.progressPercentage ??
    (totalRecords > 0 ? Math.round((processedRecords / totalRecords) * 100) : 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">LMS Migration & Continuous Sync</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Import students, courses, and certificates directly from your LMS with full audit logging.
          </p>
        </div>
        <Badge className="bg-slate-900 text-white">Phase 1 • CSV Imports</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Create Import Batch
            </CardTitle>
            <CardDescription>Define the dataset and prepare the batch for upload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Batch Name</label>
                <Input
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Fall 2026 Students"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Data Type</label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button onClick={() => createBatchMutation.mutate()} disabled={createBatchMutation.isPending}>
                {createBatchMutation.isPending ? "Creating..." : "Create Batch"}
              </Button>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/lms-import/batches"] })}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/70 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-neutral-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-800">Upload CSV File</p>
                  <p className="text-xs text-neutral-500">Attach your LMS export once the batch is ready.</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <input
                  id="lms-csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    if (file && !file.name.endsWith(".csv")) {
                      toast({
                        title: "Invalid File",
                        description: "Please upload a CSV file.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setCsvFile(file);
                    setUploadResult(null);
                    setPreviewRows([]);
                  }}
                />
                <label
                  htmlFor="lms-csv-upload"
                  className="flex-1 cursor-pointer rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 hover:border-neutral-300"
                >
                  {csvFile ? csvFile.name : "Choose a CSV file"}
                </label>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!csvFile || !selectedBatchId || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload CSV"}
                </Button>
              </div>
              {uploadResult && (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800">
                    {uploadResult?.recordCount || 0} records detected. Import queued for processing.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white">
              <div className="border-b border-neutral-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">CSV Schema</p>
                  <p className="text-sm text-neutral-900 mt-1">Required and optional columns for this dataset.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewMutation.mutate()}
                  disabled={!selectedBatchId || previewMutation.isPending}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
              <div className="p-4 space-y-4">
                {schemaLoading ? (
                  <p className="text-sm text-neutral-500">Loading schema...</p>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-2">Required Fields</p>
                      <div className="flex flex-wrap gap-2">
                        {(requiredFields.length > 0 ? requiredFields : ["email", "walletAddress"]).map((field: string) => (
                          <Badge key={field} className="bg-slate-100 text-slate-700 border border-slate-200">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700 mb-2">Optional Fields</p>
                      <div className="flex flex-wrap gap-2">
                        {(optionalFields.length > 0 ? optionalFields : ["enrollDate", "courseName"]).map((field: string) => (
                          <Badge key={field} className="bg-neutral-100 text-neutral-600 border border-neutral-200">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {previewRows.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Preview Rows</p>
                </div>
                <pre className="text-xs text-blue-900 bg-white/70 rounded-md p-3 overflow-auto max-h-40">
                  {JSON.stringify(previewRows.slice(0, 3), null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Batches
            </CardTitle>
            <CardDescription>Track historical imports and active queues.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {batchesLoading && <p className="text-sm text-neutral-500">Loading batches...</p>}
            {!batchesLoading && batches.length === 0 && (
              <div className="text-sm text-neutral-500">No import batches yet.</div>
            )}
            {!batchesLoading &&
              batches.slice(0, 6).map((batch: any) => {
                const tone = getStatusTone(batch.status);
                return (
                  <button
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`w-full text-left border rounded-lg p-3 transition-all ${
                      selectedBatchId === batch.id
                        ? "border-primary bg-primary/5"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{batch.batchName}</p>
                        <p className="text-xs text-neutral-500 mt-1">{formatDate(batch.createdAt)}</p>
                      </div>
                      <Badge className={tone.className}>{tone.label}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">{batch.dataType}</p>
                  </button>
                );
              })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Batch Status
            </CardTitle>
            <CardDescription>Operational insights for the selected batch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedBatch && (
              <p className="text-sm text-neutral-500">Select a batch to view progress.</p>
            )}
            {selectedBatch && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{selectedBatch.batchName}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Created {formatDate(selectedBatch.createdAt)} • {selectedBatch.dataType}
                    </p>
                  </div>
                  <Badge className={statusTone.className}>{statusTone.label}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs text-neutral-500">Total</p>
                    <p className="text-lg font-semibold text-neutral-900">{totalRecords}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs text-neutral-500">Processed</p>
                    <p className="text-lg font-semibold text-neutral-900">{processedRecords}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs text-neutral-500">Success</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {(batchStatus as any)?.successfulRecords ?? selectedBatch.successfulRecords ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs text-neutral-500">Errors</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {(batchStatus as any)?.failedRecords ?? selectedBatch.failedRecords ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["lms-import-batch-status", selectedBatchId] })}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => previewMutation.mutate()}
                    disabled={!selectedBatchId || previewMutation.isPending}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => cancelMutation.mutate()}
                    disabled={!selectedBatchId || cancelMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Batch
                  </Button>
                </div>

                {(batchStatus as any)?.errorSummary && (
                  <Alert className="border-rose-200 bg-rose-50">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <AlertDescription className="text-rose-800">
                      {(batchStatus as any).errorSummary}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Import Logs
            </CardTitle>
            <CardDescription>Latest row-level results for this batch.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedBatchId && <p className="text-sm text-neutral-500">Select a batch to view logs.</p>}
            {selectedBatchId && logsLoading && <p className="text-sm text-neutral-500">Loading logs...</p>}
            {selectedBatchId && !logsLoading && logs.length === 0 && (
              <p className="text-sm text-neutral-500">No log entries yet.</p>
            )}
            {selectedBatchId && logs.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id || `${log.rowNumber}-${log.createdAt}`}>
                      <TableCell className="font-medium">{log.rowNumber ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={getLogTone(log.status)}>{log.status || "ERROR"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {log.message || log.errorDetails || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
