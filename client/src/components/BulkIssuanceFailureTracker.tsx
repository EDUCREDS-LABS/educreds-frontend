import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  Loader2,
  RotateCcw,
  Download,
  Eye,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface FailureTrackerProps {
  batchId: string;
  onRetryComplete?: (newBatchId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface FailureRecord {
  index: number;
  studentEmail: string;
  error: string;
  stage: 'preparation' | 'ipfs_upload' | 'blockchain_minting' | 'database_save' | 'unknown';
  timestamp: Date;
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
  onRetryComplete,
  isOpen,
  onClose,
}: FailureTrackerProps) {
  const { toast } = useToast();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [retryProgress, setRetryProgress] = useState(0);

  // Fetch failures
  const { data: failuresData, isLoading: failuresLoading, refetch } = useQuery({
    queryKey: [`/certificates/bulk/failures/${batchId}`],
    queryFn: async () => {
      const response = await fetch(`/api/certificates/bulk/failures/${batchId}`);
      if (!response.ok) throw new Error('Failed to fetch failures');
      return response.json();
    },
    enabled: isOpen,
  });

  const failures = (failuresData?.failures || []) as FailureRecord[];

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: async (indices?: number[]) => {
      const response = await fetch(`/api/certificates/bulk/retry-failed/${batchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indices }),
      });
      if (!response.ok) throw new Error('Failed to retry');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Retry Started',
        description: `${data.retryCount} failed certificate(s) queued for retry`,
      });
      if (onRetryComplete) {
        onRetryComplete(data.newBatchId);
      }
      setSelectedIndices(new Set());
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Retry Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedIndices.size === failures.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(failures.map((f) => f.index)));
    }
  };

  const handleSelectOne = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleRetrySelected = () => {
    if (selectedIndices.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one failure to retry',
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
        (f) => `${f.index + 1},"${f.studentEmail}","${(f.error || '').replace(/"/g, '""')}","${f.stage}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_failures_${batchId.substring(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto border-0 shadow-xl">
        <CardHeader className="border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Failed Issuances
              </CardTitle>
              <CardDescription className="mt-1">
                {failures.length} certificate(s) failed processing
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={retryMutation.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {failuresLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : failures.length === 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                No failed issuances found. All certificates were processed successfully!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Controls */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="bg-blue-50"
                >
                  <Checkbox
                    checked={selectedIndices.size === failures.length && failures.length > 0}
                    className="mr-2"
                  />
                  {selectedIndices.size === failures.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={handleRetrySelected}
                  disabled={selectedIndices.size === 0 || retryMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Selected ({selectedIndices.size})
                </Button>
                <Button
                  onClick={handleRetryAll}
                  disabled={retryMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry All
                </Button>
                <Button
                  onClick={downloadFailures}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Progress */}
              {retryMutation.isPending && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Retrying failed issuances...</p>
                  <Progress value={50} className="h-2" />
                </div>
              )}

              {/* Failure List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {failures.map((failure, idx) => (
                  <div
                    key={`${failure.index}-${idx}`}
                    className={`p-3 border rounded-lg ${STAGE_COLORS[failure.stage]}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIndices.has(failure.index)}
                        onCheckedChange={() => handleSelectOne(failure.index)}
                        disabled={retryMutation.isPending}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-neutral-600">
                            Row {failure.index + 1}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {STAGE_LABELS[failure.stage]}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-neutral-900">
                          {failure.studentEmail}
                        </p>
                        <p className="text-xs text-neutral-600 mt-1 break-words">
                          {failure.error}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <p className="font-medium mb-1">Troubleshooting Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {failures.some((f) => f.stage === 'preparation') && (
                      <li>Preparation errors: Check student wallet addresses and names</li>
                    )}
                    {failures.some((f) => f.stage === 'ipfs_upload') && (
                      <li>IPFS errors: Check internet connection and IPFS gateway status</li>
                    )}
                    {failures.some((f) => f.stage === 'blockchain_minting') && (
                      <li>Blockchain errors: Check account balance and contract status</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={retryMutation.isPending}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
