import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import {
  indexerService,
  type EventName,
  type ContractName,
  type BlockchainTransaction,
  type TransactionFilters,
} from '@/services/indexerService';

const PAGE_SIZE = 15;

// ── Display helpers ────────────────────────────────────────────────────────
function truncate(str?: string, pre = 8, suf = 6) {
  if (!str) return '—';
  if (str.length <= pre + suf + 3) return str;
  return `${str.slice(0, pre)}…${str.slice(-suf)}`;
}

function resolveTxHash(tx: any) {
  return (tx?.txHash || tx?.hash || '').toString();
}

function isValidTxHash(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const diffH = Math.round((Date.now() - d.getTime()) / 3_600_000);
  if (diffH < 1) return `${Math.round((Date.now() - d.getTime()) / 60_000)}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const EVENT_BADGE: Record<EventName, { label: string; className: string }> = {
  InstitutionMinted: { label: 'Institution Minted', className: 'bg-violet-500/10 text-violet-700' },
  CredentialIssued: { label: 'Credential Issued', className: 'bg-blue-500/10 text-blue-700' },
  VoteCast: { label: 'Vote Cast', className: 'bg-amber-500/10 text-amber-700' },
  ProposalCreated: { label: 'Proposal Created', className: 'bg-pink-500/10 text-pink-700' },
  ScoreUpdated: { label: 'Score Updated', className: 'bg-emerald-500/10 text-emerald-700' },
  ActionExecuted: { label: 'Action Executed', className: 'bg-slate-500/10 text-slate-700' },
};

const CONTRACT_BADGE: Record<ContractName, { label: string; className: string }> = {
  IIN: { label: 'IIN', className: 'bg-indigo-500/10 text-indigo-700' },
  CredentialIssuer: { label: 'CredIssuer', className: 'bg-cyan-500/10 text-cyan-700' },
  PoICRegistry: { label: 'PoICRegistry', className: 'bg-teal-500/10 text-teal-700' },
  GovernanceDAO: { label: 'GovernanceDAO', className: 'bg-orange-500/10 text-orange-700' },
  ExecutionController: { label: 'ExecCtrl', className: 'bg-slate-500/10 text-slate-700' },
};

function StatusBadge({ status }: { status: BlockchainTransaction['status'] }) {
  if (status === 'confirmed') {
    return (
      <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-wide">
        <CheckCircle2 className="w-3 h-3" /> Confirmed
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="flex items-center gap-1 text-amber-600 font-bold text-[10px] uppercase tracking-wide">
        <AlertCircle className="w-3 h-3" /> Pending
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-rose-600 font-bold text-[10px] uppercase tracking-wide">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className={cn('h-4 rounded', i === 0 ? 'w-32' : 'w-20')} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TransactionsTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<EventName | 'all'>('all');
  const [contractFilter, setContractFilter] = useState<ContractName | 'all'>('all');

  // Simple debounce via useCallback + timeout ref
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
      const timer = setTimeout(() => setDebouncedSearch(value), 400);
      return () => clearTimeout(timer);
    },
    [],
  );

  const filters: TransactionFilters = {
    eventName: eventFilter,
    contractName: contractFilter,
    search: debouncedSearch || undefined,
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['indexer-transactions', page, filters],
    queryFn: () => indexerService.getTransactions(page, PAGE_SIZE, filters),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['indexer-stats'],
    queryFn: () => indexerService.getIndexerStats(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const txs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function handleFilterChange() {
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <Input
            value={search}
            onChange={e => {
              handleSearchChange(e.target.value);
            }}
            placeholder="Search by tx hash or event name…"
            className="pl-11 h-11 rounded-2xl border-neutral-200 bg-white"
          />
        </div>

        <Select
          value={eventFilter}
          onValueChange={v => {
            setEventFilter(v as EventName | 'all');
            handleFilterChange();
          }}
        >
          <SelectTrigger className="h-11 w-full sm:w-52 rounded-2xl border-neutral-200">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="InstitutionMinted">Institution Minted</SelectItem>
            <SelectItem value="CredentialIssued">Credential Issued</SelectItem>
            <SelectItem value="VoteCast">Vote Cast</SelectItem>
            <SelectItem value="ProposalCreated">Proposal Created</SelectItem>
            <SelectItem value="ScoreUpdated">Score Updated</SelectItem>
            <SelectItem value="ActionExecuted">Action Executed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={contractFilter}
          onValueChange={v => {
            setContractFilter(v as ContractName | 'all');
            handleFilterChange();
          }}
        >
          <SelectTrigger className="h-11 w-full sm:w-48 rounded-2xl border-neutral-200">
            <SelectValue placeholder="All Contracts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contracts</SelectItem>
            <SelectItem value="IIN">IIN</SelectItem>
            <SelectItem value="CredentialIssuer">CredentialIssuer</SelectItem>
            <SelectItem value="PoICRegistry">PoICRegistry</SelectItem>
            <SelectItem value="GovernanceDAO">GovernanceDAO</SelectItem>
            <SelectItem value="ExecutionController">ExecutionController</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-11 px-4 rounded-2xl border-neutral-200 shrink-0"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          {(Object.entries(stats.eventCounts) as [EventName, number][]).map(([event, count]) => {
            const cfg = EVENT_BADGE[event];
            if (!cfg) return null;
            return (
              <span
                key={event}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide',
                  cfg?.className ?? 'bg-slate-200/70 text-slate-700',
                )}
              >
                {cfg?.label ?? event}: {count}
              </span>
            );
          })}
        </div>
      )}

      {/* Result info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {isLoading ? '—' : (
            <>
              <span className="font-bold text-slate-800">{total}</span> transactions
            </>
          )}
        </span>
        <span className="text-slate-400 text-[11px] font-mono">
          Block #{stats?.lastIndexedBlock?.toLocaleString() ?? '—'}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-100 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-100 bg-neutral-50/60">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-6">
                  Tx Hash
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Event
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Contract
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Block
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Timestamp
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-6">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
                : txs.map((tx, idx) => {
                  const eventCfg = EVENT_BADGE[tx.eventName];
                  const contractCfg = CONTRACT_BADGE[tx.contractName];
                  const txHash = resolveTxHash(tx);
                  const hasValidHash = isValidTxHash(txHash);
                  return (
                      <motion.tr
                        key={tx.txHash}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-neutral-50 hover:bg-neutral-50/80 transition-colors"
                      >
                        {/* Tx hash */}
                        <TableCell className="pl-6">
                          {hasValidHash ? (
                            <a
                              href={`https://sepolia.basescan.org/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 font-mono text-[11px] text-blue-600 hover:text-blue-700 group"
                            >
                              {truncate(txHash, 10, 4)}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ) : (
                            <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                              {truncate(txHash, 10, 4)}
                            </span>
                          )}
                          <div className="mt-1 text-[10px] font-mono text-slate-400 break-all">
                            {txHash || '—'}
                          </div>
                        </TableCell>

                        {/* Event */}
                        <TableCell>
                          <Badge
                            className={cn(
                              'text-[9px] font-black uppercase tracking-wider border-none rounded-full px-2.5',
                              eventCfg.className,
                            )}
                          >
                            {eventCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Contract */}
                        <TableCell>
                        <Badge
                          className={cn(
                            'text-[9px] font-black uppercase tracking-wider border-none rounded-full px-2.5',
                            contractCfg?.className ?? 'bg-slate-200/70 text-slate-700',
                          )}
                        >
                          {contractCfg?.label ?? tx.contractName}
                        </Badge>
                      </TableCell>

                        {/* Block */}
                        <TableCell className="font-mono text-[11px] text-slate-600">
                          {tx.blockNumber.toLocaleString()}
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell className="text-xs text-slate-500">
                          {formatTimestamp(tx.timestamp)}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="pr-6">
                          <StatusBadge status={tx.status} />
                        </TableCell>
                      </motion.tr>
                    );
                  })}

              {!isLoading && txs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No transactions found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
              className="rounded-xl h-9 px-3"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 px-3"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
