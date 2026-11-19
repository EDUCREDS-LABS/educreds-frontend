/**
 * Institution Programs Page — workspace tier only
 * CRUD for academic programs. Workspace tier guard enforced on API side.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, BookOpen, Loader2, X, Check } from "lucide-react";
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
  level: string | null;
  description: string | null;
  durationYears: number | null;
  isActive: boolean;
  createdAt: string;
}

interface ProgramForm {
  name: string;
  code: string;
  level: string;
  description: string;
  durationYears: string;
}

const EMPTY_FORM: ProgramForm = {
  name: '', code: '', level: '', description: '', durationYears: '',
};

// Backend ProgramLevel enum values: certificate | diploma | bachelors | masters | phd | professional
const PROGRAM_LEVELS: { value: string; label: string }[] = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: 'Bachelor' },
  { value: 'masters', label: 'Master' },
  { value: 'phd', label: 'Doctorate / PhD' },
  { value: 'professional', label: 'Professional' },
];

const PROGRAM_PRESETS = [
  { name: 'Bachelor of Science', level: 'bachelors' },
  { name: 'Bachelor of Arts', level: 'bachelors' },
  { name: 'Bachelor of Commerce', level: 'bachelors' },
  { name: 'Bachelor of Education', level: 'bachelors' },
  { name: 'Master of Science', level: 'masters' },
  { name: 'Master of Business Administration', level: 'masters' },
  { name: 'Master of Arts', level: 'masters' },
  { name: 'Doctor of Philosophy', level: 'phd' },
  { name: 'Diploma', level: 'diploma' },
  { name: 'Certificate', level: 'certificate' },
  { name: 'Professional Certificate', level: 'professional' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function certBase() { return API_CONFIG.CERT.replace(/\/$/, ''); }
function authH(): Record<string, string> {
  return { Authorization: `Bearer ${getInstitutionToken() ?? ''}`, 'Content-Type': 'application/json' };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProgramsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [form, setForm] = useState<ProgramForm>(EMPTY_FORM);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ['institution-programs'],
    queryFn: async () => {
      const r = await fetch(`${certBase()}/api/institutions/programs`, { headers: authH() });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 30_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: async (data: ProgramForm) => {
      const r = await fetch(`${certBase()}/api/institutions/programs`, {
        method: 'POST', headers: authH(),
        body: JSON.stringify({
          name: data.name,
          code: data.code || undefined,
          level: data.level || undefined,
          description: data.description || undefined,
          durationYears: data.durationYears ? Number(data.durationYears) : undefined,
        }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).message ?? `Error ${r.status}`); }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Program created' });
      qc.invalidateQueries({ queryKey: ['institution-programs'] });
      closeDialog();
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  // Check for duplicate program name
  const isDuplicateProgram = (name: string, excludeId?: string): boolean => {
    const normalizedName = name.trim().toLowerCase();
    return programs.some(p => 
      p.name.trim().toLowerCase() === normalizedName && p.id !== excludeId
    );
  };

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProgramForm }) => {
      const r = await fetch(`${certBase()}/api/institutions/programs/${id}`, {
        method: 'PATCH', headers: authH(),
        body: JSON.stringify({
          name: data.name,
          code: data.code || undefined,
          level: data.level || undefined,
          description: data.description || undefined,
          durationYears: data.durationYears ? Number(data.durationYears) : undefined,
        }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).message ?? `Error ${r.status}`); }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Program updated' });
      qc.invalidateQueries({ queryKey: ['institution-programs'] });
      closeDialog();
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${certBase()}/api/institutions/programs/${id}`, {
        method: 'DELETE', headers: authH(),
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
    },
    onSuccess: () => {
      toast({ title: 'Program deleted' });
      qc.invalidateQueries({ queryKey: ['institution-programs'] });
    },
    onError: (e: any) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setOpen(true); }
  function openEdit(p: Program) {
    setEditing(p);
    setForm({ name: p.name, code: p.code ?? '', level: p.level ?? '', description: p.description ?? '', durationYears: p.durationYears?.toString() ?? '' });
    setOpen(true);
  }
  function closeDialog() { setOpen(false); setEditing(null); setForm(EMPTY_FORM); }
  function setField(k: keyof ProgramForm, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function submit() {
    if (!form.name.trim()) { toast({ title: 'Program name is required', variant: 'destructive' }); return; }
    if (isDuplicateProgram(form.name, editing?.id)) {
      toast({ title: 'Duplicate program', description: 'A program with this name already exists.', variant: 'destructive' });
      return;
    }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  }

  const busy = createMut.isPending || updateMut.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-blue-600" />
          <h1 className="text-xl font-semibold">Programs</h1>
          <Badge variant="secondary">{programs.length}</Badge>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4 mr-1" /> Add Program
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <BookOpen className="size-10 mb-3 opacity-30" />
            <p className="font-medium">No programs yet</p>
            <p className="text-sm mt-1">Add your first academic program to get started.</p>
            <Button size="sm" className="mt-4" onClick={openCreate}><Plus className="size-4 mr-1" /> Add Program</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map(p => (
            <Card key={p.id} className="relative group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold truncate">{p.name}</CardTitle>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.level && <Badge variant="outline" className="text-xs">{PROGRAM_LEVELS.find(l => l.value === p.level)?.label ?? p.level}</Badge>}
                  {p.code && <Badge variant="secondary" className="text-xs font-mono">{p.code}</Badge>}
                  {p.durationYears && <Badge variant="outline" className="text-xs">{p.durationYears}y</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {p.description && <p className="text-xs text-neutral-500 line-clamp-2">{p.description}</p>}
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(p)}>
                    <Pencil className="size-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteMut.mutate(p.id); }}>
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
            <DialogTitle>{editing ? 'Edit Program' : 'New Program'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Preset quick-select */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Common Programs</Label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {PROGRAM_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, name: preset.name, level: preset.level }))}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Bachelor of Science in Computer Science" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code</Label>
                <Input placeholder="BSC-CS" value={form.code} onChange={e => setField('code', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Duration (years)</Label>
                <Input type="number" min={1} max={10} placeholder="3" value={form.durationYears} onChange={e => setField('durationYears', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={v => setField('level', v)}>
                <SelectTrigger><SelectValue placeholder="Select level…" /></SelectTrigger>
                <SelectContent>{PROGRAM_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input placeholder="Optional description" value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog} disabled={busy}><X className="size-4 mr-1" /> Cancel</Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Check className="size-4 mr-1" />}
              {editing ? 'Save Changes' : 'Create Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
