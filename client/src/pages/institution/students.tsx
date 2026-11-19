/**
 * SIS Sprint 2: Institution Students Management
 * - Student list with enrollment status, program, cohort
 * - Filter by program / cohort / enrollment status
 * - Enroll modal: assign student to program + cohort
 * - Mark Eligible for enrolled/completed students
 * - Issue Credential link from student row
 * - Enroll New Student dialog
 * - Graduation Record Entry form
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_CONFIG } from "@/config/api";
import {
  UserPlus, Search, GraduationCap, BookOpen, X, Check, Loader2,
  FileText, Award, Users, Filter, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getInstitutionToken } from "@/lib/authStorage";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  eduCredsId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  studentNumber: string | null;
  isActive: boolean;
  enrolledAt: string;
}

interface Enrollment {
  id: string;
  studentId: string;
  programId: string | null;
  cohortId: string | null;
  academicYear: string | null;
  status: string;
  enrolledAt: string;
}

interface Program {
  id: string;
  name: string;
  code: string | null;
  level: string | null;
}

interface Cohort {
  id: string;
  name: string;
  programId: string | null;
  academicYear: string | null;
}

interface StudentWithEnrollment extends Student {
  enrollment?: Enrollment | null;
  programName?: string | null;
  cohortName?: string | null;
}

interface EnrollFormData {
  firstName: string;
  lastName: string;
  email: string;
  studentNumber: string;
  courseCode: string;
  courseName: string;
  programLevel: string;
}

interface AssignEnrollmentData {
  programId: string;
  cohortId: string;
  academicYear: string;
}

interface GraduationRecord {
  completionDate: string;
  grade: string;
  credentialType: string;
  courseName: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_ENROLL: EnrollFormData = {
  firstName: '', lastName: '', email: '',
  studentNumber: '', courseCode: '', courseName: '', programLevel: '',
};

const EMPTY_ASSIGN: AssignEnrollmentData = {
  programId: '', cohortId: '', academicYear: '',
};

const EMPTY_GRAD: GraduationRecord = {
  completionDate: '', grade: '', credentialType: '', courseName: '',
};

const PROGRAM_LEVELS = [
  'Certificate', 'Diploma', 'Bachelor', 'Postgraduate Diploma',
  'Master', 'Doctorate', 'Professional', 'Short Course',
];

const CREDENTIAL_TYPES = [
  'Certificate of Completion', 'Diploma', 'Bachelor of Science',
  'Bachelor of Arts', "Master's Degree", 'Doctorate', 'Professional Certificate',
  'Micro-credential', 'Badge',
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Students' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'not_enrolled', label: 'Not Enrolled' },
];

const ENROLLMENT_STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active:      { label: 'Enrolled',   variant: 'default' },
  eligible:    { label: 'Eligible',   variant: 'secondary' },
  completed:   { label: 'Completed',  variant: 'secondary' },
  graduated:   { label: 'Graduated',  variant: 'secondary' },
  withdrawn:   { label: 'Withdrawn',  variant: 'destructive' },
  suspended:   { label: 'Suspended',  variant: 'destructive' },
};

// ─── API helpers ─────────────────────────────────────────────────────────────

function authHeader(_user?: any): Record<string, string> {
  const token = getInstitutionToken() || '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function certBase(): string {
  return API_CONFIG.CERT.replace(/\/$/, '');
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InstitutionStudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // filters
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterCohort, setFilterCohort] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // dialog state
  const [enrollOpen, setEnrollOpen] = useState(false);

  // Selected students for bulk actions
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'enroll' | 'issue' | 'status' | null>(null);
  const [bulkStatusValue, setBulkStatusValue] = useState('');
  const [enrollForm, setEnrollForm] = useState<EnrollFormData>(EMPTY_ENROLL);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignStudent, setAssignStudent] = useState<Student | null>(null);
  const [assignForm, setAssignForm] = useState<AssignEnrollmentData>(EMPTY_ASSIGN);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [gradOpen, setGradOpen] = useState(false);
  const [gradForm, setGradForm] = useState<GraduationRecord>(EMPTY_GRAD);

  // ── Data fetches ────────────────────────────────────────────────────────────

  const { data: programsData } = useQuery({
    queryKey: ['institution-programs'],
    queryFn: async () => {
      const resp = await fetch(`${certBase()}/api/institutions/programs`, {
        headers: authHeader(user),
      });
      if (!resp.ok) return [] as Program[];
      return resp.json() as Promise<Program[]>;
    },
    staleTime: 60_000,
  });
  const programs: Program[] = Array.isArray(programsData) ? programsData : [];

  const { data: cohortsData } = useQuery({
    queryKey: ['institution-cohorts', filterProgram],
    queryFn: async () => {
      const qs = filterProgram && filterProgram !== 'all' ? `?programId=${filterProgram}` : '';
      const resp = await fetch(`${certBase()}/api/institutions/cohorts${qs}`, {
        headers: authHeader(user),
      });
      if (!resp.ok) return [] as Cohort[];
      return resp.json() as Promise<Cohort[]>;
    },
    staleTime: 60_000,
  });
  const cohorts: Cohort[] = Array.isArray(cohortsData) ? cohortsData : [];

  // Enrolled students list (from enrollment API) — includes program/cohort info
  const { data: enrolledData, isLoading: enrolledLoading } = useQuery({
    queryKey: ['institution-enrolled-students', filterProgram, filterCohort, filterStatus, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (filterProgram !== 'all') params.set('programId', filterProgram);
      if (filterCohort !== 'all') params.set('cohortId', filterCohort);
      if (filterStatus === 'eligible') params.set('eligible', 'true');
      if (filterStatus === 'enrolled') params.set('status', 'active');
      if (filterStatus !== 'not_enrolled') {
        const qs = params.toString();
        const resp = await fetch(`${certBase()}/api/institutions/enrollments${qs ? '?' + qs : ''}`, {
          headers: authHeader(user),
        });
        if (!resp.ok) return { students: [], total: 0 };
        const data = await resp.json();
        // Handle both array and { students, total } responses
        if (Array.isArray(data)) {
          return { students: data, total: data.length };
        }
        return data as Promise<{ students: any[]; total: number }>;
      }
      return { students: [], total: 0 };
    },
    staleTime: 30_000,
  });

  const { data: allStudentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['institution-students', search, filterProgram, filterCohort, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (filterProgram !== 'all') params.set('programId', filterProgram);
      if (filterCohort !== 'all') params.set('cohortId', filterCohort);
      if (filterStatus === 'enrolled') params.set('status', 'active');
      else if (filterStatus !== 'all' && filterStatus !== 'not_enrolled' && filterStatus !== 'eligible') {
        params.set('status', filterStatus);
      }
      const qs = params.toString();
      const url = `/api/institutions/students${qs ? '?' + qs : ''}`;
      const resp = await fetch(`${certBase()}${url}`, {
        headers: authHeader(user),
      });
      if (!resp.ok) throw new Error(`Failed: ${resp.status}`);
      return resp.json() as Promise<{ students: Student[]; total: number }>;
    },
    staleTime: 30_000,
  });

  const isLoading = studentsLoading || enrolledLoading;

  // Build combined student list
  const allStudents: Student[] = allStudentsData?.students ?? [];
  const enrolledStudents: any[] = enrolledData?.students ?? [];

  // Map enrollmentId → enrollment data for quick lookup
  const enrollmentMap = new Map<string, any>();
  for (const e of enrolledStudents) {
    if (e.studentId) enrollmentMap.set(e.studentId, e);
    else if (e.id) enrollmentMap.set(e.id, e);
  }

  const programMap = new Map(programs.map((p) => [p.id, p]));
  const cohortMap = new Map(cohorts.map((c) => [c.id, c]));

  // When not_enrolled filter: show students without enrollment
  let displayStudents: StudentWithEnrollment[] = allStudents.map((s) => {
    const enroll = enrollmentMap.get(s.id);
    const programName = enroll?.programId ? programMap.get(enroll.programId)?.name ?? null : null;
    const cohortName = enroll?.cohortId ? cohortMap.get(enroll.cohortId)?.name ?? null : null;
    return { ...s, enrollment: enroll ?? null, programName, cohortName };
  });

  if (filterStatus === 'not_enrolled') {
    displayStudents = displayStudents.filter((s) => !s.enrollment);
  } else if (filterStatus !== 'all') {
    // Only show enrolled ones
    displayStudents = displayStudents.filter((s) => s.enrollment);
  }

  if (filterProgram !== 'all') {
    displayStudents = displayStudents.filter((s) => s.enrollment?.programId === filterProgram);
  }
  if (filterCohort !== 'all') {
    displayStudents = displayStudents.filter((s) => s.enrollment?.cohortId === filterCohort);
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  const enrollMutation = useMutation({
    mutationFn: async (form: EnrollFormData) => {
      const resp = await fetch(`${certBase()}/api/institutions/students/enroll`, {
        method: 'POST',
        headers: authHeader(user),
        body: JSON.stringify(form),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).message ?? `Enroll failed: ${resp.status}`);
      }
      return resp.json();
    },
    onSuccess: (student: any) => {
      toast({ title: `${student.firstName} ${student.lastName} enrolled`, description: `EduCreds ID: ${student.eduCredsId}` });
      queryClient.invalidateQueries({ queryKey: ['institution-students'] });
      queryClient.invalidateQueries({ queryKey: ['institution-enrolled-students'] });
      setEnrollOpen(false);
      setEnrollForm(EMPTY_ENROLL);
    },
    onError: (e: any) => toast({ title: 'Enrollment failed', description: e.message, variant: 'destructive' }),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ studentId, data }: { studentId: string; data: AssignEnrollmentData }) => {
      const resp = await fetch(`${certBase()}/api/institutions/students/${studentId}/enroll`, {
        method: 'POST',
        headers: authHeader(user),
        body: JSON.stringify({
          programId: data.programId || undefined,
          cohortId: data.cohortId || undefined,
          academicYear: data.academicYear || undefined,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).message ?? `Failed: ${resp.status}`);
      }
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: 'Student enrolled in program/cohort' });
      queryClient.invalidateQueries({ queryKey: ['institution-enrolled-students'] });
      queryClient.invalidateQueries({ queryKey: ['institution-students'] });
      setAssignOpen(false);
      setAssignForm(EMPTY_ASSIGN);
      setAssignStudent(null);
    },
    onError: (e: any) => toast({ title: 'Enrollment failed', description: e.message, variant: 'destructive' }),
  });

  const eligibleMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const resp = await fetch(`${certBase()}/api/institutions/enrollments/${enrollmentId}/eligible`, {
        method: 'PATCH',
        headers: authHeader(user),
        body: JSON.stringify({}),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).message ?? `Failed: ${resp.status}`);
      }
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: 'Student marked eligible for credential issuance' });
      queryClient.invalidateQueries({ queryKey: ['institution-enrolled-students'] });
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  const gradMutation = useMutation({
    mutationFn: async ({ student, record }: { student: Student; record: GraduationRecord }) => {
      const resp = await fetch(`${certBase()}/api/v1/issue/certificate`, {
        method: 'POST',
        headers: authHeader(user),
        body: JSON.stringify({
          recipientName: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim(),
          recipientEmail: student.email ?? '',
          recipientWallet: '',
          courseName: record.courseName,
          customData: {
            grade: record.grade,
            completionDate: record.completionDate,
            certificateType: record.credentialType,
          },
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).message ?? `Save failed: ${resp.status}`);
      }
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: 'Graduation record saved', description: 'You can now issue the credential.' });
      setGradOpen(false);
      setGradForm(EMPTY_GRAD);
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const openAssignDialog = (student: Student) => {
    setAssignStudent(student);
    setAssignForm(EMPTY_ASSIGN);
    setAssignOpen(true);
  };

  const openGradDialog = (student: Student) => {
    setSelectedStudent(student);
    setGradForm({ ...EMPTY_GRAD, courseName: '' });
    setGradOpen(true);
  };

  const issueFromStudent = (student: Student) => {
    navigate(`/institution/issue?studentId=${student.id}`);
  };

  const fieldChange = (key: keyof EnrollFormData, val: string) =>
    setEnrollForm((p) => ({ ...p, [key]: val }));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="size-6" /> Students
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage students, programs, cohorts, and credential issuance
          </p>
        </div>
        <Button onClick={() => setEnrollOpen(true)} className="gap-2">
          <UserPlus className="size-4" /> Enroll New Student
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by name, email, or student number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Program filter */}
          <Select value={filterProgram} onValueChange={(v) => { setFilterProgram(v); setFilterCohort('all'); }}>
            <SelectTrigger className="w-44 text-xs">
              <Filter className="size-3 mr-1" />
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Cohort filter */}
          <Select value={filterCohort} onValueChange={setFilterCohort}>
            <SelectTrigger className="w-40 text-xs">
              <SelectValue placeholder="Cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {cohorts.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedStudents.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => { setBulkActionType('enroll'); setBulkActionOpen(true); }}
            >
              <UserPlus className="size-3" /> Enroll
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => { setBulkActionType('issue'); setBulkActionOpen(true); }}
            >
              <Award className="size-3" /> Issue Credentials
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => { setBulkActionType('status'); setBulkActionOpen(true); }}
            >
              <Filter className="size-3" /> Update Status
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-gray-500"
            onClick={() => setSelectedStudents(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Student Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4" /> Student List
            {!isLoading && (
              <span className="ml-1 text-sm font-normal text-gray-500">
                ({displayStudents.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : displayStudents.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <GraduationCap className="size-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No students found. Try adjusting filters or enroll your first student.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedStudents.size > 0 && selectedStudents.size === displayStudents.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(new Set(displayStudents.map(s => s.id)));
                          } else {
                            setSelectedStudents(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">EduCreds ID</th>
                    <th className="px-4 py-3 text-left">Program</th>
                    <th className="px-4 py-3 text-left">Cohort</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayStudents.map((student) => {
                    const isEnrolled = !!student.enrollment;
                    const enrollStatus = student.enrollment?.status;
                    const canMarkEligible = isEnrolled && (enrollStatus === 'active' || enrollStatus === 'completed');
                    const statusInfo = enrollStatus ? ENROLLMENT_STATUS_BADGE[enrollStatus] : null;
                    const isSelected = selectedStudents.has(student.id);

                    return (
                      <tr key={student.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSelected = new Set(selectedStudents);
                              if (e.target.checked) {
                                newSelected.add(student.id);
                              } else {
                                newSelected.delete(student.id);
                              }
                              setSelectedStudents(newSelected);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {[student.firstName, student.lastName].filter(Boolean).join(' ') || '—'}
                          </div>
                          <div className="text-xs text-gray-500">{student.email ?? student.studentNumber ?? ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          {student.eduCredsId ? (
                            <Badge variant="secondary" className="font-mono text-xs">{student.eduCredsId}</Badge>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {student.programName ?? <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {student.cohortName ?? <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {statusInfo ? (
                            <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-400">Not Enrolled</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {!isEnrolled && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1 h-7 px-2"
                                onClick={() => openAssignDialog(student)}
                              >
                                <UserPlus className="size-3" /> Enroll
                              </Button>
                            )}
                            {canMarkEligible && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1 h-7 px-2 border-green-300 text-green-700 hover:bg-green-50"
                                disabled={eligibleMutation.isPending}
                                onClick={() => eligibleMutation.mutate(student.enrollment!.id)}
                              >
                                <Check className="size-3" /> Eligible
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1 h-7 px-2"
                              onClick={() => openGradDialog(student)}
                            >
                              <FileText className="size-3" /> Record
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs gap-1 h-7 px-2"
                              onClick={() => issueFromStudent(student)}
                            >
                              <Award className="size-3" /> Issue
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Enroll in Program/Cohort Dialog ─────────────────────────────────── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5" /> Enroll in Program
              {assignStudent && (
                <span className="text-sm font-normal text-gray-500">
                  — {[assignStudent.firstName, assignStudent.lastName].filter(Boolean).join(' ')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium">Program</Label>
              <Select
                value={assignForm.programId}
                onValueChange={(v) => setAssignForm((p) => ({ ...p, programId: v, cohortId: '' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select program…" />
                </SelectTrigger>
                <SelectContent>
                  {programs.length === 0 && (
                    <SelectItem value="_none" disabled>No programs created yet</SelectItem>
                  )}
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{p.code ? ` (${p.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Cohort</Label>
              <Select
                value={assignForm.cohortId}
                onValueChange={(v) => setAssignForm((p) => ({ ...p, cohortId: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select cohort…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No cohort</SelectItem>
                  {cohorts
                    .filter((c) => !assignForm.programId || c.programId === assignForm.programId || !c.programId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.academicYear ? ` · ${c.academicYear}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Academic Year (optional)</Label>
              <Input
                className="mt-1"
                placeholder="e.g. 2025/2026"
                value={assignForm.academicYear}
                onChange={(e) => setAssignForm((p) => ({ ...p, academicYear: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              disabled={assignMutation.isPending || !assignStudent}
              onClick={() => assignStudent && assignMutation.mutate({ studentId: assignStudent.id, data: assignForm })}
              className="gap-2"
            >
              {assignMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Confirm Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Enroll New Student Dialog ───────────────────────────────────────── */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5" /> Enroll New Student
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">First Name *</Label>
                <Input
                  className="mt-1" placeholder="John"
                  value={enrollForm.firstName}
                  onChange={(e) => fieldChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Last Name *</Label>
                <Input
                  className="mt-1" placeholder="Doe"
                  value={enrollForm.lastName}
                  onChange={(e) => fieldChange('lastName', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Email *</Label>
              <Input
                className="mt-1" type="email" placeholder="student@university.edu"
                value={enrollForm.email}
                onChange={(e) => fieldChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Student Number</Label>
              <Input
                className="mt-1" placeholder="e.g. 2024001"
                value={enrollForm.studentNumber}
                onChange={(e) => fieldChange('studentNumber', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Course Code</Label>
                <Input
                  className="mt-1" placeholder="CS101"
                  value={enrollForm.courseCode}
                  onChange={(e) => fieldChange('courseCode', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Course Name</Label>
                <Input
                  className="mt-1" placeholder="Introduction to CS"
                  value={enrollForm.courseName}
                  onChange={(e) => fieldChange('courseName', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Program Level</Label>
              <Select value={enrollForm.programLevel} onValueChange={(v) => fieldChange('programLevel', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select level…" /></SelectTrigger>
                <SelectContent>
                  {PROGRAM_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEnrollOpen(false)}>Cancel</Button>
            <Button
              disabled={enrollMutation.isPending || !enrollForm.firstName || !enrollForm.lastName || !enrollForm.email}
              onClick={() => enrollMutation.mutate(enrollForm)}
              className="gap-2"
            >
              {enrollMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Enroll Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Graduation Record Dialog ─────────────────────────────────────────── */}
      <Dialog open={gradOpen} onOpenChange={setGradOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="size-5" /> Graduation Record
              {selectedStudent && (
                <span className="text-sm font-normal text-gray-500">
                  — {[selectedStudent.firstName, selectedStudent.lastName].filter(Boolean).join(' ')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium">Course / Programme</Label>
              <Input
                className="mt-1" placeholder="Bachelor of Computer Science"
                value={gradForm.courseName}
                onChange={(e) => setGradForm((p) => ({ ...p, courseName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Completion Date</Label>
                <Input
                  className="mt-1" type="date"
                  value={gradForm.completionDate}
                  onChange={(e) => setGradForm((p) => ({ ...p, completionDate: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Grade / Class</Label>
                <Input
                  className="mt-1" placeholder="First Class"
                  value={gradForm.grade}
                  onChange={(e) => setGradForm((p) => ({ ...p, grade: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Credential Type</Label>
              <Select value={gradForm.credentialType} onValueChange={(v) => setGradForm((p) => ({ ...p, credentialType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select credential type…" /></SelectTrigger>
                <SelectContent>
                  {CREDENTIAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setGradOpen(false)}>Cancel</Button>
            <Button
              variant="outline"
              disabled={gradMutation.isPending || !gradForm.courseName}
              onClick={() => selectedStudent && gradMutation.mutate({ student: selectedStudent, record: gradForm })}
              className="gap-2"
            >
              {gradMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              Save Record
            </Button>
            <Button
              disabled={!gradForm.courseName || !selectedStudent}
              onClick={() => { if (selectedStudent) issueFromStudent(selectedStudent); }}
              className="gap-2"
            >
              <Award className="size-4" /> Issue Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Actions Dialog ──────────────────────────────────────────────── */}
      <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bulkActionType === 'enroll' && <><UserPlus className="size-5" /> Bulk Enroll</>}
              {bulkActionType === 'issue' && <><Award className="size-5" /> Bulk Issue Credentials</>}
              {bulkActionType === 'status' && <><Filter className="size-5" /> Bulk Update Status</>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Selected {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''}:
            </p>
            <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2 text-xs text-gray-600">
              {displayStudents
                .filter(s => selectedStudents.has(s.id))
                .map(s => (
                  <div key={s.id} className="py-0.5">
                    {[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'} ({s.email || s.studentNumber || s.id.slice(0, 8)})
                  </div>
                ))}
            </div>

            {bulkActionType === 'enroll' && (
              <>
                <div>
                  <Label className="text-xs font-medium">Program</Label>
                  <Select
                    value={assignForm.programId}
                    onValueChange={(v) => setAssignForm((p) => ({ ...p, programId: v, cohortId: '' }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select program…" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.length === 0 && (
                        <SelectItem value="_none" disabled>No programs created yet</SelectItem>
                      )}
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}{p.code ? ` (${p.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Cohort</Label>
                  <Select
                    value={assignForm.cohortId}
                    onValueChange={(v) => setAssignForm((p) => ({ ...p, cohortId: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select cohort…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No cohort</SelectItem>
                      {cohorts
                        .filter((c) => !assignForm.programId || c.programId === assignForm.programId || !c.programId)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}{c.academicYear ? ` · ${c.academicYear}` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {bulkActionType === 'issue' && (
              <div className="text-sm text-gray-600">
                <p>This will redirect you to the credential issuance page with the selected students pre-filled.</p>
              </div>
            )}

            {bulkActionType === 'status' && (
              <div>
                <Label className="text-xs font-medium">New Status</Label>
                <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="eligible">Eligible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setBulkActionOpen(false); setBulkActionType(null); }}>
              Cancel
            </Button>
            {bulkActionType === 'enroll' && (
              <Button
                disabled={!assignForm.programId || assignMutation.isPending}
                onClick={() => {
                  const selectedStudentList = displayStudents.filter(s => selectedStudents.has(s.id));
                  let completed = 0;
                  selectedStudentList.forEach(student => {
                    assignMutation.mutate(
                      { studentId: student.id, data: assignForm },
                      {
                        onSuccess: () => {
                          completed++;
                          if (completed === selectedStudentList.length) {
                            setBulkActionOpen(false);
                            setSelectedStudents(new Set());
                          }
                        }
                      }
                    );
                  });
                }}
              >
                {assignMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Enroll {selectedStudents.size} Student{selectedStudents.size > 1 ? 's' : ''}
              </Button>
            )}
            {bulkActionType === 'issue' && (
              <Button
                onClick={() => {
                  if (selectedStudents.size === 1) {
                    // Single student → go to detailed issuance form
                    const studentId = Array.from(selectedStudents)[0];
                    navigate(`/institution/issue?studentId=${studentId}`);
                  } else {
                    // Multiple students → go to batch operations page
                    navigate(`/institution/bulk-issue`);
                  }
                  setBulkActionOpen(false);
                }}
              >
                {selectedStudents.size === 1 ? 'Issue Credential' : `Batch Issue (${selectedStudents.size} students)`}
              </Button>
            )}
            {bulkActionType === 'status' && (
              <Button
                disabled={!bulkStatusValue}
                onClick={() => {
                  // Update status for all selected students
                  const selectedStudentList = displayStudents.filter(s => selectedStudents.has(s.id));
                  let completed = 0;
                  selectedStudentList.forEach(student => {
                    if (student.enrollment?.id) {
                      // Use the eligible endpoint for 'eligible' status, otherwise use status update
                      if (bulkStatusValue === 'eligible') {
                        eligibleMutation.mutate(student.enrollment.id, {
                          onSuccess: () => {
                            completed++;
                            if (completed === selectedStudentList.length) {
                              setBulkActionOpen(false);
                              setSelectedStudents(new Set());
                              setBulkStatusValue('');
                            }
                          }
                        });
                      } else {
                        // For other statuses, we'd need a status update mutation
                        toast({ title: 'Status update', description: 'Status update endpoint not implemented for this status' });
                      }
                    }
                  });
                }}
              >
                Update {selectedStudents.size} Student{selectedStudents.size > 1 ? 's' : ''}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
