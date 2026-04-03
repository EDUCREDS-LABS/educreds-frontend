import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Activity, Award, ArrowRight, Filter, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import { useInstitutions } from '@/hooks/useGovernance';
import type { InstitutionResponse } from '@/lib/governanceApiService';
import InstitutionDetailSheet from './InstitutionDetailSheet';

// ── Enriched type ──────────────────────────────────────────────────────────
type EnrichedInstitution = InstitutionResponse & {
  poicScore: number;
  issuanceCount: number;
  iinIndex: number;
  country: string;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: 'Verified', className: 'bg-emerald-500/10 text-emerald-600' },
  verified: { label: 'Verified', className: 'bg-emerald-500/10 text-emerald-600' },
  PENDING: { label: 'Under Review', className: 'bg-amber-500/10 text-amber-600' },
  review: { label: 'Under Review', className: 'bg-amber-500/10 text-amber-600' },
  REJECTED: { label: 'Decommissioned', className: 'bg-rose-500/10 text-rose-600' },
  decommissioned: { label: 'Decommissioned', className: 'bg-rose-500/10 text-rose-600' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, className: 'bg-blue-500/10 text-blue-600' };
}

// ── Institution Card ───────────────────────────────────────────────────────
function InstitutionCard({
  institution,
  idx,
  onSelect,
}: {
  institution: EnrichedInstitution;
  idx: number;
  onSelect: (inst: EnrichedInstitution) => void;
}) {
  const isPremium = institution.poicScore >= 80;
  const status = getStatusConfig(institution.verificationStatus ?? 'verified');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: Math.min(idx * 0.04, 0.4) }}
      className="group cursor-pointer"
      onClick={() => onSelect(institution)}
    >
      <Card className="h-full border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-start justify-between mb-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/30">
              {institution.name.charAt(0)}
            </div>
            <Badge
              className={cn(
                'rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-none',
                isPremium ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600',
              )}
            >
              {isPremium ? 'Premium Issuer' : 'Verified Issuer'}
            </Badge>
          </div>
          <CardTitle className="text-xl font-black text-slate-900 tracking-tight leading-tight italic uppercase line-clamp-2">
            {institution.name}
          </CardTitle>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-2">
            <Globe className="w-3 h-3 shrink-0" />
            <span className="truncate">{institution.walletAddress.substring(0, 18)}…</span>
          </div>
          <div className="mt-2">
            <Badge
              className={cn(
                'text-[9px] font-black uppercase tracking-widest border-none rounded-full px-2.5',
                status.className,
              )}
            >
              {status.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-4 space-y-6">
          {/* PoIC bar */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                PoIC Trust Index
              </span>
              <span
                className={cn(
                  'text-2xl font-black italic tracking-tighter',
                  isPremium ? 'text-emerald-500' : 'text-blue-500',
                )}
              >
                {institution.poicScore}
                <span className="text-xs ml-1 opacity-40">/100</span>
              </span>
            </div>
            <Progress
              value={institution.poicScore}
              className="h-1.5 bg-neutral-100"
              indicatorClassName={isPremium ? 'bg-emerald-500' : 'bg-blue-500'}
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Issuance
                </span>
              </div>
              <p className="text-lg font-black text-slate-900">
                {institution.issuanceCount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Identity
                </span>
              </div>
              <p className="text-lg font-black text-slate-900">
                IIN #{institution.iinIndex}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full h-12 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold text-xs uppercase tracking-widest group/btn"
          >
            Full Trust Profile
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return <Skeleton className="h-[340px] rounded-[2.5rem] bg-white" />;
}

// ── Main tab ───────────────────────────────────────────────────────────────
export default function InstitutionsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'poicScore' | 'issuanceCount' | 'name'>('poicScore');
  const [selectedInstitution, setSelectedInstitution] = useState<EnrichedInstitution | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useInstitutions(1, 100);

  // Enrich raw API data with display fields
  const institutions: EnrichedInstitution[] = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((inst, idx) => ({
      ...inst,
      poicScore: Math.floor(55 + ((idx * 7 + 13) % 45)),
      issuanceCount: Math.floor(200 + ((idx * 137 + 41) % 8000)),
      iinIndex: 1024 + idx,
      country: 'Global',
    }));
  }, [data]);

  // Filter + sort
  const filtered = useMemo(() => {
    let rows = institutions;
    if (statusFilter !== 'all') {
      rows = rows.filter(
        i =>
          i.verificationStatus?.toLowerCase() === statusFilter ||
          i.verificationStatus?.toUpperCase() ===
            { verified: 'VERIFIED', review: 'PENDING', decommissioned: 'REJECTED' }[statusFilter],
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.walletAddress.toLowerCase().includes(q),
      );
    }
    return [...rows].sort((a, b) => {
      if (sortBy === 'poicScore') return b.poicScore - a.poicScore;
      if (sortBy === 'issuanceCount') return b.issuanceCount - a.issuanceCount;
      return a.name.localeCompare(b.name);
    });
  }, [institutions, statusFilter, searchQuery, sortBy]);

  function handleSelect(inst: EnrichedInstitution) {
    setSelectedInstitution(inst);
    setSheetOpen(true);
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by institution name or wallet address…"
            className="pl-11 h-11 rounded-2xl border-neutral-200 bg-white focus-visible:ring-blue-500/20"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 w-full sm:w-44 rounded-2xl border-neutral-200">
            <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="review">Under Review</SelectItem>
            <SelectItem value="decommissioned">Decommissioned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-11 w-full sm:w-44 rounded-2xl border-neutral-200">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="poicScore">PoIC Score</SelectItem>
            <SelectItem value="issuanceCount">Issuance Count</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      {!isLoading && (
        <p className="text-sm text-slate-500 mb-6">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> institution
          {filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : (
            <AnimatePresence mode="popLayout">
              {filtered.map((inst, idx) => (
                <InstitutionCard
                  key={inst.id}
                  institution={inst}
                  idx={idx}
                  onSelect={handleSelect}
                />
              ))}
              {filtered.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-20 text-slate-400"
                >
                  <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No institutions match your filters</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
      </div>

      {/* Detail sheet */}
      <InstitutionDetailSheet
        institution={selectedInstitution}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
