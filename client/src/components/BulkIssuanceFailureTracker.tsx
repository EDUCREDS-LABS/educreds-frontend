import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  RotateCcw,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

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

const STAGE_COLORS = {
  preparation: 'bg-blue-50 border-blue-200',
  ipfs_upload: 'bg-purple-50 border-purple-200',
  blockchain_minting: 'bg-orange-50 border-orange-200',
  database_save: 'bg-red-50 border-red-200',
  unknown: 'bg-gray-50 border-gray-200',
};

const STAGE_LABELS = {
  preparation: 'Preparation',
  ipfs_upload: 'IPFS Upload',
  blockchain_minting: 'Blockchain Minting',
  database_save: 'Database Save',
  unknown: 'Unknown',
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
  } = useQuery(
    ['bulkFailures', batchId],
    async () => {
      if (!batchId) return { failures: [] };
      return api.getBulkFailures(batchId);
    },
    {
      enabled: isOpen && !!batchId,
      staleTime: 1000 * 60 * 5,
      retry: false,
    }
  );

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
      if (!batchId) {
        throw new Error('Batch ID is required to retry failures');
      }
      return api.retryBulkFailures(batchId, indices);
    },
    onSuccess: (response) => {
      toast({
        title: 'Retry Started',
        description: `${response.retryCount} failed certificate(s) queued for retry`,
      });
      if (onRetryComplete) {
        onRetryComplete(response.newBatchId);
      }
      setSelectedIndices(new Set());
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Retry Failed',
        description: error.message || 'Unable to retry failed issuances',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (isOpen && batchId) {
      setSelectedIndices(new Set());
      setFilterStage('all');
      setSearchTerm('');
      void refetch();
    }
  }, [batchId, isOpen, refetch]);

  const handleSelectOne = (index: number) => {
    setSelectedIndices((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIndices((current) =>
      current.size === filteredFailures.length
        ? new Set()
        : new Set(filteredFailures.map((failure) => failure.index))
    );
  };

  const handleRetrySelected = () => {
    if (filteredFailures.length === 0 || selectedIndices.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Select at least one failed row to retry',
        variant: 'destructive',
      });
      return;
    }
    retryMutation.mutate(Array.from(selectedIndices));
  };

  const handleRetryAll = () => {
    retryMutation.mutate();
  };

  const downloadFailures = () => {
    const csv = [
      'Index,Email,Error,Stage',
      ...failures.map(
        (failure) =>
          `${failure.index + 1},"${failure.studentEmail}","${(failure.error || '').replace(/"/g, '""')}","${failure.stage}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bulk_failures_${batchId?.substring(0, 8) || 'unknown'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle>Bulk issuance failures</DialogTitle>
              <DialogDescription>
                Review earlier failed issuance rows, filter by stage, and retry only the rows you need.
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {batchHistory.length > 1 && (
                <select
                  value={batchId}
                  onChange={(event) => onHistorySelect?.(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                >
                  {batchHistory.map((historyId) => (
                    <option key={historyId} value={historyId}>
                      {historyId.slice(0, 8)}
                    </option>
                  ))}
                </select>
              )}
              <Button variant="outline" size="sm" onClick={downloadFailures}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Card className="border border-slate-200 bg-slate-50 p-4">
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Batch</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{batchId ? batchId.slice(0, 12) : 'None selected'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Total failures</p>
              <p className="mt-2 text-lg font-bold text-red-700">{failures.length}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Selected</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{selectedIndices.size}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Stage filter</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{filterStage.replace('_', ' ')}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['all', 'preparation', 'ipfs_upload', 'blockchain_minting', 'database_save'] as const).map((stage) => (
                <Button
                  key={stage}
                  size="sm"
                  variant={filterStage === stage ? 'secondary' : 'outline'}
                  onClick={() => setFilterStage(stage)}
                >
                  {stage === 'all'
                    ? 'All stages'
                    : stage === 'preparation'
                    ? 'Preparation'
                    : stage === 'ipfs_upload'
                    ? 'IPFS'
                    : stage === 'blockchain_minting'
                    ? 'Blockchain'
                    : 'Database'}
                </Button>
              ))}
            </div>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by email or error reason"
            />
          </div>

          <div className="space-y-3">
            <Button
              size="sm"
              onClick={handleSelectAll}
              variant="outline"
              className="w-full"
            >
              {selectedIndices.size === filteredFailures.length && filteredFailures.length > 0
                ? 'Deselect all'
                : 'Select all'}
            </Button>
            <Button
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={handleRetrySelected}
              disabled={retryMutation.isPending || selectedIndices.size === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry selected ({selectedIndices.size})
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={handleRetryAll}
              disabled={retryMutation.isPending || failures.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry all failures
            </Button>
          </div>
        </div>

        {retryMutation.isPending && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Queued retry operation...</p>
            <Progress value={50} className="h-2" />
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Select</TableHead>
                <TableHead className="w-[72px]">Row</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Occurred</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFailures.map((failure) => (
                <TableRow key={`${failure.index}-${failure.stage}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIndices.has(failure.index)}
                      onCheckedChange={() => handleSelectOne(failure.index)}
                    />
                  </TableCell>
                  <TableCell>{failure.index + 1}</TableCell>
                  <TableCell>{failure.studentEmail}</TableCell>
                  <TableCell>
                    <Badge className="bg-slate-100 text-slate-800">
                      {STAGE_LABELS[failure.stage]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-sm text-xs text-red-700 break-words">
                    {failure.error}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {new Date(failure.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            <p className="font-medium mb-1">Troubleshooting tips:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {failures.some((f) => f.stage === 'preparation') && (
                <li>Preparation errors usually mean wallet or recipient metadata issues.</li>
              )}
              {failures.some((f) => f.stage === 'ipfs_upload') && (
                <li>IPFS failures can be resolved by retrying after connectivity stabilizes.</li>
              )}
              {failures.some((f) => f.stage === 'blockchain_minting') && (
                <li>Blockchain errors may require checking contract connectivity or gas limits.</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
