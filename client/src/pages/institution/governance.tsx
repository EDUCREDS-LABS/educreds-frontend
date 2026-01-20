import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Vote, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function GovernanceDashboard() {
  const { user } = useAuth();

  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ["/governance/proposals"],
    queryFn: () => api.governance.getAllProposals(),
  });

  const { data: poicScore, isLoading: scoreLoading } = useQuery({
    queryKey: ["/governance/poic-score", user?.id],
    enabled: !!user?.id,
    queryFn: () => api.governance.getPoICScore(user?.id || ""),
  });

  const { data: votingPower, isLoading: powerLoading } = useQuery({
    queryKey: ["/governance/voting-power", user?.id],
    enabled: !!user?.id,
    queryFn: () => api.governance.getVotingPower(user?.id),
  });

  const activeProposals = proposals?.filter((p: any) => 
    p.recommended_action !== 'executed' && p.recommended_action !== 'rejected'
  ) || [];

  const myProposals = proposals?.filter((p: any) => 
    p.institution_name === user?.name || p.institutionId === user?.id
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Governance Dashboard</h1>
          <p className="text-neutral-600 mt-2">
            Participate in EduCreds protocol governance
          </p>
        </div>
        <Button asChild>
          <Link href="/institution/governance-verification">
            Submit Verification Proposal
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">PoIC Score</CardTitle>
          </CardHeader>
          <CardContent>
            {scoreLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{poicScore?.score || 0}</span>
                <span className="text-sm text-neutral-500">/100</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Voting Power</CardTitle>
          </CardHeader>
          <CardContent>
            {powerLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{votingPower?.power?.toFixed(2) || "0.00"}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">Active Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            {proposalsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{activeProposals.length}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600">My Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            {proposalsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{myProposals.length}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PoIC Score Breakdown */}
      {poicScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              PoIC Score Breakdown
            </CardTitle>
            <CardDescription>Your Proof of Institutional Credibility signals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {poicScore.signals && Object.entries(poicScore.signals).map(([key, value]: [string, any]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{typeof value === 'number' ? value.toFixed(1) : value}</span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${typeof value === 'number' ? value : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Proposals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="w-5 h-5" />
            Active Proposals
          </CardTitle>
          <CardDescription>Proposals currently open for voting</CardDescription>
        </CardHeader>
        <CardContent>
          {proposalsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : activeProposals.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No active proposals at this time
            </div>
          ) : (
            <div className="space-y-4">
              {activeProposals.map((proposal: any) => (
                <div
                  key={proposal.proposal_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{proposal.institution_name || "Institution Proposal"}</h3>
                      <Badge variant={
                        proposal.recommended_action === 'approve' ? 'default' :
                        proposal.recommended_action === 'approve_with_limits' ? 'secondary' :
                        proposal.recommended_action === 'reject' ? 'destructive' : 'outline'
                      }>
                        {proposal.recommended_action}
                      </Badge>
                      <Badge variant="outline">
                        Score: {proposal.legitimacy_score}/100
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {proposal.notes || "Institution verification proposal"}
                    </p>
                    {proposal.risk_flags && proposal.risk_flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proposal.risk_flags.slice(0, 3).map((flag: string, i: number) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/institution/governance/proposals/${proposal.proposal_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Proposals */}
      {myProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              My Proposals
            </CardTitle>
            <CardDescription>Proposals submitted by your institution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myProposals.map((proposal: any) => (
                <div
                  key={proposal.proposal_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">Proposal: {proposal.proposal_id}</h3>
                      <Badge variant={
                        proposal.recommended_action === 'approve' ? 'default' :
                        proposal.recommended_action === 'approve_with_limits' ? 'secondary' :
                        proposal.recommended_action === 'reject' ? 'destructive' : 'outline'
                      }>
                        {proposal.recommended_action}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <span>Score: {proposal.legitimacy_score}/100</span>
                      <span>Created: {new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/institution/governance/proposals/${proposal.proposal_id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
