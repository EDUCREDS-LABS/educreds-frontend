import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Vote, 
  CheckCircle, 
  XCircle, 
  Minus,
  Loader2,
  AlertCircle,
  TrendingUp,
  FileText,
  Shield
} from "lucide-react";
import { governanceApiService } from "@/lib/governanceApiService";
import { castDirectWalletVote } from "@/lib/governanceWalletVoting";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ProposalDetail() {
  const [match, params] = useRoute("/institution/governance/proposals/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVote, setSelectedVote] = useState<number | null>(null);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["/governance/proposal", params?.id],
    enabled: !!params?.id,
    queryFn: () => governanceApiService.getProposalDetail(params?.id || ""),
  });

  const { data: votingPower } = useQuery({
    queryKey: ["/governance/voting-power", user?.id],
    enabled: !!user?.id && !!params?.id,
    queryFn: () => governanceApiService.getVotingPower(params?.id || "", user?.walletAddress),
  });

  const voteMutation = useMutation({
    mutationFn: async (vote: number) => {
      return castDirectWalletVote(proposal as any, vote as 0 | 1 | 2);
    },
    onSuccess: () => {
      toast({
        title: "Vote cast successfully",
        description: "Your wallet vote has been recorded on-chain.",
      });
      queryClient.invalidateQueries({ queryKey: ["/governance/proposal", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/governance/proposals"] });
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message || "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (vote: number) => {
    if (!votingPower || votingPower.votingPower === 0) {
      toast({
        title: "No voting power",
        description: "You don't have voting power. You need an active Institution Identity NFT.",
        variant: "destructive",
      });
      return;
    }

    setSelectedVote(vote);
    voteMutation.mutate(vote);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Proposal not found</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/institution/governance-workspace">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Governance Workspace
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/institution/governance-workspace">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspace
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-900">Proposal Details</h1>
          <p className="text-neutral-600 mt-1">Proposal ID: {proposal.proposalId || proposal.id}</p>
        </div>
      </div>

      {/* Proposal Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{proposal.title || "Institution Verification"}</CardTitle>
            <div className="flex gap-2">
              <Badge variant={
                proposal.recommendedAction === 'approve' ? 'default' :
                proposal.recommendedAction === 'approve_with_limits' ? 'secondary' :
                proposal.recommendedAction === 'reject' ? 'destructive' : 'outline'
              }>
                {proposal.recommendedAction || proposal.state}
              </Badge>
              <Badge variant="outline">
                Score: {proposal.legitimacyScore}/100
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Legitimacy Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Legitimacy Score</span>
              <span className="text-sm text-neutral-600">{proposal.legitimacyScore}/100</span>
            </div>
            <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  proposal.legitimacyScore >= 80 ? 'bg-green-600' :
                  proposal.legitimacyScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${proposal.legitimacyScore}%` }}
              />
            </div>
          </div>

          {/* Notes/Description */}
          {proposal.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Analysis Notes</h3>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">{proposal.description}</p>
            </div>
          )}

          {/* Risk Flags */}
          {proposal.riskFlags && proposal.riskFlags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Risk Flags
              </h3>
              <div className="flex flex-wrap gap-2">
                {proposal.riskFlags.map((flag: string, i: number) => (
                  <Badge key={i} variant="destructive">{flag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Issuance Limit */}
          {proposal.suggestedIssuanceLimit && (
            <div>
              <h3 className="text-sm font-medium mb-2">Suggested Issuance Limit</h3>
              <p className="text-sm text-neutral-600">
                {proposal.suggestedIssuanceLimit} credentials per period
              </p>
            </div>
          )}

          {/* Created Date */}
          <div className="text-sm text-neutral-500">
            Created: {new Date(proposal.createdAt).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Voting Section */}
      {votingPower && votingPower.votingPower > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="w-5 h-5" />
              Cast Your Vote
            </CardTitle>
            <CardDescription>
              Your voting power: {votingPower.votingPower.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={selectedVote === 1 ? "default" : "outline"}
                className="h-20 flex flex-col gap-2"
                onClick={() => handleVote(1)}
                disabled={voteMutation.isPending}
              >
                <CheckCircle className="w-6 h-6" />
                <span>For</span>
              </Button>
              <Button
                variant={selectedVote === 2 ? "default" : "outline"}
                className="h-20 flex flex-col gap-2"
                onClick={() => handleVote(2)}
                disabled={voteMutation.isPending}
              >
                <Minus className="w-6 h-6" />
                <span>Abstain</span>
              </Button>
              <Button
                variant={selectedVote === 0 ? "destructive" : "outline"}
                className="h-20 flex flex-col gap-2"
                onClick={() => handleVote(0)}
                disabled={voteMutation.isPending}
              >
                <XCircle className="w-6 h-6" />
                <span>Against</span>
              </Button>
            </div>
            {voteMutation.isPending && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Casting vote...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(!votingPower || votingPower.votingPower === 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have voting power. You need an active Institution Identity NFT (IIN) to participate in governance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
