import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, TrendingUp } from 'lucide-react';
import { formatTransparencyDate, formatNumber, formatPercentage } from '@/lib/transparency-tokens';
import type { VotingContextResponse } from '@/lib/governanceApiService';

interface VotingContextSectionProps {
  votingContext: VotingContextResponse;
}

export function VotingContextSection({ votingContext }: VotingContextSectionProps) {
  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const now = Date.now();
  const votingEndsMs = new Date(votingContext.votingEndsAt).getTime();
  const isActive = now < votingEndsMs;
  const secondsRemaining = Math.max(0, (votingEndsMs - now) / 1000);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Voting Parameters
        </CardTitle>
        <CardDescription>On-chain voting configuration and timeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status and Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voting Status</span>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'ACTIVE' : 'ENDED'}
            </Badge>
          </div>
          {isActive && secondsRemaining > 0 && (
            <div className="text-sm text-muted-foreground">
              ⏱️ {formatTimeRemaining(secondsRemaining)} remaining
            </div>
          )}
        </div>

        {/* Timeline Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 rounded-lg border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Voting Starts
            </p>
            <p className="text-sm font-medium">
              {formatTransparencyDate(votingContext.votingStartsAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              Block #{formatNumber(votingContext.currentBlockNumber)}
            </p>
          </div>

          <div className="space-y-1 rounded-lg border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Voting Ends
            </p>
            <p className="text-sm font-medium">
              {formatTransparencyDate(votingContext.votingEndsAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              Block #{formatNumber(votingContext.estimatedCompletionBlocks)}
            </p>
          </div>
        </div>

        {/* Voting Requirements */}
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="font-semibold">Quorum & Approval Requirements</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Quorum Required
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatNumber(votingContext.quorumRequired)}
              </p>
              <p className="text-xs text-muted-foreground">votes to reach quorum</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Approval Threshold
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatPercentage(votingContext.approvalThreshold)}
              </p>
              <p className="text-xs text-muted-foreground">of votes required to approve</p>
            </div>
          </div>
        </div>

        {/* Block Information */}
        <div className="space-y-3">
          <h4 className="font-semibold">Block Information</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground">Current Block</p>
              <p className="font-mono text-sm font-medium">
                {formatNumber(votingContext.currentBlockNumber)}
              </p>
            </div>
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground">Block Timestamp</p>
              <p className="font-mono text-xs text-muted-foreground">
                {new Date(votingContext.currentBlockTimestamp * 1000).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Estimated Completion
              </p>
              <p className="font-mono text-sm font-medium">
                {formatNumber(votingContext.estimatedCompletionBlocks)} blocks
              </p>
            </div>
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground">Est. Time</p>
              <p className="text-sm font-medium">
                {formatTimeRemaining(votingContext.estimatedCompletionSeconds)}
              </p>
            </div>
          </div>
        </div>

        {/* Proposal State Info */}
        <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h4 className="font-semibold">On-Chain Proposal State</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Proposal ID
              </p>
              <p className="mt-1 font-mono text-sm font-medium">
                {formatNumber(votingContext.onChainProposalId)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Current State
              </p>
              <Badge variant="outline" className="mt-1">
                {votingContext.onChainProposalState.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-muted-foreground">
            ℹ️ All voting parameters are synchronized with the blockchain. Block numbers and timestamps
            reflect the latest on-chain state.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
