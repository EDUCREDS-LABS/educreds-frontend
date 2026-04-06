import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Vote,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { usePublicProposalHistory } from '@/hooks/useGovernance';
import type { ProposalResponse } from '@/lib/governanceApiService';

const PAGE_SIZE = 10;

// ── State config ───────────────────────────────────────────────────────────
const STATE_CONFIG: Record<
  ProposalResponse['state'],
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600' },
  PENDING: { label: 'Pending', className: 'bg-amber-500/10 text-amber-600' },
  EXECUTED: { label: 'Executed', className: 'bg-blue-500/10 text-blue-600' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-500/10 text-rose-600' },
  CANCELLED: { label: 'Cancelled', className: 'bg-neutral-400/10 text-neutral-500' },
};

function truncateAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Proposal card ──────────────────────────────────────────────────────────
function ProposalCard({ proposal, idx }: { proposal: ProposalResponse; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const state = STATE_CONFIG[proposal.state] ?? { label: proposal.state, className: 'bg-slate-100 text-slate-600' };
  const forPct = proposal.legitimacyScore ?? 65;
  const againstPct = 100 - forPct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.4) }}
      className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden"
    >
      {/* Main row */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                className={cn(
                  'text-[9px] font-black uppercase tracking-widest border-none rounded-full px-2.5',
                  state.className,
                )}
              >
                {state.label}
              </Badge>
              {proposal.state === 'ACTIVE' && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Live
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-base leading-tight mb-1 line-clamp-2">
              {proposal.title}
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {truncateAddr(proposal.proposerAddress)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(proposal.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Vote className="w-3 h-3" />
                Legitimacy: {forPct}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-xl hover:bg-neutral-50"
              onClick={() => setExpanded(e => !e)}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Vote bars */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span className="text-emerald-600">For {forPct}%</span>
            <span className="text-rose-500">Against {againstPct}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-rose-100 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${forPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />
            <div className="p-5 bg-neutral-50/60 space-y-4">
              {proposal.description && (
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Description
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{proposal.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Legitimacy Score',
                    value: `${proposal.legitimacyScore ?? '—'}`,
                    color: 'text-blue-600',
                  },
                  {
                    label: 'Start Block',
                    value: proposal.startBlock ? `#${proposal.startBlock}` : 'TBD',
                    color: 'text-slate-700',
                  },
                  {
                    label: 'End Block',
                    value: proposal.endBlock ? `#${proposal.endBlock}` : 'TBD',
                    color: 'text-slate-700',
                  },
                  {
                    label: 'Exec Delay',
                    value: proposal.executionDelay ? `${proposal.executionDelay}s` : '—',
                    color: 'text-slate-700',
                  },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl bg-white border border-neutral-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {item.label}
                    </p>
                    <p className={cn('text-sm font-black', item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <p className="text-[10px] font-mono text-slate-400 truncate flex-1">
                  Proposer: {proposal.proposerAddress}
                </p>
                <a
                  href={`https://sepolia.basescan.org/address/${proposal.proposerAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
                >
                  Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonProposalCard() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ProposalsTab() {
  const [page, setPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<ProposalResponse['state'] | 'all'>('all');

  const { data, isLoading } = usePublicProposalHistory(page, PAGE_SIZE, stateFilter === 'all' ? undefined : stateFilter);

  const proposals =
    data?.data?.filter(p =>
      stateFilter === 'all' ? true : p.state === stateFilter,
    ) ?? [];

  const totalPages = data?.pagination.totalPages ?? 1;
  const total = data?.pagination.total ?? 0;

  return (
    <div className="space-y-5">
      {/* Governance access banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="absolute inset-y-0 right-0 w-60 bg-gradient-to-l from-blue-50 via-cyan-50 to-transparent" />
        <div className="relative p-6 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-black text-blue-600 uppercase tracking-[0.25em]">
              <Vote className="w-4 h-4" />
              Governance
            </div>
            <h3 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">
              Proposals & Votes Workspace
            </h3>
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
              Eligible verifiers and auditors can cast votes, review proposals, and track protocol decisions from the
              secure governance portal.
            </p>
          </div>
          <div className="flex-shrink-0">
            <a href="/governance/public-vote">
              <Button size="lg" className="rounded-full px-7 h-11 bg-white border border-neutral-200 text-slate-900 hover:bg-neutral-50 shadow-sm">
                Access Voting
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select
          value={stateFilter}
          onValueChange={v => {
            setStateFilter(v as typeof stateFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-48 rounded-2xl border-neutral-200">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="EXECUTED">Executed</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {!isLoading && (
          <span className="text-sm text-slate-500">
            <span className="font-bold text-slate-800">{total}</span> proposal
            {total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Proposal list */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonProposalCard key={i} />)
          : proposals.length > 0
          ? proposals.map((p, idx) => (
              <ProposalCard key={p.id} proposal={p} idx={idx} />
            ))
          : (
            <div className="text-center py-20 text-slate-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No proposals match your filter</p>
            </div>
          )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-4"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-4"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
