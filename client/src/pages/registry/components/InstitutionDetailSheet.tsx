import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Globe,
  Award,
  Activity,
  Hash,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { governanceApiService, type InstitutionResponse } from '@/lib/governanceApiService';
import { indexerService, type BlockchainTransaction } from '@/services/indexerService';

// ── Helper components ──────────────────────────────────────────────────────
const EVENT_COLOR: Record<string, string> = {
  InstitutionMinted: 'bg-violet-500/10 text-violet-600',
  CredentialIssued: 'bg-blue-500/10 text-blue-600',
  VoteCast: 'bg-amber-500/10 text-amber-600',
  ProposalCreated: 'bg-pink-500/10 text-pink-600',
  ScoreUpdated: 'bg-emerald-500/10 text-emerald-600',
  ActionExecuted: 'bg-slate-500/10 text-slate-600',
};

function TxStatusIcon({ status }: { status: BlockchainTransaction['status'] }) {
  if (status === 'confirmed') return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
  if (status === 'pending') return <AlertCircle className="w-3 h-3 text-amber-500" />;
  return <XCircle className="w-3 h-3 text-rose-500" />;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function truncateHash(hash: string, chars = 8): string {
  return `${hash.slice(0, chars + 2)}…${hash.slice(-4)}`;
}

// ── Sub-sections ───────────────────────────────────────────────────────────
function PoICSection({ institutionId }: { institutionId: string }) {
  const { data: scores, isLoading } = useQuery({
    queryKey: ['poic-scores', institutionId],
    queryFn: () => governanceApiService.getPoICScores(),
    staleTime: 60_000,
    select: data => data.find(s => s.institutionId === institutionId),
  });

  const mockScore = {
    score: 78,
    components: { certificateScore: 82, reputationScore: 71, accreditationScore: 80 },
  };
  const score = scores ?? mockScore;

  const bars = [
    { label: 'Certificate Score', value: score.components.certificateScore, color: 'bg-blue-500' },
    { label: 'Reputation Score', value: score.components.reputationScore, color: 'bg-violet-500' },
    { label: 'Accreditation Score', value: score.components.accreditationScore, color: 'bg-emerald-500' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          PoIC Trust Index
        </span>
        <span
          className={cn(
            'text-3xl font-black italic tracking-tighter',
            score.score >= 80 ? 'text-emerald-500' : 'text-blue-500',
          )}
        >
          {score.score}
          <span className="text-xs ml-1 opacity-40">/100</span>
        </span>
      </div>
      <Progress
        value={score.score}
        className="h-2 bg-neutral-100"
        indicatorClassName={score.score >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}
      />

      <div className="pt-2 space-y-3">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          PoIC Components
        </p>
        {bars.map(bar => (
          <div key={bar.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 font-medium">{bar.label}</span>
              <span className="font-bold text-slate-800">{bar.value}</span>
            </div>
            <Progress
              value={bar.value}
              className="h-1 bg-neutral-100"
              indicatorClassName={bar.color}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTxSection({ institutionId }: { institutionId: string }) {
  const { data: txs, isLoading } = useQuery({
    queryKey: ['institution-transactions', institutionId],
    queryFn: () => indexerService.getInstitutionTransactions(institutionId),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!txs?.length) {
    return (
      <p className="text-sm text-slate-400 py-4 text-center">No transactions found</p>
    );
  }

  return (
    <div className="space-y-2">
      {txs.slice(0, 6).map(tx => (
        <motion.div
          key={tx.txHash}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-neutral-200 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <TxStatusIcon status={tx.status} />
            <div className="min-w-0">
              <Badge
                className={cn(
                  'text-[9px] font-black uppercase tracking-wider border-none px-2 py-0.5 rounded-full',
                  EVENT_COLOR[tx.eventName] ?? 'bg-slate-100 text-slate-600',
                )}
              >
                {tx.eventName}
              </Badge>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                {truncateHash(tx.txHash)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(tx.timestamp)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface InstitutionDetailSheetProps {
  institution: (InstitutionResponse & {
    poicScore?: number;
    issuanceCount?: number;
    iinIndex?: number;
  }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG = {
  verified: { label: 'Verified', className: 'bg-emerald-500/10 text-emerald-600' },
  VERIFIED: { label: 'Verified', className: 'bg-emerald-500/10 text-emerald-600' },
  review: { label: 'Under Review', className: 'bg-amber-500/10 text-amber-600' },
  PENDING: { label: 'Under Review', className: 'bg-amber-500/10 text-amber-600' },
  decommissioned: { label: 'Decommissioned', className: 'bg-rose-500/10 text-rose-600' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-500/10 text-rose-600' },
};

export default function InstitutionDetailSheet({
  institution,
  open,
  onOpenChange,
}: InstitutionDetailSheetProps) {
  if (!institution) return null;

  const statusKey = institution.verificationStatus ?? 'verified';
  const status = STATUS_CONFIG[statusKey as keyof typeof STATUS_CONFIG] ?? {
    label: statusKey,
    className: 'bg-blue-500/10 text-blue-600',
  };
  const poicScore = institution.poicScore ?? 78;
  const issuanceCount = institution.issuanceCount ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/30 shrink-0">
              {institution.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-black italic uppercase tracking-tight text-slate-900 leading-tight">
                {institution.name}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-1">
                <Globe className="w-3 h-3 shrink-0" />
                <span className="truncate">{institution.walletAddress}</span>
              </SheetDescription>
              <div className="mt-2">
                <Badge
                  className={cn(
                    'text-[9px] font-black uppercase tracking-widest border-none rounded-full px-2.5 py-1',
                    status.className,
                  )}
                >
                  {status.label}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Activity,
                  label: 'Certificates Issued',
                  value: issuanceCount.toLocaleString(),
                  color: 'text-blue-600',
                  bg: 'bg-blue-500/8',
                },
                {
                  icon: Hash,
                  label: 'IIN Token',
                  value: `#${institution.iinIndex ?? Math.floor(Math.random() * 999) + 1000}`,
                  color: 'text-violet-600',
                  bg: 'bg-violet-500/8',
                },
                {
                  icon: Award,
                  label: 'PoIC Score',
                  value: `${poicScore}/100`,
                  color: poicScore >= 80 ? 'text-emerald-600' : 'text-blue-600',
                  bg: poicScore >= 80 ? 'bg-emerald-500/8' : 'bg-blue-500/8',
                },
                {
                  icon: Globe,
                  label: 'Network',
                  value: 'Base Sepolia',
                  color: 'text-slate-600',
                  bg: 'bg-slate-500/8',
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  className={cn('p-3 rounded-2xl border border-neutral-100', stat.bg)}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon className={cn('w-3 h-3', stat.color)} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {stat.label}
                    </span>
                  </div>
                  <p className={cn('text-base font-black', stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* PoIC breakdown */}
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">
                Trust Score Breakdown
              </p>
              <PoICSection institutionId={institution.id} />
            </div>

            <Separator />

            {/* Recent transactions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                  Recent Transactions
                </p>
                <a
                  href={`https://sepolia.basescan.org/address/${institution.walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <RecentTxSection institutionId={institution.id} />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
