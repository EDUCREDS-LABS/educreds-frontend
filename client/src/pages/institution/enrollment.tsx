/**
 * Institution Enrollment Page — workspace tier only
 * View all enrollments, filter by program/cohort/status, mark eligible, manage status.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Filter, CheckCircle2, Loader2, Award, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/api";
import { getInstitutionToken } from "@/lib/authStorage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Program { id: string; name: string; }
interface Cohort  { id: string; name: string; programId: string | null; }

interface EnrollmentRecord {
  id: string;
  studentId: string;
  programId: string | null;
  cohortId: string | null;
  academicYear: string | null;
  status: string;
  isEligible: boolean;
  enrolledAt: string;
  completionDate: string | null;
  // joined fields
  student?: { id: string; firstName: string | null; lastName: string | null; email: string | null; eduCredsId: string | null; };
  program?: { name: string } | null;
  cohort?: { name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function certBase() { return API_CONFIG.CERT.replace(/\/$/, ''); }
function authH(): Record<string, string> {
  return { Authorization: `Bearer ${getInstitutionToken() ?? ''}`, 'Content-Type': 'application/json' };
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Enrolled',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  eligible:  { label: 'Eligible',  cls: 'bg-green-50 text-green-700 border-green-200' },
  completed: { label: 'Completed', cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  graduated: { label: 'Graduated', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  withdrawn: { label: 'Withdrawn', cls: 'bg-red-50 text-red-700 border-red-200' },
  suspended: { label: 'Suspended', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Enrolled (Active)' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'completed', label: 'Completed' },
  { value: 'graduated', label: 'Graduated' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EnrollmentPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [filterProgram, setFilterProgram] = useState('all');
  const [filterCohort, setFilterCohort] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['institution-programs'],
    queryFn: async () => {
      const r = await fetch(`${certBase()}/api/institutions/programs`, { headers: authH() });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ['institution-cohorts', filterProgram],
    queryFn: async () => {
      const qs = filterProgram !== 'all' ? `?programId=${filterProgram}` : '';
      const r = await fetch(`${certBase()}/api/institutions/cohorts${qs}`, { headers: authH() });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: enrollments = [], isLoading } = useQuery<EnrollmentRecord[]>({
    queryKey: ['institution-enrollments', filterProgram, filterCohort, filterStatus],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filterProgram !== 'all') p.set('programId', filterProgram);
      if (filterCohort !== 'all') p.set('cohortId', filterCohort);
      if (filterStatus !== 'all') {
        if (filterStatus === 'eligible') p.set('eligible', 'true');
        else p.set('status', filterStatus);
      }
      const qs = p.toString();
      const r = await fetch(`${certBase()}/api/institutions/enrollments${qs ? '?' + qs : ''}`, { headers: authH() });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : (data?.enrollments ?? []);
    },
    staleTime: 30_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const eligibleMut = useMutation({
    mutationFn: async ({ enrollmentId, eligible }: { enrollmentId: string; eligible: boolean }) => {
      const r = await fetch(`${certBase()}/api/institutions/enrollments/${enrollmentId}/eligible`, {
        method: 'PATCH', headers: authH(), body: JSON.stringify({ eligible }),
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Eligibility updated' });
      qc.invalidateQueries({ queryKey: ['institution-enrollments'] });
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  const statusMut = useMutation({
    mutationFn: async ({ enrollmentId, status }: { enrollmentId: string; status: string }) => {
      const r = await fetch(`${certBase()}/api/institutions/enrollments/${enrollmentId}/status`, {
        method: 'PATCH', headers: authH(), body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Status updated' });
      qc.invalidateQueries({ queryKey: ['institution-enrollments'] });
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-blue-600" />
          <h1 className="text-xl font-semibold">Enrollment</h1>
          <Badge variant="secondary">{enrollments.length}</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-neutral-400" />
          {programs.length > 0 && (
            <Select value={filterProgram} onValueChange={v => { setFilterProgram(v); setFilterCohort('all'); }}>
              <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All Programs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {cohorts.length > 0 && (
            <Select value={filterCohort} onValueChange={setFilterCohort}>
              <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All Cohorts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                {cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <GraduationCap className="size-10 mb-3 opacity-30" />
            <p className="font-medium">No enrollments found</p>
            <p className="text-sm mt-1">Create your first enrollment using the button above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden md:table-cell">Program</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden lg:table-cell">Cohort</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments.map(e => {
                const sb = STATUS_BADGE[e.status] ?? { label: e.status, cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
                const studentName = e.student
                  ? `${e.student.firstName ?? ''} ${e.student.lastName ?? ''}`.trim() || e.student.email || e.studentId
                  : e.studentId;
                return (
                  <tr key={e.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium truncate max-w-[160px]">{studentName}</div>
                      {e.student?.eduCredsId && (
                        <div className="text-xs text-neutral-400 font-mono">{e.student.eduCredsId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-neutral-600 truncate max-w-[140px]">
                      {e.program?.name ?? (e.programId ? '…' : '—')}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-neutral-600">
                      {e.cohort?.name ?? (e.cohortId ? '…' : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${sb.cls}`}>
                        {sb.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Mark eligible toggle */}
                        {(e.status === 'active' || e.status === 'completed') && !e.isEligible && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => eligibleMut.mutate({ enrollmentId: e.id, eligible: true })}
                            disabled={eligibleMut.isPending}>
                            {eligibleMut.isPending ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3 mr-1" />}
                            Mark Eligible
                          </Button>
                        )}
                        {e.isEligible && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => navigate(`/institution/issue?studentId=${e.studentId}`)}>
                            <Award className="size-3 mr-1" /> Issue
                          </Button>
                        )}
                        {/* Status transition */}
                        {e.status === 'active' && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-neutral-500"
                            onClick={() => statusMut.mutate({ enrollmentId: e.id, status: 'completed' })}
                            disabled={statusMut.isPending}>
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New Enrollment Dialog ────────────────────────────────────────────── */}
      <Dialog open={newEnrollmentOpen} onOpenChange={setNewEnrollmentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5" /> New Enrollment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Student Selection */}
            <div>
              <Label className="text-xs font-medium">Student *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <div className="mt-2 max-h-32 overflow-y-auto border rounded-md">
                {students.length === 0 ? (
                  <div className="p-3 text-sm text-gray-400 text-center">
                    {studentSearch ? 'No students found' : 'Type to search students...'}
                  </div>
                ) : (
                  students.map((s) => (
                    <button
                      key={s.id}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        newEnrollmentForm.studentId === s.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                      onClick={() => setNewEnrollmentForm(p => ({ ...p, studentId: s.id }))}
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {s.email || s.studentNumber || s.id.slice(0, 8)}
                        </div>
                      </div>
                      {newEnrollmentForm.studentId === s.id && <CheckCircle2 className="size-4 text-blue-500" />}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Program Selection */}
            <div>
              <Label className="text-xs font-medium">Program *</Label>
              <Select
                value={newEnrollmentForm.programId}
                onValueChange={(v) => setNewEnrollmentForm(p => ({ ...p, programId: v, cohortId: '' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.length === 0 && (
                    <SelectItem value="_none" disabled>No programs created yet</SelectItem>
                  )}
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cohort Selection (filtered by program) */}
            <div>
              <Label className="text-xs font-medium">Cohort</Label>
              <Select
                value={newEnrollmentForm.cohortId}
                onValueChange={(v) => setNewEnrollmentForm(p => ({ ...p, cohortId: v }))}
                disabled={!newEnrollmentForm.programId || availableCohorts.length === 0}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={
                    !newEnrollmentForm.programId
                      ? 'Select a program first'
                      : availableCohorts.length === 0
                        ? 'No cohorts for this program'
                        : 'Select cohort...'
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No cohort</SelectItem>
                  {availableCohorts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.academicYear ? ` · ${c.academicYear}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year */}
            <div>
              <Label className="text-xs font-medium">Academic Year (optional)</Label>
              <Input
                className="mt-1"
                placeholder="e.g. 2025/2026"
                value={newEnrollmentForm.academicYear}
                onChange={(e) => setNewEnrollmentForm(p => ({ ...p, academicYear: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setNewEnrollmentOpen(false);
              setNewEnrollmentForm({ studentId: '', programId: '', cohortId: '', academicYear: '' });
              setStudentSearch('');
            }}>
              Cancel
            </Button>
            <Button
              disabled={!newEnrollmentForm.studentId || !newEnrollmentForm.programId || createEnrollmentMut.isPending}
              onClick={() => createEnrollmentMut.mutate(newEnrollmentForm)}
            >
              {createEnrollmentMut.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Create Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
