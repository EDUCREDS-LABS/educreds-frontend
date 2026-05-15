import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  RotateCcw,
  Download,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowRight,
  Database,
  Cpu,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FailureDialogProps {
  batchId?: string;
  batchHistory?: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onHistorySelect?: (jobId: string) => void;
  onRetryComplete?: (newBatchId: string) => void;
}

interface FailureRecord {
  index: number;
  studentEmail: string;
  error: string;
  stage: 'preparation' | 'ipfs_upload' | 'blockchain_minting' | 'database_save' | 'unknown';
  timestamp: string;
}

const STAGE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  preparation: { label: 'Metadata Prep', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
  ipfs_upload: { label: 'IPFS Sync', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
  blockchain_minting: { label: 'Mainnet Mint', icon: Cpu, color: 'text-orange-600', bg: 'bg-orange-50' },
  database_save: { label: 'Ledger Registry', icon: Database, color: 'text-red-600', bg: 'bg-red-50' },
  unknown: { label: 'Unknown Failure', icon: ShieldAlert, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function BulkIssuanceFailureTracker({
  batchId,
  batchHistory = [],
  isOpen,
  onOpenChange,
  onHistorySelect,
  onRetryComplete,
}: FailureDialogProps) {
  const { toast } = useToast();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [filterStage, setFilterStage] = useState<'all' | 'preparation' | 'ipfs_upload' | 'blockchain_minting' | 'database_save'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['bulkFailures', batchId],
    queryFn: async () => {
      if (!batchId) return { failures: [] };
      return api.getBulkFailures(batchId);
    },
    enabled: isOpen && !!batchId,
    staleTime: 1000 * 60,
  });

  const failures = (data?.failures || []) as FailureRecord[];

  const filteredFailures = useMemo(
    () =>
      failures
        .filter((failure) =>
          !searchTerm ||
          failure.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          failure.error.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter((failure) => filterStage === 'all' || failure.stage === filterStage),
    [failures, filterStage, searchTerm]
  );

  const retryMutation = useMutation({
    mutationFn: async (indices?: number[]) => {
      if (!batchId) throw new Error('Batch ID required');
      return api.retryBulkFailures(batchId, indices);
    },
    onSuccess: (response) => {
      toast({
        title: 'Re-minting Protocol Initiated',
        description: `${response.retryCount} certificates queued for consensus retry.`,
      });
      if (onRetryComplete) onRetryComplete(response.newBatchId);
      setSelectedIndices(new Set());
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Retry Blocked',
        description: error.message || 'Infrastructure error during retry.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (isOpen && batchId) {
      setSelectedIndices(new Set());
      setFilterStage('all');
      setSearchTerm('');
    }
  }, [batchId, isOpen]);

  const handleSelectOne = (index: number) => {
    setSelectedIndices((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIndices((current) =>
      current.size === filteredFailures.length
        ? new Set()
        : new Set(filteredFailures.map((f) => f.index))
    );
  };

  const handleRetrySelected = () => {
    if (selectedIndices.size === 0) {
      toast({ title: 'Select Records', description: 'Choose failed records to re-mint.', variant: 'destructive' });
      return;
    }
    retryMutation.mutate(Array.from(selectedIndices));
  };

  const downloadFailures = () => {
    const csv = [
      'Index,Email,Error,Stage',
      ...failures.map(f => `${f.index + 1},"${f.studentEmail}","${f.error.replace(/"/g, '""')}","${f.stage}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_issuances_${batchId?.slice(0, 8)}.csv`;
    a.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
        {/* Header Branding */}
        <div className="bg-neutral-900 dark:bg-black p-10 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10">
              <ShieldAlert className="size-48 rotate-12" />
           </div>
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                 <RotateCcw className="size-4" />
                 Recovery Protocol
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter">Failure <span className="text-primary">Intelligence</span>.</DialogTitle>
              <DialogDescription className="text-neutral-400 font-medium text-lg max-w-2xl">
                 Analyze and re-ingest failed certificate batches. Protocol-level recovery ensures no academic record is left un-synchronized.
              </DialogDescription>
           </div>
        </div>

        <div className="p-10 space-y-8">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <MetricBox label="Active Batch" value={batchId?.slice(0, 12) || 'N/A'} icon={Database} />
             <MetricBox label="Critical Failures" value={failures.length} icon={XCircle} color="text-red-500" />
             <MetricBox label="Staged for Re-mint" value={selectedIndices.size} icon={RotateCcw} color="text-primary" />
             <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-full rounded-2xl border-neutral-200 dark:border-neutral-800 font-bold" onClick={downloadFailures}>
                  <Download className="size-4 mr-2" /> Export
                </Button>
                {batchHistory.length > 1 && (
                  <select 
                    value={batchId} 
                    onChange={(e) => onHistorySelect?.(e.target.value)}
                    className="flex-1 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 text-xs font-black uppercase tracking-widest"
                  >
                    {batchHistory.map(h => <option key={h} value={h}>Batch {h.slice(0, 8)}</option>)}
                  </select>
                )}
             </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white dark:bg-neutral-900 p-6 rounded-[32px] shadow-sm border border-neutral-100 dark:border-neutral-800">
             <div className="flex flex-wrap gap-2">
                <FilterButton active={filterStage === 'all'} onClick={() => setFilterStage('all')} label="All Blocks" />
                {Object.keys(STAGE_CONFIG).filter(k => k !== 'unknown').map(s => (
                  <FilterButton 
                    key={s} 
                    active={filterStage === s} 
                    onClick={() => setFilterStage(s as any)} 
                    label={STAGE_CONFIG[s].label} 
                  />
                ))}
             </div>
             <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <Input 
                  placeholder="Filter by recipient email..." 
                  className="pl-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none font-medium text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          {/* Failure Feed */}
          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white dark:bg-neutral-900">
             <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                   <table className="w-full">
                      <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left">
                           <th className="px-8 py-4 w-12"><Checkbox checked={selectedIndices.size === filteredFailures.length && filteredFailures.length > 0} onCheckedChange={handleSelectAll} /></th>
                           <th className="px-8 py-4">Index</th>
                           <th className="px-8 py-4">Recipient Context</th>
                           <th className="px-8 py-4">Failure Stage</th>
                           <th className="px-8 py-4">Technical Diagnostics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                         {isLoading || isRefetching ? (
                           Array.from({ length: 3 }).map((_, i) => (
                             <tr key={i}><td colSpan={5} className="px-8 py-6"><div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" /></td></tr>
                           ))
                         ) : filteredFailures.length === 0 ? (
                           <tr><td colSpan={5} className="px-8 py-24 text-center text-neutral-400 font-bold uppercase tracking-widest text-xs">No failures detected in this segment.</td></tr>
                         ) : (
                           filteredFailures.map((f) => (
                             <tr key={`${f.index}-${f.stage}`} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                                <td className="px-8 py-6"><Checkbox checked={selectedIndices.has(f.index)} onCheckedChange={() => handleSelectOne(f.index)} /></td>
                                <td className="px-8 py-6 font-mono text-[10px] font-bold text-neutral-400">#{f.index + 1}</td>
                                <td className="px-8 py-6">
                                   <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 tracking-tight">{f.studentEmail}</p>
                                   <p className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">Recipient Cluster</p>
                                </td>
                                <td className="px-8 py-6">
                                   <Badge className={cn("border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest shadow-sm", STAGE_CONFIG[f.stage].bg, STAGE_CONFIG[f.stage].color)}>
                                      {STAGE_CONFIG[f.stage].label}
                                   </Badge>
                                </td>
                                <td className="px-8 py-6">
                                   <p className="text-[11px] font-medium text-red-500 line-clamp-2 max-w-md">{f.error}</p>
                                </td>
                             </tr>
                           ))
                         )}
                      </tbody>
                   </table>
                </div>
             </CardContent>
          </Card>
        </div>

        <DialogFooter className="p-10 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center gap-6">
           <div className="flex-1 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                 <AlertCircle className="size-5" />
              </div>
              <p className="text-xs text-neutral-500 font-medium max-w-md">
                 Re-minting will execute new IPFS synchronization and blockchain transactions. Standard protocol gas fees apply.
              </p>
           </div>
           <div className="flex gap-4">
              <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-neutral-400" onClick={() => onOpenChange(false)}>Close Registry</Button>
              <Button 
                onClick={handleRetrySelected} 
                disabled={retryMutation.isLoading || selectedIndices.size === 0}
                className="h-14 px-10 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                {retryMutation.isLoading ? <RefreshCw className="size-5 mr-2 animate-spin" /> : <RotateCcw className="size-5 mr-2" />}
                Execute Re-minting ({selectedIndices.size})
              </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetricBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-[32px] border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center gap-4">
       <div className={cn("size-10 rounded-xl flex items-center justify-center bg-neutral-50 dark:bg-neutral-800", color)}>
          <Icon className="size-5" />
       </div>
       <div>
          <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
          <p className={cn("text-xl font-black tracking-tight", color || "text-neutral-900 dark:text-neutral-100")}>{value}</p>
       </div>
    </div>
  );
}

function FilterButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        active 
          ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-lg" 
          : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800"
      )}
    >
      {label}
    </button>
  );
}
