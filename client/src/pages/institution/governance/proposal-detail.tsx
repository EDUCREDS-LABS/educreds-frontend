import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Shield,
  Eye,
  Clock,
  Target,
  User,
  ExternalLink,
  ShieldAlert,
  Activity,
  Info
} from "lucide-react";
import { governanceApiService } from "@/lib/governanceApiService";
import { castDirectWalletVote } from "@/lib/governanceWalletVoting";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ProposalTransparencyCard } from "@/components/governance/ProposalTransparencyCard";
import { RiskAssessmentPanel } from "@/components/governance/RiskAssessmentPanel";
import { AssessmentTimeline } from "@/components/governance/AssessmentTimeline";

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
      <div className="space-y-12 max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-96 w-full rounded-[40px]" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-48 w-full rounded-[32px]" />
            <Skeleton className="h-64 w-full rounded-[32px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="size-20 bg-neutral-100 dark:bg-neutral-800 rounded-[32px] flex items-center justify-center text-neutral-400 mx-auto">
          <FileText className="size-10" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Proposal Not Found.</h1>
        <p className="text-neutral-500 font-medium">The requested governance record could not be retrieved from the decentralized registry.</p>
        <Link href="/institution/governance-workspace">
          <Button variant="outline" className="rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest">
            <ArrowLeft className="size-4 mr-2" /> Return to Workspace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/institution/governance-workspace">
            <Button variant="ghost" size="icon" className="rounded-xl size-12 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="size-6" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[9px]">
              <Shield className="size-3" />
              Governance Audit
            </div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              {proposal.title || "Infrastructure Verification"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn(
            "text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-none",
            proposal.state === "ACTIVE" ? "bg-primary/10 text-primary shadow-lg shadow-primary/10" :
            proposal.state === "EXECUTED" ? "bg-green-500 text-white shadow-lg shadow-green-500/20" :
            proposal.state === "REJECTED" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" :
            "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
          )}>
            Status: {proposal.state}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-neutral-900 text-white border-none shadow-lg shadow-black/10">
            PoIC Score: {Math.round(proposal.legitimacyScore || 0)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                <Info className="size-3.5" /> Proposal Analysis
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">Technical Description</CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                  {proposal.description || "This proposal outlines a request for decentralized identity issuance rights. It involves a cryptographic verification of the institution's authority and an assessment of its historical trust on the network."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Submission Details</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 font-bold">Created At</span>
                      <span className="font-black text-neutral-900 dark:text-neutral-100">{new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500 font-bold">Block Number</span>
                      <span className="font-black text-neutral-900 dark:text-neutral-100">#{(proposal as any).startBlock || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Network Trust</p>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500 font-bold">Legitimacy Coefficient</span>
                        <span className="font-black text-neutral-900 dark:text-neutral-100">{proposal.legitimacyScore}/100</span>
                      </div>
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            proposal.legitimacyScore >= 80 ? "bg-green-500" :
                            proposal.legitimacyScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${proposal.legitimacyScore}%` }}
                        />
                      </div>
                    </div>
                    {proposal.verificationConfidence != null && (
                      <div className="space-y-1.5 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 font-bold">Evidence Confidence</span>
                          <span className="font-black text-neutral-900 dark:text-neutral-100">{proposal.verificationConfidence}%</span>
                        </div>
                        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              proposal.verificationConfidence >= 75 ? "bg-emerald-500" :
                              proposal.verificationConfidence >= 50 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${proposal.verificationConfidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {proposal.evidenceSummary && (
                <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden">
                  <CardHeader className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-neutral-400">Evidence Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 text-sm text-neutral-600 dark:text-neutral-300">
                    <p>{proposal.evidenceSummary}</p>
                    {proposal.missingSignals?.length ? (
                      <p className="mt-4 text-xs uppercase tracking-[0.18em] font-black text-neutral-500">
                        Missing Signals: {proposal.missingSignals.join(', ')}
                      </p>
                    ) : null}
                    {proposal.scoreSource ? (
                      <p className="mt-3 text-[10px] uppercase tracking-[0.22em] font-black text-neutral-400">
                        Scoring source: {proposal.scoreSource.toUpperCase()}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Transparency Tabs */}
          <Tabs defaultValue="transparency" className="w-full">
            <TabsList className="bg-transparent border-b border-neutral-200 dark:border-neutral-800 w-full justify-start rounded-none h-12 p-0 gap-10">
              {[
                { id: "transparency", label: "Evidence Data", icon: Eye },
                { id: "risks", label: "Risk Matrix", icon: ShieldAlert },
                { id: "history", label: "Audit Timeline", icon: Activity },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 h-full font-bold text-xs uppercase tracking-widest transition-all gap-2"
                >
                  <tab.icon className="size-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="transparency" className="pt-8 outline-none">
              <ProposalTransparencyCard proposalId={proposal.id} />
            </TabsContent>

            <TabsContent value="risks" className="pt-8 outline-none">
              <RiskAssessmentPanel proposalId={proposal.id} />
            </TabsContent>

            <TabsContent value="history" className="pt-8 outline-none">
              <AssessmentTimeline proposalId={proposal.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Voting Card */}
          {votingPower && votingPower.votingPower > 0 ? (
            <Card className="border-none shadow-2xl shadow-primary/20 bg-primary rounded-[40px] overflow-hidden text-white">
              <CardHeader className="p-10 pb-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                    <Vote className="size-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase tracking-widest px-3 h-6 backdrop-blur-xl">
                    Weight: {votingPower.votingPower.toFixed(2)}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">Cast Your Vote</CardTitle>
                <CardDescription className="text-primary-foreground/70 font-bold uppercase tracking-widest text-[10px]">Strategic Consensus Participation</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="secondary"
                    className={cn(
                      "h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all gap-2",
                      selectedVote === 1 ? "bg-white text-primary shadow-xl" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    )}
                    onClick={() => handleVote(1)}
                    disabled={voteMutation.isPending}
                  >
                    {voteMutation.isPending && selectedVote === 1 ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                    VOTE FOR PROPOSAL
                  </Button>
                  <Button
                    variant="secondary"
                    className={cn(
                      "h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all gap-2",
                      selectedVote === 0 ? "bg-red-500 text-white shadow-xl border-none" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    )}
                    onClick={() => handleVote(0)}
                    disabled={voteMutation.isPending}
                  >
                    {voteMutation.isPending && selectedVote === 0 ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                    VOTE AGAINST
                  </Button>
                  <Button
                    variant="secondary"
                    className={cn(
                      "h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all gap-2",
                      selectedVote === 2 ? "bg-white text-primary shadow-xl" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    )}
                    onClick={() => handleVote(2)}
                    disabled={voteMutation.isPending}
                  >
                    {voteMutation.isPending && selectedVote === 2 ? <Loader2 className="size-4 animate-spin" /> : <Minus className="size-4" />}
                    ABSTAIN
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-neutral-50 dark:bg-neutral-900 rounded-[40px] overflow-hidden">
              <CardContent className="p-10 text-center space-y-6">
                <div className="size-16 bg-neutral-100 dark:bg-neutral-800 rounded-[24px] flex items-center justify-center text-neutral-400 mx-auto">
                  <ShieldAlert className="size-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black tracking-tight">Voting Locked.</h4>
                  <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                    You require an active Institution Identity NFT (IIN) to participate in consensus operations.
                  </p>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-neutral-200 dark:border-neutral-800">
                  Verify Credentials
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Proposer Metadata */}
          <Card className="border-none shadow-xl shadow-neutral-200/30 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 pb-4 border-b border-neutral-50 dark:border-neutral-800">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-neutral-400">Governance Context</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Proposer Authority</p>
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400">
                      <User className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {proposal.proposerAddress || "System Engine"}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Institution ID: {proposal.institutionId?.slice(0, 8) || "001"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Lifecycle Timeline</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs">
                      <Clock className="size-3.5 text-neutral-400" />
                      <span className="text-neutral-500 font-bold">Start Date:</span>
                      <span className="font-black text-neutral-900 dark:text-neutral-100 ml-auto">{new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Target className="size-3.5 text-neutral-400" />
                      <span className="text-neutral-500 font-bold">End Block:</span>
                      <span className="font-black text-neutral-900 dark:text-neutral-100 ml-auto">#{(proposal as any).endBlock || "TBD"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-neutral-50 dark:bg-neutral-800" />
              
              <Button variant="ghost" className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5">
                View On-Chain Receipt <ExternalLink className="size-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
