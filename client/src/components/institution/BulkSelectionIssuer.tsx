import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
// Card wrapper removed — this component renders inside BulkCSVUploader's Card/TabsContent
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, Users, AlertTriangle, CheckCircle, Search, Zap } from 'lucide-react';

interface TemplateLite {
  id: string;
  name: string;
  category?: string;
}

interface BulkSelectionIssuerProps {
  templates: TemplateLite[];
}

type StudentRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  studentNumber?: string;
  status?: string;
  programId?: string | null;
  cohortId?: string | null;
};

function fullName(s: StudentRow) {
  return [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || 'Student';
}

export function BulkSelectionIssuer({ templates }: BulkSelectionIssuerProps) {
  const [programId, setProgramId] = useState<string>('');
  const [cohortId, setCohortId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [certificateType, setCertificateType] = useState<string>('Academic');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const programsQ = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      try {
        return await api.listPrograms();
      } catch (err: any) {
        // 403 = tier-restricted; return empty array so UI degrades gracefully
        if (err?.status === 403) return [];
        throw err;
      }
    },
    retry: false,
  });

  const cohortsQ = useQuery({
    queryKey: ['cohorts', programId],
    queryFn: async () => {
      try {
        return await api.listCohorts(programId || undefined);
      } catch (err: any) {
        if (err?.status === 403) return [];
        throw err;
      }
    },
    enabled: Boolean(programId),
    retry: false,
  });

  // Allow listing students even without program/cohort selected (search-only mode)
  const studentsQ = useQuery({
    queryKey: ['students', { programId, cohortId, status, search }],
    queryFn: async () => api.listStudentsForInstitution({
      programId: programId || undefined,
      cohortId: cohortId || undefined,
      status: status || undefined,
      search: search || undefined,
    }),
    // Enable when any filter is set OR when user types a search
    enabled: Boolean(programId || cohortId || search),
    retry: false,
  });

  const students: StudentRow[] = studentsQ.data?.students ?? [];

  const counts = useMemo(() => {
    const total = students.length;
    const selected = selectedIds.size;
    const withEmail = students.filter((s) => !!s.email).length;
    return { total, selected, withEmail };
  }, [students, selectedIds]);

  const allSelected = students.length > 0 && selectedIds.size === students.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(students.map((s) => s.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const issueMutation = useMutation({
    mutationFn: async () => {
      if (selectedIds.size === 0) throw new Error('Select at least one student');
      return api.bulkIssueSelection({
        studentIds: Array.from(selectedIds),
        courseName: courseName || undefined,
        certificateType: certificateType || undefined,
        completionDate: completionDate || undefined,
        templateId: templateId || undefined,
        options: { batchSize: 10, continueOnError: true },
      });
    },
  });

  const jobId = issueMutation.data?.jobId as string | undefined;

  const statusQ = useQuery({
    queryKey: ['bulk-status', jobId],
    queryFn: async () => api.getBulkIssuanceJobStatus(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const st = query.state.data?.status;
      if (!st) return 2000;
      return ['completed', 'failed'].includes(String(st).toLowerCase()) ? false : 2500;
    },
  });

  const job = statusQ.data;
  const totalRecords = job?.totalRecords ?? job?.totalItems ?? 0;
  const processedRecords = job?.processedRecords ?? job?.processedItems ?? 0;
  const progress = totalRecords > 0 ? Math.round((processedRecords / totalRecords) * 100) : 0;

  const showWorkspaceOnlyWarning = programsQ.isError && String((programsQ.error as any)?.status || '').includes('403');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
        <Users className="size-5" /> Issue by Cohort / Program
      </div>
      <p className="text-sm text-neutral-500 -mt-4">
        Select a cohort or program, pick students, then issue in one batch.
      </p>
        {showWorkspaceOnlyWarning && (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <AlertTriangle className="size-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Programs/Cohorts are workspace-tier only on the current backend. You can still use CSV issuance, or we can extend these endpoints to connector tiers.
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select source */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Program</p>
            <Select value={programId} onValueChange={(v) => { setProgramId(v); setCohortId(''); setSelectedIds(new Set()); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={programsQ.isLoading ? 'Loading…' : 'Select program'} />
              </SelectTrigger>
              <SelectContent>
                {(programsQ.data ?? []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
                {Array.isArray(programsQ.data) && programsQ.data.length === 0 && (
                  <SelectItem value="__none__" disabled>No programs found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Cohort</p>
            <Select value={cohortId} onValueChange={(v) => { setCohortId(v); setSelectedIds(new Set()); }} disabled={!programId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={!programId ? 'Select program first' : cohortsQ.isLoading ? 'Loading…' : 'Select cohort'} />
              </SelectTrigger>
              <SelectContent>
                {(cohortsQ.data ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
                {Array.isArray(cohortsQ.data) && cohortsQ.data.length === 0 && (
                  <SelectItem value="__none__" disabled>No cohorts found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Status filter</p>
            <Select value={status} onValueChange={(v) => { setStatus(v === '__all__' ? '' : v); }}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="eligible">Eligible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Step 2: Preview + select */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="size-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input className="pl-9 rounded-xl" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={toggleAll} disabled={students.length === 0}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full">Total: {counts.total}</Badge>
          <Badge variant="secondary" className="rounded-full">Selected: {counts.selected}</Badge>
          <Badge variant="secondary" className="rounded-full">With email: {counts.withEmail}</Badge>
        </div>

        <div className="border rounded-2xl overflow-hidden">
          <ScrollArea className="h-[320px]">
            <div className="divide-y">
              {studentsQ.isLoading && (
                <div className="p-6 text-sm text-neutral-500 flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Loading students…</div>
              )}
              {!studentsQ.isLoading && students.length === 0 && (
                <div className="p-6 text-sm text-neutral-500">No students found for the selected filters.</div>
              )}
              {students.map((s) => (
                <div key={s.id} className={cn('p-4 flex items-center justify-between gap-3', selectedIds.has(s.id) && 'bg-blue-50/50 dark:bg-blue-950/20')}>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                    <div>
                      <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{fullName(s)}</p>
                      <p className="text-xs text-neutral-500">{s.email || '—'}{s.studentNumber ? ` · ${s.studentNumber}` : ''}</p>
                    </div>
                  </div>
                  <Badge className="rounded-full" variant="secondary">{s.status || 'active'}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Step 3: Issue settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Course name</p>
            <Input className="rounded-xl" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. Bachelor of Computer Science" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Certificate type</p>
            <Select value={certificateType} onValueChange={setCertificateType}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Degree">Degree</SelectItem>
                <SelectItem value="Course Completion">Course Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Completion date</p>
            <Input className="rounded-xl" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} placeholder="YYYY-MM-DD (optional)" />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Template (optional)</p>
          <Select value={templateId} onValueChange={(v) => setTemplateId(v === '__none__' ? '' : v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="No template" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No template</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {issueMutation.isError && (
          <Alert className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="size-4 text-red-600" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {(issueMutation.error as any)?.message || 'Failed to start issuance'}
            </AlertDescription>
          </Alert>
        )}

        <Button
          className="rounded-xl font-black text-xs uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => issueMutation.mutate()}
          disabled={issueMutation.isPending || selectedIds.size === 0}
        >
          {issueMutation.isPending ? <><Loader2 className="size-4 animate-spin" /> Starting…</> : <><Zap className="size-4" /> Issue selected ({selectedIds.size})</>}
        </Button>

        {/* Job progress */}
        {jobId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-2"><Loader2 className={cn('size-3', !['completed','failed'].includes(String(job?.status || '').toLowerCase()) && 'animate-spin')} /> Job: {jobId.slice(0, 8)}…</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 rounded-full" />
            {String(job?.status || '').toLowerCase() === 'completed' && (
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle className="size-4" /> Issuance completed
              </div>
            )}
          </div>
        )}
    </div>
  );
}
