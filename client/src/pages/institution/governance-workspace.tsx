import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Vote,
  TrendingUp,
  BarChart3,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Zap,
  FileText,
  Award,
  Target,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { governanceApiService } from "@/lib/governanceApiService";
import {
  useProposals,
  useInstitutionDetail,
  useGovernanceSummary,
  useVotingPower,
  useCastVote,
  usePoICScores,
} from "@/hooks/useGovernance";
import { InstitutionCredibilityCard } from "@/components/InstitutionCredibilityCard";
import AnalyticsPage from "./analytics";

export default function GovernanceWorkspace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [proposalPage, setProposalPage] = useState(1);
  const [showAccessAlert, setShowAccessAlert] = useState(true);

  // Check governance verification status
  const { data: governanceInstitution, isLoading: governanceLoading } = useQuery({
    queryKey: ["/governance/institutions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        return await governanceApiService.getInstitutionDetail(user!.id);
      } catch (err: any) {
        return null;
      }
    },
  });

  const isGovernanceVerified = useMemo(() => {
    if (!governanceInstitution) return false;
    const poicScore = (governanceInstitution as any).poicScore ?? 0;
    return poicScore >= 60;
  }, [governanceInstitution]);

  // Fetch governance data
  const {
    data: proposalsData,
    isLoading: proposalsLoading,
  } = useProposals(proposalPage, 10);

  const {
    data: summaryData,
    isLoading: summaryLoading,
  } = useGovernanceSummary();

  const {
    data: poicScoresData,
    isLoading: poicLoading,
  } = usePoICScores();

  const proposals = proposalsData?.data || [];
  const summary = summaryData || {
    totalProposals: 0,
    activeProposals: 0,
    totalVotes: 0,
    totalInstitutions: 0,
    averagePoICScore: 0,
  };

  // Show access denied if not verified
  if (!governanceLoading && !isGovernanceVerified) {
    return (
      <div className="space-y-6">
        {showAccessAlert && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <p className="font-semibold">Governance Access Restricted</p>
                  <p>
                    Your institution must complete governance verification (PoIC score ≥ 60) to access
                    the Governance Workspace. Complete verification on the{" "}
                    <Link href="/institution/verification" className="underline">
                      Verification page
                    </Link>
                    .
                  </p>
                </div>
                <button
                  onClick={() => setShowAccessAlert(false)}
                  className="flex-shrink-0 text-sm font-medium hover:opacity-70 transition-opacity"
                  aria-label="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Current PoIC Score:{" "}
                <span className="font-semibold">
                  {(governanceInstitution as any)?.poicScore ?? 0}/100
                </span>
              </p>
              <Button asChild>
                <Link href="/institution/governance-verification">
                  Complete Governance Verification
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (governanceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPoICScore = (governanceInstitution as any)?.poicScore ?? 0;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Governance Workspace
          </h1>
          <p className="text-muted-foreground mt-1">
            Participate in DAO governance, vote on proposals, and access governance analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified (PoIC: {currentPoICScore})
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Your PoIC Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{currentPoICScore}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Institutional Credibility</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{summary.activeProposals}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requiring your vote</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{summary.totalProposals}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All governance proposals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Network Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{summary.totalInstitutions}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Verified institutions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 h-auto p-1 bg-muted rounded-lg w-full md:grid md:grid-cols-5 md:gap-0 md:h-10 md:p-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm flex-shrink-0">Overview</TabsTrigger>
          <TabsTrigger value="proposals" className="text-xs md:text-sm flex-shrink-0">Proposals</TabsTrigger>
          <TabsTrigger value="voting" className="text-xs md:text-sm flex-shrink-0">Voting</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs md:text-sm flex-shrink-0">Analytics</TabsTrigger>
          <TabsTrigger value="poic" className="text-xs md:text-sm flex-shrink-0">PoIC</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Your Institution Credibility */}
          {governanceInstitution && (
            <Card>
              <CardHeader>
                <CardTitle>Your Institution Credibility Profile</CardTitle>
                <CardDescription>
                  Your PoIC score determines your voting power and trust level in the network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">PoIC Score</span>
                      <Badge
                        className={
                          currentPoICScore >= 85
                            ? "bg-green-500"
                            : currentPoICScore >= 75
                            ? "bg-green-400"
                            : currentPoICScore >= 65
                            ? "bg-blue-500"
                            : currentPoICScore >= 55
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }
                      >
                        {currentPoICScore >= 85
                          ? "A+"
                          : currentPoICScore >= 75
                          ? "A"
                          : currentPoICScore >= 65
                          ? "B+"
                          : currentPoICScore >= 55
                          ? "B"
                          : "C"}
                      </Badge>
                    </div>
                    <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          currentPoICScore >= 85
                            ? "bg-green-600"
                            : currentPoICScore >= 75
                            ? "bg-green-500"
                            : currentPoICScore >= 65
                            ? "bg-blue-500"
                            : currentPoICScore >= 55
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${currentPoICScore}%` }}
                      />
                    </div>
                    <p className="text-2xl font-bold">{currentPoICScore}/100</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <strong>Voting Power:</strong> Based on PoIC score
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Status:</strong> Governance Verified
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Network Rank:</strong> Top {Math.round((currentPoICScore / 100) * summary.totalInstitutions)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Proposals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Proposals Requiring Your Vote</CardTitle>
                <CardDescription>
                  Proposals currently open for voting (PoIC-weighted)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/institution/governance-workspace?tab=proposals">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {proposalsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : proposals.filter((p: any) => p.state === "ACTIVE").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active proposals at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proposals
                    .filter((p: any) => p.state === "ACTIVE")
                    .slice(0, 3)
                    .map((proposal: any) => (
                      <Link
                        key={proposal.id}
                        href={`/institution/governance/proposals/${proposal.id}`}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 cursor-pointer transition"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{proposal.title || "Institution Verification"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Legitimacy Score: {Math.round(proposal.legitimacyScore || 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="default">
                            <Zap className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab("proposals")}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Proposals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse and review all governance proposals
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab("voting")}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Vote className="w-5 h-5" />
                  Voting History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View your voting history and participation
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab("analytics")}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Governance metrics and network insights
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Governance Proposals</CardTitle>
                  <CardDescription>
                    All proposals with PoIC-weighted voting status
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {proposalsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : proposals.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No proposals found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal: any) => (
                      <Link
                        key={proposal.id}
                        href={`/institution/governance/proposals/${proposal.id}`}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 cursor-pointer transition"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {proposal.title || proposal.institution_name || "Institution Verification"}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Legitimacy Score: {Math.round(proposal.legitimacyScore || 0)}/100
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {proposal.state === "ACTIVE" && "Voting Open"}
                              {proposal.state === "PENDING" && "Pending Review"}
                              {proposal.state === "EXECUTED" && "Executed"}
                              {proposal.state === "REJECTED" && "Rejected"}
                            </div>
                          </div>
                          <Badge
                            variant={
                              proposal.state === "ACTIVE"
                                ? "default"
                                : proposal.state === "PENDING"
                                ? "secondary"
                                : proposal.state === "EXECUTED"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {proposal.state === "ACTIVE" && <Zap className="w-3 h-3 mr-1" />}
                            {proposal.state === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                            {proposal.state === "EXECUTED" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {proposal.state === "REJECTED" && <XCircle className="w-3 h-3 mr-1" />}
                            {proposal.state}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {proposalsData && proposalsData.pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      disabled={proposalPage === 1}
                      onClick={() => setProposalPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {proposalPage} of {proposalsData.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={proposalPage === proposalsData.pagination.totalPages}
                      onClick={() => setProposalPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        {/* Voting Tab */}
        <TabsContent value="voting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Voting Activity</CardTitle>
              <CardDescription>
                Track your participation in governance voting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Vote className="h-4 w-4" />
                <AlertDescription>
                  Your voting history will appear here once you cast votes on proposals. Navigate to the{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setActiveTab("proposals")}
                  >
                    Proposals tab
                  </Button>{" "}
                  to participate in active votes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsPage />
        </TabsContent>

        {/* PoIC Scores Tab */}
        <TabsContent value="poic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network PoIC Scores</CardTitle>
              <CardDescription>
                Proof of Institutional Credibility scores across the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {poicLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <Alert>
                  <Award className="h-4 w-4" />
                  <AlertDescription>
                    PoIC score distribution and network statistics will be displayed here. This feature
                    is being enhanced to show comparative analytics across all verified institutions.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
