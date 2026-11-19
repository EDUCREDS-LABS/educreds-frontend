import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  ArrowRight,
  Eye,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  Database,
  Search,
  ShieldAlert,
  RefreshCw,
  X,
  UserCheck,
  TrendingUp,
  ChevronRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { governanceApiService } from '@/lib/governanceApiService';
import { api } from '@/lib/api';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getInstitutionToken } from '@/lib/authStorage';
import { API_CONFIG } from '@/config/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface EnrollmentRecord {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    eduCredsId?: string;
  };
  program?: { name: string; id?: string };
  cohort?: { name: string; id?: string };
  status: string;
}

const CREDENTIAL_TYPES = [
  'Certificate',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
  'Professional Certificate',
  'Short Course',
  'Micro-credential',
  'Badge',
];

// ── Wizard Step Indicator ──────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            "size-8 rounded-full flex items-center justify-center text-xs font-black transition-all",
            s < step ? "bg-primary text-white" : s === step ? "bg-primary text-white ring-4 ring-primary/20" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400",
          )}>
            {s < step ? <CheckCircle2 className="size-4" /> : s}
          </div>
          {s < total && (
            <div className={cn("w-12 h-0.5 rounded-full transition-all", s < step ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-700")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Student Picker ─────────────────────────────────────────────────────────────

interface StudentPickerProps {
  onSelect: (enrollment: EnrollmentRecord) => void;
  selectedStudent: EnrollmentRecord | null;
  onClear: () => void;
}

function StudentPicker({ onSelect, selectedStudent, onClear }: StudentPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterCohort, setFilterCohort] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  const token = getInstitutionToken();
  const baseUrl = API_CONFIG.CERT;

  const { data: programsData } = useQuery({
    queryKey: ['/api/institutions/programs', 'picker'],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/institutions/programs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!token,
  });

  const { data: cohortsData } = useQuery({
    queryKey: ['/api/institutions/cohorts', filterProgram],
    queryFn: async () => {
      const url = filterProgram
        ? `${baseUrl}/api/institutions/cohorts?programId=${filterProgram}`
        : `${baseUrl}/api/institutions/cohorts`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!token,
  });

  const params = new URLSearchParams();
  if (debouncedSearch) params.set('search', debouncedSearch);
  if (filterProgram) params.set('programId', filterProgram);
  if (filterCohort) params.set('cohortId', filterCohort);

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['/api/institutions/enrollments', debouncedSearch, filterProgram, filterCohort],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/institutions/enrollments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!token && (!!debouncedSearch || !!filterProgram || !!filterCohort),
  });

  const programs = programsData?.data || programsData?.programs || programsData || [];
  const cohorts = cohortsData?.data || cohortsData?.cohorts || [];
  const enrollments: EnrollmentRecord[] = (
    enrollmentsData?.students || enrollmentsData?.data || enrollmentsData?.enrollments || []
  ).slice(0, 20).map((item: any) => {
    // normalize both enrollment-shaped and student-shaped responses
    if (item.student) return item;
    return {
      student: {
        id: item.id || item.studentId,
        firstName: item.firstName || item.student?.firstName || '',
        lastName: item.lastName || item.student?.lastName || '',
        email: item.email || item.student?.email || '',
        eduCredsId: item.eduCredsId || item.student?.eduCredsId,
      },
      program: item.program || item.enrollment?.program,
      cohort: item.cohort || item.enrollment?.cohort,
      status: item.status || item.enrollment?.status || 'active',
    };
  });

  const statusColors: Record<string, string> = {
    eligible: 'bg-emerald-50 text-emerald-700',
    active: 'bg-blue-50 text-blue-700',
    graduated: 'bg-purple-50 text-purple-700',
    suspended: 'bg-red-50 text-red-600',
    pending: 'bg-amber-50 text-amber-700',
  };

  if (selectedStudent) {
    return (
      <div className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <UserCheck className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-sm text-neutral-900 dark:text-neutral-100 truncate">
              {selectedStudent.student.firstName} {selectedStudent.student.lastName}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {selectedStudent.student.eduCredsId && (
                <span className="text-[10px] font-bold text-neutral-500">{selectedStudent.student.eduCredsId}</span>
              )}
              {selectedStudent.program?.name && (
                <span className="text-[10px] font-bold text-neutral-500">• {selectedStudent.program.name}</span>
              )}
              <Badge className={cn("text-[9px] font-black border-none px-2 py-0.5", statusColors[selectedStudent.status] || 'bg-neutral-100 text-neutral-500')}>
                {selectedStudent.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-neutral-400 hover:text-red-500" onClick={onClear}>
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
          <Input
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 rounded-xl pl-9 bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
          />
        </div>
        <Select value={filterProgram} onValueChange={(v) => { setFilterProgram(v === '__all__' ? '' : v); setFilterCohort(''); }}>
          <SelectTrigger className="h-11 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner font-bold text-sm w-full sm:w-48">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl p-2">
            <SelectItem value="__all__" className="rounded-xl font-bold">All Programs</SelectItem>
            {(Array.isArray(programs) ? programs : []).map((p: any) => (
              <SelectItem key={p.id} value={p.id} className="rounded-xl font-bold">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterProgram && cohorts.length > 0 && (
          <Select value={filterCohort} onValueChange={(v) => setFilterCohort(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-11 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner font-bold text-sm w-full sm:w-44">
              <SelectValue placeholder="All Cohorts" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl p-2">
              <SelectItem value="__all__" className="rounded-xl font-bold">All Cohorts</SelectItem>
              {cohorts.map((c: any) => (
                <SelectItem key={c.id} value={c.id} className="rounded-xl font-bold">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {(debouncedSearch || filterProgram || filterCohort) && (
        <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          {enrollmentsLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 font-bold text-xs uppercase tracking-widest">
              No students found
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-56 overflow-y-auto">
              {enrollments.map((enrollment, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
                  onClick={() => onSelect(enrollment)}
                >
                  <div className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center shrink-0 text-xs font-black text-neutral-500">
                    {enrollment.student.firstName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 truncate">
                      {enrollment.student.firstName} {enrollment.student.lastName}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-neutral-400 truncate">{enrollment.student.email}</span>
                      {enrollment.student.eduCredsId && (
                        <span className="text-[10px] font-bold text-neutral-500">{enrollment.student.eduCredsId}</span>
                      )}
                      {enrollment.program?.name && (
                        <span className="text-[10px] text-neutral-400 truncate">• {enrollment.program.name}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={cn("text-[9px] font-black border-none px-2 py-0.5 shrink-0", statusColors[enrollment.status] || 'bg-neutral-100 text-neutral-500')}>
                    {enrollment.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!debouncedSearch && !filterProgram && !filterCohort && (
        <p className="text-[10px] text-neutral-400 font-medium text-center py-2">
          Search by name or email, or filter by program/cohort to find a student.
        </p>
      )}
    </div>
  );
}

// ── Step 2 form schema ─────────────────────────────────────────────────────────

const credentialDetailsSchema = z.object({
  certificateType: z.string().min(1, 'Credential type is required'),
  courseName: z.string().min(1, 'Course/Program name is required'),
  completionDate: z.string().min(1, 'Completion date is required'),
  grade: z.string().optional(),
  description: z.string().optional(),
});
type CredentialDetailsForm = z.infer<typeof credentialDetailsSchema>;

// ── Quick Issue Wizard ─────────────────────────────────────────────────────────

function QuickIssueWizard({
  isIssuanceBlocked,
  isLimitExceeded,
  institutionName,
}: {
  isIssuanceBlocked: boolean;
  isLimitExceeded: boolean;
  institutionName?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preStudentId = searchParams.get('studentId');

  const [step, setStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<EnrollmentRecord | null>(null);
  const [issuedCredentialId, setIssuedCredentialId] = useState<string | null>(null);
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);

  const form = useForm<CredentialDetailsForm>({
    resolver: zodResolver(credentialDetailsSchema),
    defaultValues: {
      certificateType: '',
      courseName: '',
      completionDate: new Date().toISOString().split('T')[0],
      grade: '',
      description: '',
    },
  });

  // Pre-select student from URL param
  const token = getInstitutionToken();
  const baseUrl = API_CONFIG.CERT;
  useQuery({
    queryKey: ['/api/institutions/enrollments/preselect', preStudentId],
    queryFn: async () => {
      // First try: fetch students directly and match by id
      const directRes = await fetch(`${baseUrl}/api/institutions/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (directRes.ok) {
        const directData = await directRes.json();
        const allStudents = directData?.students || directData?.data || [];
        const directMatch = allStudents.find((s: any) => s.id === preStudentId || s.eduCredsId === preStudentId);
        if (directMatch) {
          const normalized: EnrollmentRecord = directMatch.student ? directMatch : {
            student: { id: directMatch.id, firstName: directMatch.firstName, lastName: directMatch.lastName, email: directMatch.email, eduCredsId: directMatch.eduCredsId },
            program: directMatch.program ?? null,
            cohort: directMatch.cohort ?? null,
            status: directMatch.status || 'active',
          };
          handleStudentSelect(normalized);
          return directData;
        }
      }
      // Fallback: search enrollments
      const res = await fetch(`${baseUrl}/api/institutions/enrollments?search=${preStudentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const enrollments = data?.students || data?.data || data?.enrollments || [];
      const match = enrollments.find((e: any) => {
        const s = e.student || e;
        return s.id === preStudentId || s.eduCredsId === preStudentId;
      });
      if (match) {
        const normalized: EnrollmentRecord = match.student ? match : {
          student: { id: match.id, firstName: match.firstName, lastName: match.lastName, email: match.email, eduCredsId: match.eduCredsId },
          program: match.program,
          cohort: match.cohort,
          status: match.status || 'active',
        };
        handleStudentSelect(normalized);
      }
      return data;
    },
    enabled: !!token && !!preStudentId && !selectedStudent,
  });

  const handleStudentSelect = useCallback((enrollment: EnrollmentRecord) => {
    setSelectedStudent(enrollment);
    if (enrollment.program?.name) {
      form.setValue('courseName', enrollment.program.name, { shouldDirty: true });
    }
    setStep(2);
  }, [form]);

  const handleStudentClear = useCallback(() => {
    setSelectedStudent(null);
    setStep(1);
  }, []);

  const issueMutation = useMutation({
    mutationFn: async (data: CredentialDetailsForm) => {
      if (!selectedStudent) throw new Error('No student selected');
      
      // Get fresh token at request time to avoid stale auth
      const currentToken = getInstitutionToken();
      if (!currentToken) {
        throw new Error('Your session has expired. Please log in again.');
      }
      
      const body = {
        studentEmail: selectedStudent.student.email,
        studentName: `${selectedStudent.student.firstName} ${selectedStudent.student.lastName}`.trim(),
        completionDate: data.completionDate,
        grade: data.grade || undefined,
        certificateType: data.certificateType,
        courseName: data.courseName,
        description: data.description || undefined,
      };
      
      try {
        const res = await fetch(`${baseUrl}/api/certificates/issue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            studentEmail: body.studentEmail,
            studentName: body.studentName,
            studentWalletAddress: '',
            courseName: body.courseName,
            completionDate: body.completionDate,
            grade: body.grade,
            certificateType: body.certificateType,
            description: body.description,
          }),
        });
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as any).message || `Error ${res.status}`);
        }
        return res.json();
      } catch (error: any) {
        // Handle network-level errors that don't reach the server
        if (error.name === 'TypeError' || error.message?.includes('Failed to fetch')) {
          throw new Error(
            'Network error: Unable to connect to the server. ' +
            'Please check your internet connection and try again.'
          );
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      setIssuedCredentialId(result.certificateId || result.id || 'issued');
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      setStep(4); // success
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Certificate issuance failed.';
      toast({ title: 'Issuance failed', description: message, variant: 'destructive' });
    },
  });

  const handleIssue = form.handleSubmit(() => {
    if (isLimitExceeded) {
      toast({ title: 'Limit Reached', description: "Upgrade your plan to issue more.", variant: 'destructive' });
      return;
    }
    if (isIssuanceBlocked) {
      toast({ title: 'Verification required', description: "Complete institution verification first.", variant: 'destructive' });
      return;
    }
    issueMutation.mutate(form.getValues());
  }, () => {
    toast({ title: 'Check the form', description: 'Some required fields are missing.', variant: 'destructive' });
  });

  const resetWizard = () => {
    setStep(1);
    setSelectedStudent(null);
    setIssuedCredentialId(null);
    form.reset();
  };

  const credentialType = form.watch('certificateType');
  const completionDate = form.watch('completionDate');
  useEffect(() => {
    if (step !== 3 || !credentialType || !completionDate || !institutionName) return;
    let cancelled = false;
    setBadgeError(null);
    setBadgePreview(null);
    api.getBadgePreview({ institutionName, credentialType, issueYear: completionDate.slice(0, 4) })
      // getBadgePreview now returns a data URL (not blob URL), so no need to revoke
      .then(url => { if (!cancelled) setBadgePreview(url); })
      .catch((error: Error) => { if (!cancelled) setBadgeError(error.message); });
    return () => { cancelled = true; };
  }, [step, institutionName, credentialType, completionDate]);
  // No cleanup needed for data URLs (unlike blob URLs which need revokeObjectURL)

  // ── Step 4: Success ──────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="py-12 flex flex-col items-center gap-6 text-center">
        <div className="size-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
          <CheckCircle2 className="size-10 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight">Credential Issued!</h3>
          {issuedCredentialId && (
            <p className="text-sm font-mono text-neutral-500 bg-neutral-50 dark:bg-neutral-800 px-4 py-2 rounded-xl">
              ID: {issuedCredentialId}
            </p>
          )}
          <p className="text-sm text-neutral-500 max-w-sm">
            The credential has been recorded on-chain and the student will receive a claim link.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button onClick={resetWizard} className="gap-2">
            <Sparkles className="size-4" />
            Issue Another
          </Button>
          <Button variant="outline" asChild>
            <Link to="/institution/certificates">
              <Eye className="size-4 mr-2" />
              View All Credentials
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const formValues = form.watch();

  return (
    <div className="space-y-6">
      <StepIndicator step={step} total={3} />

      {/* Step 1: Find Student */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight">Find Student</h3>
            <p className="text-sm text-neutral-500">Search your enrolled students to get started.</p>
          </div>
          <StudentPicker
            selectedStudent={selectedStudent}
            onSelect={handleStudentSelect}
            onClear={handleStudentClear}
          />
          {selectedStudent && (
            <Button className="w-full h-12 gap-2 font-black" onClick={() => setStep(2)}>
              Continue
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      )}

      {/* Step 2: Credential Details */}
      {step === 2 && selectedStudent && (
        <Form {...form}>
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-black tracking-tight">Credential Details</h3>
              <p className="text-sm text-neutral-500">
                For <span className="font-bold text-neutral-700 dark:text-neutral-200">{selectedStudent.student.firstName} {selectedStudent.student.lastName}</span>
              </p>
            </div>

            <FormField
              control={form.control}
              name="certificateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest">Credential Type <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select credential type…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CREDENTIAL_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest">Course / Program Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. BSc Computer Science" className="h-11 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest">Completion Date <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="h-11 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest">Grade <span className="text-neutral-400 font-medium normal-case">(optional)</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. First Class, 3.8 GPA, Distinction" className="h-11 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest">Description <span className="text-neutral-400 font-medium normal-case">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional credential notes…" className="rounded-xl resize-none" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-11 gap-2" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 h-11 gap-2 font-black"
                onClick={async () => {
                  const valid = await form.trigger();
                  if (valid) setStep(3);
                }}
              >
                Review
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </Form>
      )}

      {/* Step 3: Confirm & Issue */}
      {step === 3 && selectedStudent && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight">Confirm & Issue</h3>
            <p className="text-sm text-neutral-500">Review before issuing. This action is permanent.</p>
          </div>

          {/* Preview card */}
          <div className="rounded-2xl border-2 border-neutral-100 dark:border-neutral-800 p-6 space-y-4 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Student', value: `${selectedStudent.student.firstName} ${selectedStudent.student.lastName}` },
                { label: 'EDU-ID', value: selectedStudent.student.eduCredsId || '—' },
                { label: 'Institution', value: institutionName || 'Your Institution' },
                { label: 'Credential Type', value: formValues.certificateType || '—' },
                { label: 'Program', value: formValues.courseName || '—' },
                { label: 'Completion Date', value: formValues.completionDate ? new Date(formValues.completionDate).toLocaleDateString() : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{value}</p>
                </div>
              ))}
              {formValues.grade && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Grade</p>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{formValues.grade}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 text-center">
            <h4 className="font-bold mb-3">On-chain badge preview</h4>
            {badgePreview ? <img src={badgePreview} alt="Public credential badge preview" className="size-40 mx-auto object-contain" /> :
              <p className="text-sm text-neutral-500">{badgeError ? `Preview unavailable: ${badgeError}` : 'Generating badge preview…'}</p>}
            <p className="text-xs text-neutral-500 mt-3">The public badge contains no student details.</p>
          </div>

          {/* Privacy note */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <ShieldCheck className="size-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Student PII is hashed. Only a cryptographic commitment is recorded on-chain.
            </p>
          </div>

          {(isIssuanceBlocked || isLimitExceeded) && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertCircle className="size-4" />
              <AlertDescription>
                {isIssuanceBlocked
                  ? 'Institution verification required before issuing credentials.'
                  : 'Monthly issuance limit reached. Upgrade your plan.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 h-12 gap-2" onClick={() => setStep(2)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button
              className="flex-1 h-12 gap-2 font-black bg-primary"
              disabled={issueMutation.isPending || isIssuanceBlocked || isLimitExceeded}
              onClick={handleIssue}
            >
              {issueMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Issuing…
                </>
              ) : (
                <>
                  <Zap className="size-4" />
                  Issue Credential
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function EnterpriseCertificateIssuance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const { data: subscription } = useQuery({ queryKey: ['/api/subscription/current'], queryFn: () => api.getCurrentSubscription() });
  const { data: certificatesData } = useQuery({ queryKey: ['/api/certificates/institution'], queryFn: () => api.getCertificates() });

  const allCertificates = (certificatesData as any)?.certificates || [];
  const planId = (subscription as any)?.subscription?.planId || 'starter';
  const certificatesUsed = (subscription as any)?.usage?.certificatesThisMonth || 0;
  const planCertificateLimit = planId === 'pro' ? 1000 : planId === 'enterprise' ? -1 : 200;

  const { data: governanceInstitution } = useQuery({
    queryKey: ["/governance/institutions", user?.id],
    enabled: !!user?.id,
    queryFn: () => governanceApiService.getInstitutionDetail(user!.id),
  });

  const isInstitutionVerified = useMemo(() => {
    if (!user || !governanceInstitution) return false;
    const statsAny = governanceInstitution as any;
    const hasIIN = Boolean(statsAny.iinTokenId || statsAny.iinId || statsAny.institution?.iinTokenId);
    const hasHighPoIC = Number(statsAny.poicScore || statsAny.institution?.poicScore || 0) >= 60;
    const isExplicitlyVerified = Boolean(user.isVerified) || Boolean(statsAny.institution?.isVerified);
    return isExplicitlyVerified || hasIIN || hasHighPoIC;
  }, [user, governanceInstitution]);

  const stats = {
    totalIssued: allCertificates.length,
    thisMonth: certificatesUsed,
    remaining: planCertificateLimit === -1 ? '∞' : Math.max(0, planCertificateLimit - certificatesUsed),
    successRate: 100,
  };

  const isLimitExceeded = planCertificateLimit !== -1 && certificatesUsed >= planCertificateLimit;
  const isIssuanceBlocked = !isInstitutionVerified;
  const isConnectorTier = user?.deploymentTier === 'cloud-connector' || user?.deploymentTier === 'enterprise-connector';

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Zap className="size-4" />
            Credential Issuance
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
            Issue <span className="text-primary">Credentials</span>.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xl font-medium leading-relaxed">
            Issue verifiable academic credentials in under 60 seconds. Search students, fill in details, confirm — done.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnectorTier && (
            <Button variant="outline" className="h-11 rounded-xl font-bold px-5" onClick={() => navigate('/connect/connector')}>
              <RefreshCw className="size-4 mr-2" />
              Sync Connector
            </Button>
          )}
          <Button variant="outline" className="h-11 rounded-xl font-bold px-5" onClick={() => navigate('/institution/certificates')}>
            <Eye className="size-4 mr-2" />
            All Credentials
          </Button>

        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Issued", value: stats.totalIssued, icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "This Month", value: stats.thisMonth, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Success Rate", value: `${stats.successRate}%`, icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Remaining", value: stats.remaining, icon: Database, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-lg bg-white dark:bg-neutral-900 rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{s.label}</p>
                <div className={cn("size-9 rounded-xl flex items-center justify-center", s.bg, s.color)}>
                  <s.icon className="size-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {isIssuanceBlocked && (
        <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
          <ShieldAlert className="size-5" />
          <AlertTitle className="font-black">Finish verification to start issuing</AlertTitle>
          <AlertDescription>
            Your institution needs verification (credibility score ≥ 60% or a valid IIN token).{' '}
            <Link to="/institution/governance-workspace" className="underline font-bold">Go to Governance Workspace →</Link>
          </AlertDescription>
        </Alert>
      )}
      {isLimitExceeded && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="size-5" />
          <AlertTitle className="font-black">Monthly issuance limit reached</AlertTitle>
          <AlertDescription>Upgrade your plan to issue more credentials this month.</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="border-none shadow-2xl bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
            <CardContent className="p-0">
              <Tabs defaultValue="quick-issue">
                <div className="px-8 pt-8 pb-0 border-b border-neutral-100 dark:border-neutral-800">
                  <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl h-14 gap-2 mb-0">
                    {[
                      { id: 'quick-issue', label: 'Single Issue', icon: Zap },
                      { id: 'bulk-csv', label: 'Bulk Issue', icon: Users },
                    ].map(m => (
                      <TabsTrigger
                        key={m.id}
                        value={m.id}
                        className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest h-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-primary data-[state=active]:shadow-lg gap-2"
                      >
                        <m.icon className="size-3.5" />
                        <span>{m.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="p-8">
                  <TabsContent value="quick-issue" className="mt-0 outline-none">
                    <QuickIssueWizard
                      isIssuanceBlocked={isIssuanceBlocked}
                      isLimitExceeded={isLimitExceeded}
                      institutionName={(user as any)?.name || (user as any)?.institution?.name}
                    />
                  </TabsContent>

                  <TabsContent value="bulk-csv" className="mt-0 outline-none">
                    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
                      <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Users className="size-8 text-neutral-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black">Bulk Issue via CSV</h3>
                        <p className="text-sm text-neutral-500 max-w-sm">
                          Upload a CSV file to issue credentials to hundreds of students at once.
                        </p>
                      </div>
                      <Button asChild className="gap-2 font-black">
                        <Link to="/institution/batch-operations">
                          <ArrowRight className="size-4" />
                          Go to Bulk Issuance
                        </Link>
                      </Button>
                    </div>
                  </TabsContent>


                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl bg-white dark:bg-neutral-900 rounded-[32px]">
            <CardHeader className="p-7 pb-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                <Info className="size-3" /> Before you issue
              </div>
              <CardTitle className="text-lg font-bold tracking-tight">Issuance checklist</CardTitle>
            </CardHeader>
            <CardContent className="p-7 pt-0 space-y-3">
              {[
                { label: "Student enrolled in SIS", status: "Required" },
                { label: "Institution verified", status: isInstitutionVerified ? "✓ Done" : "Pending" },
                { label: "Monthly quota", status: isLimitExceeded ? "Exceeded" : "Available" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{item.label}</span>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", item.status.startsWith('✓') ? 'text-emerald-500' : item.status === 'Exceeded' ? 'text-red-500' : 'text-primary')}>
                    {item.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-7 bg-neutral-900 dark:bg-black rounded-[32px] text-white space-y-4 relative overflow-hidden">
            <ShieldCheck className="size-8 text-primary" />
            <h4 className="text-xl font-black leading-tight">Privacy-first.<br />Globally verifiable.</h4>
            <p className="text-neutral-400 text-sm font-medium leading-relaxed">
              Student data is never stored on-chain. Only a cryptographic hash is committed — W3C VC standard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
