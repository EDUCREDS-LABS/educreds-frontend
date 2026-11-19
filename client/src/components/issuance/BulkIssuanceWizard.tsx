import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseCsv } from "@/lib/csvParser";
import {
  Upload,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  Download,
  ArrowRight,
  ArrowLeft,
  FileText,
  X,
  Loader2,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_CONFIG } from "@/config/api";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedRecipient {
  name: string;
  email: string;
  walletAddress?: string;
  [key: string]: string | undefined;
}

interface ValidationResult {
  valid: ParsedRecipient[];
  invalid: Array<{ row: number; reason: string }>;
}

interface IssuanceResult {
  completed: number;
  failed: number;
  total: number;
  jobId?: string;
  errors?: string[];
}

type Step = 1 | 2 | 3 | 4;

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Upload" },
  { n: 2, label: "Preview" },
  { n: 3, label: "Issue" },
  { n: 4, label: "Complete" },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div
            className={cn(
              "flex items-center justify-center size-8 rounded-full text-xs font-black transition-all",
              current === s.n
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40 scale-110"
                : current > s.n
                ? "bg-emerald-500 text-white"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
            )}
          >
            {current > s.n ? <CheckCircle className="size-4" /> : s.n}
          </div>
          <span
            className={cn(
              "ml-2 text-[10px] font-black uppercase tracking-widest hidden sm:block",
              current >= s.n ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400"
            )}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-8 sm:w-16 mx-3 rounded-full transition-all",
                current > s.n ? "bg-emerald-400" : "bg-neutral-200 dark:bg-neutral-700"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

/**
 * parseCSV — delegates to the shared, robust csvParser (handles BOM, quoted fields,
 * column reordering, case-insensitive headers, alias normalization, Excel exports).
 *
 * Column aliasing for issuance:
 *   name / full_name / candidate / student / recipient → name
 *   email / e-mail / email_address / candidate_email  → email
 *   walletAddress / wallet_address / wallet           → walletAddress
 */
function parseCSV(csv: string): { headers: string[]; rows: ParsedRecipient[]; unmappedHeaders: string[] } {
  const ISSUANCE_ALIASES: Record<string, keyof ParsedRecipient> = {
    name: "name", full_name: "name", fullname: "name", "full name": "name",
    candidate: "name", "candidate name": "name", candidate_name: "name",
    student: "name", student_name: "name", recipient: "name", recipient_name: "name",
    email: "email", "e-mail": "email", email_address: "email",
    candidate_email: "email", student_email: "email", recipient_email: "email",
    walletaddress: "walletAddress", wallet_address: "walletAddress", wallet: "walletAddress",
  };

  const { headers, rows } = parseCsv(csv);
  const unmappedHeaders: string[] = [];

  const mapped: ParsedRecipient[] = rows.map((r) => {
    const out: ParsedRecipient = { name: "", email: "" };
    for (const [rawKey, val] of Object.entries(r)) {
      const normalised = rawKey.trim().toLowerCase().replace(/\s+/g, "_");
      const alias = ISSUANCE_ALIASES[normalised] ?? ISSUANCE_ALIASES[rawKey.trim().toLowerCase()];
      if (alias) {
        out[alias] = val ?? "";
      } else {
        // Preserve unrecognised columns for passthrough (e.g. degree, graduation_date)
        out[rawKey] = val ?? "";
      }
    }
    return out;
  });

  // Report headers that couldn't be mapped to any known field (for UI warning)
  for (const h of headers) {
    const n = h.trim().toLowerCase().replace(/\s+/g, "_");
    if (!ISSUANCE_ALIASES[n] && !ISSUANCE_ALIASES[h.trim().toLowerCase()]) {
      // Only flag if it's not a passthrough field we deliberately keep
      const known = ["name", "email", "walletaddress", "wallet_address", "wallet"];
      if (!known.includes(n)) {
        unmappedHeaders.push(h);
      }
    }
  }

  return { headers, rows: mapped, unmappedHeaders };
}

function validateRows(rows: ParsedRecipient[]): ValidationResult {
  const valid: ParsedRecipient[] = [];
  const invalid: Array<{ row: number; reason: string }> = [];
  rows.forEach((r, i) => {
    if (!r.name?.trim()) {
      invalid.push({ row: i + 2, reason: "Missing name" });
    } else if (!r.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) {
      invalid.push({ row: i + 2, reason: "Invalid email" });
    } else {
      valid.push(r);
    }
  });
  return { valid, invalid };
}

// ── Main wizard ───────────────────────────────────────────────────────────────

interface BulkIssuanceWizardProps {
  onComplete?: (result: IssuanceResult) => void;
  onCancel?: () => void;
}

export function BulkIssuanceWizard({ onComplete, onCancel }: BulkIssuanceWizardProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<IssuanceResult | null>(null);
  const [notifyStudents, setNotifyStudents] = useState(true);

  // ── Issue mutation ────────────────────────────────────────────────────────
  const issueMutation = useMutation({
    mutationFn: async (recipients: ParsedRecipient[]) => {
      // Simulate progress while waiting for API
      let p = 0;
      const interval = setInterval(() => {
        p = Math.min(p + 3, 90);
        setProgress(p);
      }, 300);

      try {
        const res = await fetch(`${API_CONFIG.CERT}/api/certificates/issue-bulk`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients,
            notifyStudents,
            batchName: file?.name ?? "bulk-issuance",
          }),
        });
        clearInterval(interval);
        setProgress(100);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message ?? `HTTP ${res.status}`);
        }
        return await res.json();
      } catch (e) {
        clearInterval(interval);
        throw e;
      }
    },
    onSuccess: (data) => {
      const r: IssuanceResult = {
        completed: data.completed ?? data.successful ?? validation!.valid.length,
        failed: data.failed ?? 0,
        total: validation!.valid.length,
        jobId: data.jobId,
        errors: data.errors,
      };
      setResult(r);
      setStep(4);
      onComplete?.(r);
    },
    onError: (err: Error) => {
      toast({
        title: "Issuance failed",
        description: err.message,
        variant: "destructive",
      });
      setProgress(0);
    },
  });

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFile = useCallback(
    (f: File) => {
      if (!f.name.endsWith(".csv")) {
        toast({ title: "Invalid file", description: "Please upload a CSV file.", variant: "destructive" });
        return;
      }
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const { rows, unmappedHeaders } = parseCSV(csv);
        if (rows.length === 0) {
          toast({ title: "Empty file", description: "The CSV has no data rows.", variant: "destructive" });
          return;
        }
        // Warn about unrecognised columns — prevents silent null records
        if (unmappedHeaders.length > 0) {
          toast({
            title: "Unrecognised columns",
            description: `These columns could not be mapped and will be ignored: ${unmappedHeaders.slice(0, 5).join(", ")}${unmappedHeaders.length > 5 ? ` (+${unmappedHeaders.length - 5} more)` : ""}. Check column names match the template.`,
            variant: "destructive",
          });
        }
        setValidation(validateRows(rows));
        setStep(2);
      };
      reader.readAsText(f);
    },
    [toast]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const downloadTemplate = () => {
    const csv = "name,email,walletAddress,degree,graduationYear\nJohn Mukasa,john@example.com,,Bachelor of Science,2025";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "educreds-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadReport = () => {
    if (!result) return;
    const csv = `Bulk Issuance Report\nTotal,${result.total}\nIssued,${result.completed}\nFailed,${result.failed}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "issuance-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Issue Credentials
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Upload a CSV to issue credentials to multiple students at once
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-xl">
            <X className="size-4" />
          </Button>
        )}
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: Upload ── */}
      {step === 1 && (
        <div className="space-y-6">
          <Card
            className={cn(
              "border-2 border-dashed rounded-3xl cursor-pointer transition-all",
              dragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-neutral-200 dark:border-neutral-700 hover:border-blue-400 bg-neutral-50 dark:bg-neutral-900"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="py-16 text-center space-y-4">
              <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto">
                <Upload className="size-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-neutral-700 dark:text-neutral-200">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-neutral-400 mt-1">or click to browse</p>
              </div>
              <p className="text-xs text-neutral-400">
                Required columns: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">name</code>,{" "}
                <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">email</code>
                {" "}· Max 10,000 rows
              </p>
            </CardContent>
          </Card>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          <div className="flex justify-between items-center">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={downloadTemplate}>
              <Download className="size-4" />
              Download template CSV
            </Button>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Preview & Validate ── */}
      {step === 2 && validation && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="rounded-2xl border-none shadow-md bg-white dark:bg-neutral-900">
              <CardContent className="p-5 text-center">
                <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                  {validation.valid.length + validation.invalid.length}
                </p>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                  Detected
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-md bg-white dark:bg-neutral-900">
              <CardContent className="p-5 text-center">
                <p className="text-2xl font-black text-emerald-600">{validation.valid.length}</p>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                  ✓ Valid
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-md bg-white dark:bg-neutral-900">
              <CardContent className="p-5 text-center">
                <p className={cn("text-2xl font-black", validation.invalid.length > 0 ? "text-amber-600" : "text-neutral-300")}>
                  {validation.invalid.length}
                </p>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                  ⚠ Need attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* File info */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
            <FileText className="size-5 text-neutral-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200 truncate">{file?.name}</p>
              <p className="text-xs text-neutral-400">{(file?.size ?? 0 / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto rounded-lg shrink-0"
              onClick={() => { setFile(null); setValidation(null); setStep(1); }}
            >
              Change file
            </Button>
          </div>

          {/* Invalid rows */}
          {validation.invalid.length > 0 && (
            <Alert className="rounded-2xl border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-2">{validation.invalid.length} rows require attention:</p>
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {validation.invalid.slice(0, 10).map((e) => (
                    <li key={e.row}>Row {e.row}: {e.reason}</li>
                  ))}
                  {validation.invalid.length > 10 && (
                    <li className="text-amber-600">…and {validation.invalid.length - 10} more</li>
                  )}
                </ul>
                <p className="text-xs mt-2 font-medium">
                  These rows will be skipped. Only {validation.valid.length} valid records will be issued.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Notify toggle */}
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <Bell className="size-5 text-neutral-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">Notify students by email</p>
              <p className="text-xs text-neutral-400">Students will receive an email with their credential link</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyStudents}
              onClick={() => setNotifyStudents((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
                notifyStudents ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-700"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform",
                  notifyStudents ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button
              className="flex-1 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              disabled={validation.valid.length === 0}
              onClick={() => setStep(3)}
            >
              Issue {validation.valid.length} credentials
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Issue ── */}
      {step === 3 && validation && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-lg bg-white dark:bg-neutral-900">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto">
                  <Users className="size-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                  Ready to issue {validation.valid.length} credentials
                </h3>
                <p className="text-sm text-neutral-500">
                  This will issue verifiable credentials to all {validation.valid.length} valid recipients.
                  {notifyStudents && " Students will be notified by email."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800">
                  <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">{validation.valid.length}</p>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">To issue</p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800">
                  <p className="text-lg font-black text-neutral-900 dark:text-neutral-100">{validation.invalid.length}</p>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Skipped</p>
                </div>
              </div>

              {issueMutation.isPending && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Issuing credentials…
                    </span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full" />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              disabled={issueMutation.isPending}
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button
              className="flex-1 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
              disabled={issueMutation.isPending}
              onClick={() => {
                setProgress(0);
                issueMutation.mutate(validation.valid);
              }}
            >
              {issueMutation.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Issuing…</>
              ) : (
                <><Zap className="size-4" /> Issue {validation.valid.length} credentials</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Complete ── */}
      {step === 4 && result && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-none shadow-lg bg-white dark:bg-neutral-900">
            <CardContent className="p-8 text-center space-y-6">
              <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
                <CheckCircle className="size-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                  {result.completed} credentials issued
                </h3>
                <p className="text-sm text-neutral-500 mt-2">
                  {notifyStudents
                    ? "Students have been notified by email with their credential links."
                    : "Credentials are now live and verifiable."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{result.completed}</p>
                  <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">Issued</p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800">
                  <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">{result.total}</p>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total</p>
                </div>
                <div className={cn("p-4 rounded-2xl", result.failed > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-neutral-50 dark:bg-neutral-800")}>
                  <p className={cn("text-xl font-black", result.failed > 0 ? "text-red-600" : "text-neutral-300 dark:text-neutral-600")}>
                    {result.failed}
                  </p>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Failed</p>
                </div>
              </div>

              {result.jobId && (
                <p className="text-xs text-neutral-400 font-mono">Job ID: {result.jobId}</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl gap-2 flex-1" onClick={downloadReport}>
              <Download className="size-4" />
              Download report
            </Button>
            <Button
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              onClick={() => {
                setStep(1);
                setFile(null);
                setValidation(null);
                setResult(null);
                setProgress(0);
              }}
            >
              Issue another batch
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
