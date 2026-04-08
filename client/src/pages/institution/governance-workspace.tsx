import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ExternalLink,
  Lock,
  Cpu,
  Globe,
  Search,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { governanceApiService } from "@/lib/governanceApiService";
import { api } from "@/lib/api";
import {
  useProposals,
  useGovernanceSummary,
  usePoICScores,
} from "@/hooks/useGovernance";
import { cn } from "@/lib/utils";
import AnalyticsPage from "./analytics";

export default function GovernanceWorkspace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [proposalPage, setProposalPage] = useState(1);
  const [votingOnProposal, setVotingOnProposal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const { data: verificationStatus, isLoading: verificationLoading } = useQuery({
    queryKey: ["institution-verification-status", user?.id],
    enabled: !!user?.id,
    queryFn: () => api.getVerificationStatus(),
  });

  const isGovernanceVerified = useMemo(() => {
    const governanceEligibleStatuses = ["pending", "under_governance_review", "approved"];
    const statusFromVerification = (verificationStatus as any)?.verificationStatus?.toLowerCase?.() || "";
    const statusFromGovernanceInstitution = (governanceInstitution as any)?.institution?.verificationStatus?.toLowerCase?.() || 
                                           (governanceInstitution as any)?.verificationStatus?.toLowerCase?.() || "";

    const isVerified = Boolean((verificationStatus as any)?.isVerified) ||
                      Boolean((governanceInstitution as any)?.institution?.isVerified) ||
                      Boolean((governanceInstitution as any)?.isVerified);

    return isVerified || governanceEligibleStatuses.includes(statusFromVerification) || 
           governanceEligibleStatuses.includes(statusFromGovernanceInstitution);
  }, [governanceInstitution, verificationStatus]);

  const { data: proposalsData, isLoading: proposalsLoading } = useProposals(proposalPage, 10);
  const { data: summaryData, isLoading: summaryLoading } = useGovernanceSummary();
  const { data: poicScoresData, isLoading: poicLoading } = usePoICScores();

  const proposals = proposalsData?.data || [];
  
  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal: any) => {
      const matchesSearch = 
        (proposal.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (proposal.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (proposal.institution_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || proposal.state === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  const summary = summaryData || {
    totalProposals: 0,
    activeProposals: 0,
    totalVotes: 0,
    totalInstitutions: 0,
    averagePoICScore: 0,
  };

  const castVoteMutation = useMutation({
    mutationFn: async ({ proposalId, support }: { proposalId: string; support: 0 | 1 | 2 }) => {
      return governanceApiService.castVote(proposalId, support, user?.walletAddress);
    },
    onSuccess: () => {
      toast({ title: "Vote submitted", description: "Participation logged on blockchain." });
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
    onError: (error: any) => {
      toast({ title: "Vote failed", description: error?.message, variant: "destructive" });
    },
    onSettled: () => setVotingOnProposal(null),
  });

  const handleVote = async (proposalId: string, support: 0 | 1 | 2) => {
    if (!user?.walletAddress) {
      toast({ title: "Wallet missing", description: "Connect wallet to participate.", variant: "destructive" });
      return;
    }
    setVotingOnProposal(`${proposalId}-${support}`);
    castVoteMutation.mutate({ proposalId, support });
  };

  if (governanceLoading || verificationLoading || summaryLoading) {
    return (
      <div className="space-y-12 max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-[40px]" />
      </div>
    );
  }

  if (!isGovernanceVerified) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-10">
        <div className="text-center space-y-4">
          <div className="size-20 bg-red-50 dark:bg-red-950/30 rounded-[32px] flex items-center justify-center text-red-600 mx-auto shadow-xl shadow-red-500/10">
            <Shield className="size-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight dark:text-neutral-100">Governance Restricted.</h1>
          <p className="text-neutral-500 text-lg max-w-lg mx-auto font-medium leading-relaxed">
            Your institutional node requires full cryptographic verification before participating in DAO operations.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden">
          <CardContent className="p-10 text-center space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Incomplete Credentials</p>
              <div className="text-5xl font-black text-neutral-900 dark:text-neutral-100">
                {(governanceInstitution as any)?.poicScore ?? 0}<span className="text-neutral-300 dark:text-neutral-700">/100</span>
              </div>
              <p className="text-sm font-bold text-neutral-500">Proof of Institutional Credibility (PoIC)</p>
            </div>
            <div className="pt-4">
              <Link href="/institution/governance-verification">
                <Button className="h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-wider bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:scale-[1.02] transition-all">
                  Initiate Verification <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPoICScore = (governanceInstitution as any)?.poicScore ?? 0;

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Shield className="size-4" />
            Infrastructure Governance
          </div>
          <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
            Governance <span className="text-primary">Workspace</span>.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg font-medium leading-relaxed">
            Manage your institutional authority, participate in network consensus, and audit decentralized identity protocols.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
            <CheckCircle className="size-3 mr-2" />
            Node Active: PoIC {currentPoICScore}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Your PoIC Score", value: currentPoICScore, sub: "/100 Trust Rating", icon: Award, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Active Proposals", value: summary.activeProposals, sub: "Voting Required", icon: Vote, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Proposals", value: summary.totalProposals, sub: "Historical Log", icon: FileText, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Network Peers", value: summary.totalInstitutions, sub: "Verified Institutions", icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] group overflow-hidden transition-all hover:shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{s.label}</p>
                <div className={cn("size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", s.bg, s.color)}>
                  <s.icon className="size-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">{s.value}</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-black uppercase tracking-wider">{s.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-neutral-200 dark:border-neutral-800 w-full justify-start rounded-none h-12 p-0 gap-10">
          {[
            { id: "overview", label: "Strategic Overview", icon: Activity },
            { id: "proposals", label: "Consensus Proposals", icon: Vote },
            { id: "analytics", label: "Network Analytics", icon: BarChart3 },
            { id: "poic", label: "Protocol Compliance", icon: ShieldCheckIcon },
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

        <TabsContent value="overview" className="space-y-10 pt-10 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              {/* Active Proposals Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-black tracking-tight dark:text-neutral-100">Critical Votes</h3>
                  <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5" onClick={() => setActiveTab("proposals")}>
                    Analyze All <ArrowRight className="size-3 ml-2" />
                  </Button>
                </div>

                {proposalsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-[32px]" />)}
                  </div>
                ) : proposals.filter((p: any) => p.state === "ACTIVE").length === 0 ? (
                  <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-[32px] p-12 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                    <Vote className="size-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No active consensus required</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {proposals.filter((p: any) => p.state === "ACTIVE").slice(0, 3).map((proposal: any) => (
                      <Card key={proposal.id} className="border-none shadow-xl shadow-neutral-200/30 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden group">
                        <CardContent className="p-8 space-y-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-2 h-5">ID: {proposal.id.slice(0, 8)}</Badge>
                                <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none text-[9px] font-black uppercase px-2 h-5">
                                  Score: {Math.round(proposal.legitimacyScore || 0)}
                                </Badge>
                              </div>
                              <h4 className="text-xl font-black tracking-tight dark:text-neutral-100 group-hover:text-primary transition-colors">{proposal.title || "Institution Verification"}</h4>
                              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium line-clamp-2 leading-relaxed">
                                {proposal.description || "Verification request for decentralized academic authority and on-chain issuance rights."}
                              </p>
                            </div>
                            <div className="size-12 bg-neutral-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400">
                              <Zap className="size-5" />
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-50 dark:border-neutral-800/50">
                            <Button size="sm" className="rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold px-6 h-10 shadow-lg shadow-green-500/10" onClick={() => handleVote(proposal.id, 1)} disabled={castVoteMutation.isPending}>
                              {votingOnProposal === `${proposal.id}-1` ? <Loader2 className="size-3 mr-2 animate-spin" /> : <CheckCircle className="size-3.5 mr-2" />}
                              Vote For
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-xl border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 font-bold px-6 h-10 transition-all" onClick={() => handleVote(proposal.id, 0)} disabled={castVoteMutation.isPending}>
                              {votingOnProposal === `${proposal.id}-0` ? <Loader2 className="size-3 mr-2 animate-spin" /> : <XCircle className="size-3.5 mr-2" />}
                              Against
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold px-6 h-10 ml-auto" onClick={() => handleVote(proposal.id, 2)} disabled={castVoteMutation.isPending}>
                              Abstain
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              {/* Institution Identity Card */}
              <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-neutral-900 dark:bg-black rounded-[40px] overflow-hidden text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Cpu className="size-32 rotate-12" />
                </div>
                <CardHeader className="p-10 pb-4 relative z-10">
                  <div className="size-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                    <Shield className="size-8" />
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight">Node Authority</CardTitle>
                  <CardDescription className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Strategic Identity Active</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0 space-y-8 relative z-10">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Network Score</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${currentPoICScore}%` }} />
                        </div>
                        <span className="font-black tracking-tighter">{currentPoICScore}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-neutral-800/50 rounded-2xl">
                        <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xs font-bold text-green-400">VERIFIED</p>
                      </div>
                      <div className="p-4 bg-neutral-800/50 rounded-2xl">
                        <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Role</p>
                        <p className="text-xs font-bold text-blue-400 uppercase">Issuer Node</p>
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-white text-neutral-900 hover:bg-neutral-200 transition-all shadow-xl shadow-white/5">
                    View Network Audit
                  </Button>
                </CardContent>
              </Card>

              {/* Digital Proofs */}
              <Card className="border-none shadow-xl shadow-neutral-200/20 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] p-2">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
                    <Globe className="size-3" /> Blockchain Identity
                  </div>
                  <div className="space-y-4">
                    <div className="group">
                      <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase mb-2 tracking-widest">Decentralized ID (DID)</p>
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl font-mono text-[10px] text-neutral-600 dark:text-neutral-400 break-all border border-neutral-100 dark:border-neutral-800 group-hover:border-primary/20 transition-colors">
                        {user?.did || "did:educreds:unregistered"}
                      </div>
                    </div>
                    <div className="group">
                      <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase mb-2 tracking-widest">Public Key</p>
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl font-mono text-[10px] text-neutral-600 dark:text-neutral-400 break-all border border-neutral-100 dark:border-neutral-800 group-hover:border-primary/20 transition-colors">
                        {user?.walletAddress || "OX...NONE"}
                      </div>
                    </div>
                  </div>
                  <Button variant="link" className="p-0 h-auto text-[10px] font-black text-primary uppercase mt-2 hover:no-underline flex items-center">
                    Explore Governance Explorer <ExternalLink className="size-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="pt-10 outline-none space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tight dark:text-neutral-100">Governance Registry</CardTitle>
                  <CardDescription className="text-neutral-500 dark:text-neutral-400 font-medium">Archive of all institutional proposals and consensus events.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <Input 
                      placeholder="Search proposals..." 
                      className="pl-10 h-11 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] h-11 rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                      <div className="flex items-center gap-2">
                        <Filter className="size-3.5" />
                        <SelectValue placeholder="All States" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-200 dark:border-neutral-800">
                      <SelectItem value="ALL">All States</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="EXECUTED">Executed</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {proposalsLoading ? (
                <div className="p-10 space-y-6">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <div className="size-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto text-neutral-400">
                    <FileText className="size-8" />
                  </div>
                  <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No matching proposals found</p>
                  {searchQuery || statusFilter !== "ALL" ? (
                    <Button variant="ghost" className="text-primary font-bold text-xs" onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}>Clear Filters</Button>
                  ) : null}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                    <TableRow className="border-b border-neutral-100 dark:border-neutral-800">
                      <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest py-5">Proposal Title</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Trust Score</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Date</TableHead>
                      <TableHead className="px-8 text-right font-black text-[10px] uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.map((proposal: any) => (
                      <TableRow key={proposal.id} className="group border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all">
                        <TableCell className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="size-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <FileText className="size-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-black text-sm tracking-tight group-hover:text-primary transition-colors">
                                {proposal.title || proposal.institution_name || "Infrastructure Proposal"}
                              </p>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ID: {proposal.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg",
                            proposal.state === "ACTIVE" ? "bg-primary/10 text-primary border-primary/20" :
                            proposal.state === "EXECUTED" ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800" :
                            proposal.state === "REJECTED" ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800" :
                            "bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700"
                          )}>
                            {proposal.state}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[60px] h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  proposal.legitimacyScore >= 80 ? "bg-green-500" :
                                  proposal.legitimacyScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                                )} 
                                style={{ width: `${proposal.legitimacyScore}%` }} 
                              />
                            </div>
                            <span className="text-xs font-black tracking-tight">{Math.round(proposal.legitimacyScore || 0)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                            <Clock className="size-3 text-neutral-400" />
                            {new Date(proposal.createdAt || Date.now()).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <Link href={`/institution/governance/proposals/${proposal.id}`}>
                            <Button variant="outline" className="rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-800">
                              View Audit <ArrowRight className="size-3 ml-2" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {proposalsData && proposalsData.pagination.totalPages > 1 && (
                <div className="p-8 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30 flex justify-between items-center">
                  <Button variant="outline" disabled={proposalPage === 1} onClick={() => setProposalPage((p) => Math.max(1, p - 1))} className="rounded-xl h-11 font-bold text-xs uppercase tracking-widest border-neutral-200 dark:border-neutral-800">Previous</Button>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Page {proposalPage} <span className="text-neutral-300 mx-2">/</span> {proposalsData.pagination.totalPages}</p>
                  <Button variant="outline" disabled={proposalPage === proposalsData.pagination.totalPages} onClick={() => setProposalPage((p) => p + 1)} className="rounded-xl h-11 font-bold text-xs uppercase tracking-widest border-neutral-200 dark:border-neutral-800">Next Page</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="pt-10 outline-none">
          <AnalyticsPage />
        </TabsContent>

        <TabsContent value="poic" className="pt-10 outline-none space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
              <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800">
                <CardTitle className="text-2xl font-black tracking-tight">Compliance Protocol</CardTitle>
                <CardDescription className="text-neutral-500 font-medium">Standards for institutional cryptographic authority.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <p className="text-neutral-500 dark:text-neutral-400 text-lg leading-relaxed font-medium">
                  The EduCreds PoIC score represents your node's weight in the decentralized network. Maintaining a high score ensures priority issuance and increased voting weight.
                </p>
                <div className="space-y-4">
                  {[
                    { label: "Administrative Verification", status: "Verified", color: "text-green-500" },
                    { label: "Blockchain Identity NFT", status: "Active", color: "text-blue-500" },
                    { label: "Network Activity Volume", status: "High", color: "text-purple-500" },
                    { label: "Regulatory Accreditation", status: "Confirmed", color: "text-primary" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      <span className="text-sm font-bold text-neutral-600 dark:text-neutral-300">{item.label}</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", item.color)}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-primary rounded-[40px] overflow-hidden text-white">
              <CardContent className="p-10 flex flex-col h-full justify-between">
                <div className="space-y-6">
                  <div className="size-16 bg-white/20 rounded-[24px] flex items-center justify-center backdrop-blur-xl">
                    <Target className="size-8" />
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter leading-tight">Maintain Your Strategic Position.</h3>
                  <p className="text-primary-foreground/70 text-lg leading-relaxed font-medium">
                    Regularly update your institutional documentation to prevent trust decay and ensure uninterrupted infrastructure access.
                  </p>
                </div>
                <Button className="mt-8 h-14 bg-white text-primary hover:bg-neutral-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/10">
                  Update Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);
