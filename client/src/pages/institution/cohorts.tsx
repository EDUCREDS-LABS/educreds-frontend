/**
 * Institution Cohorts Page — workspace tier only
 * CRUD for academic cohorts, linked to programs.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";
import { getInstitutionToken } from "@/lib/authStorage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Program {
  id: string;
  name: string;
  code: string | null;
}

interface Cohort {
  id: string;
  name: string;
  programId: string | null;
  academicYear: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  maxStudents: number | null;
  isActive: boolean;
  createdAt: string;
}

interface CohortForm {
  name: string;
  programId: string;
  academicYear: string;
  description: string;
  startDate: string;
  endDate: string;
  maxStudents: string;
}

const EMPTY_FORM: CohortForm = {
  name: '', programId: '', academicYear: '', description: '',
  startDate: '', endDate: '', maxStudents: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function certBase() { return API_CONFIG.CERT.replace(/\/$/, ''); }
function authH(): Record<string, string> {
  return { Authorization: `Bearer ${getInstitutionToken() ?? ''}`, 'Content-Type': 'application/json' };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CohortsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cohort | null>(null);
  const [form, setForm] = useState<CohortForm>(EMPTY_FORM);
  const [filterProgram, setFilterProgram] = useState('all');

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

  const { data: cohorts = [], isLoading } = useQuery<Cohort[]>({
    queryKey: ['institution-cohorts', filterProgram],
    queryFn: async () => {
      const qs = filterProgram !== 'all' ? `?programId=${filterProgram}` : '';
      const r = await fetch(`${certBase()}/api/institutions/cohorts${qs}`, { headers: authH() });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 30_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  function buildPayload(data: CohortForm) {
    return {
      name: data.name,
      programId: data.programId || undefined,
      academicYear: data.academicYear || undefined,
      description: data.description || undefined,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      maxStudents: data.maxStudents ? Number(data.maxStudents) : undefined,
    };
  }

  const createMut = useMutation({
    mutationFn: async (data: CohortForm) => {
      const r = await fetch(`${certBase()}/api/institutions/cohorts`, {
        method: 'POST', headers: authH(), body: JSON.stringify(buildPayload(data)),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).message ?? `Error ${r.status}`); }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Cohort created' });
      qc.invalidateQueries({ queryKey: ['institution-cohorts'] });
      closeDialog();
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CohortForm }) => {
      const r = await fetch(`${certBase()}/api/institutions/cohorts/${id}`, {
        method: 'PATCH', headers: authH(), body: JSON.stringify(buildPayload(data)),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).message ?? `Error ${r.status}`); }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Cohort updated' });
      qc.invalidateQueries({ queryKey: ['institution-cohorts'] });
      closeDialog();
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${certBase()}/api/institutions/cohorts/${id}`, {
        method: 'DELETE', headers: authH(),
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
    },
    onSuccess: () => {
      toast({ title: 'Cohort deleted' });
      qc.invalidateQueries({ queryKey: ['institution-cohorts'] });
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setOpen(true); }
  function openEdit(c: Cohort) {
    setEditing(c);
    setForm({
      name: c.name, programId: c.programId ?? '', academicYear: c.academicYear ?? '',
      description: c.description ?? '', startDate: c.startDate ?? '', endDate: c.endDate ?? '',
      maxStudents: c.maxStudents?.toString() ?? '',
    });
    setOpen(true);
  }
  function closeDialog() { setOpen(false); setEditing(null); setForm(EMPTY_FORM); }
  function setField(k: keyof CohortForm, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function submit() {
    if (!form.name.trim()) { toast({ title: 'Cohort name is required', variant: 'destructive' }); return; }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  }

  const busy = createMut.isPending || updateMut.isPending;

  const programMap = Object.fromEntries(programs.map(p => [p.id, p.name]));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-blue-600" />
          <h1 className="text-xl font-semibold">Cohorts</h1>
          <Badge variant="secondary">{cohorts.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {programs.length > 0 && (
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1" /> Add Cohort
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : cohorts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <Users className="size-10 mb-3 opacity-30" />
            <p className="font-medium">No cohorts yet</p>
            <p className="text-sm mt-1">Cohorts group students by intake or academic year.</p>
            <Button size="sm" className="mt-4" onClick={openCreate}><Plus className="size-4 mr-1" /> Add Cohort</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cohorts.map(c => (
            <Card key={c.id} className="relative group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold truncate">{c.name}</CardTitle>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.academicYear && <Badge variant="outline" className="text-xs">{c.academicYear}</Badge>}
                  {c.programId && programMap[c.programId] && (
                    <Badge variant="secondary" className="text-xs truncate max-w-[120px]">{programMap[c.programId]}</Badge>
                  )}
                  {c.maxStudents && <Badge variant="outline" className="text-xs">Max {c.maxStudents}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {c.description && <p className="text-xs text-neutral-500 line-clamp-2">{c.description}</p>}
                {(c.startDate || c.endDate) && (
                  <p className="text-xs text-neutral-400 mt-1">
                    {c.startDate ? c.startDate.slice(0, 10) : '?'} → {c.endDate ? c.endDate.slice(0, 10) : '?'}
                  </p>
                )}
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(c)}>
                    <Pencil className="size-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteMut.mutate(c.id); }}>
                    <Trash2 className="size-3 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Cohort' : 'New Cohort'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. 2024 January Intake" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Academic Year</Label>
                <Input placeholder="2024/2025" value={form.academicYear} onChange={e => setField('academicYear', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Max Students</Label>
                <Input type="number" min={1} placeholder="50" value={form.maxStudents} onChange={e => setField('maxStudents', e.target.value)} />
              </div>
            </div>
            {programs.length > 0 && (
              <div className="space-y-1">
                <Label>Program</Label>
                <Select value={form.programId} onValueChange={v => setField('programId', v)}>
                  <SelectTrigger><SelectValue placeholder="Assign to program (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input placeholder="Optional" value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog} disabled={busy}><X className="size-4 mr-1" /> Cancel</Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Check className="size-4 mr-1" />}
              {editing ? 'Save Changes' : 'Create Cohort'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
