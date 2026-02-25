import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Shield,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Settings,
  AlertCircle,
  ShieldCheck,
  FileCheck,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Server,
  Globe,
  Database,
  Search,
  RefreshCw,
  Loader2,
  MoreVertical,
  ChevronRight,
  Key,
  ShieldAlert,
  Cpu,
  Monitor
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  useSystemMetrics,
  useAuditLog,
  useSystemStatus,
  useInstitutionRegistry,
} from '@/hooks/useGovernance';
import { governanceApiService, type ProposalResponse } from '@/lib/governanceApiService';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const VOTE_HISTORY_DATA = [
  { name: 'Mon', votes: 400, proposals: 24 },
  { name: 'Tue', votes: 300, proposals: 13 },
  { name: 'Wed', votes: 200, proposals: 98 },
  { name: 'Thu', votes: 278, proposals: 39 },
  { name: 'Fri', votes: 189, proposals: 48 },
  { name: 'Sat', votes: 239, proposals: 38 },
  { name: 'Sun', votes: 349, proposals: 43 },
];

function AdminGovernanceDashboardContent() {
  const { toast } = useToast();
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('oversight');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeProposals, setActiveProposals] = useState<ProposalResponse[]>([]);
  const [proposalActionLoading, setProposalActionLoading] = useState<string | null>(null);
  const [poicRecomputeLoading, setPoicRecomputeLoading] = useState<string | null>(null);

  // Fetch data using react-query hooks
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useSystemMetrics();
  const {
    data: auditData,
    isLoading: auditLoading,
    refetch: refetchAuditLog,
  } = useAuditLog(1, 15);
  const {
    data: statusData,
    isLoading: statusLoading,
    refetch: refetchSystemStatus,
  } = useSystemStatus();
  const {
    data: registryData,
    isLoading: registryLoading,
    refetch: refetchRegistry,
  } = useInstitutionRegistry(1, 10);

  useEffect(() => {
    loadAdminProposals();
  }, []);

  const loadAdminProposals = async () => {
    try {
      const proposalsResponse = await governanceApiService.getAdminProposals(1, 6, 'active');
      setActiveProposals(proposalsResponse.data || []);
    } catch (error) {
      setActiveProposals([]);
    }
  };

  const handleAdminVote = async (proposalId: string, support: 0 | 1 | 2) => {
    try {
      setProposalActionLoading(`${proposalId}-${support}`);
      await governanceApiService.castAdminVote(
        proposalId,
        support,
        'Bootstrap-stage admin vote to unblock DAO governance before full institution onboarding.',
      );

      toast({
        title: 'Admin Vote Recorded',
        description: 'Bootstrap-stage vote submitted to DAO governance.',
      });

      await loadAdminProposals();
    } catch (error: any) {
      toast({
        title: 'Vote Failed',
        description: error?.message || 'Could not submit admin vote for this proposal.',
        variant: 'destructive',
      });
    } finally {
      setProposalActionLoading(null);
    }
  };

  const handleConfigureCountdown = async (proposal: ProposalResponse) => {
    const durationInput = window.prompt(
      'Set voting countdown in hours (1 - 720):',
      '24',
    );
    if (!durationInput) return;

    const thresholdInput = window.prompt(
      'Set weighted approval threshold % (1 - 100):',
      '60',
    );
    if (!thresholdInput) return;

    const durationHours = Number(durationInput);
    const approvalThresholdPercent = Number(thresholdInput);

    if (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 720) {
      toast({
        title: 'Invalid countdown',
        description: 'Duration must be between 1 and 720 hours.',
        variant: 'destructive',
      });
      return;
    }

    if (!Number.isFinite(approvalThresholdPercent) || approvalThresholdPercent < 1 || approvalThresholdPercent > 100) {
      toast({
        title: 'Invalid threshold',
        description: 'Threshold must be between 1 and 100 percent.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProposalActionLoading(`${proposal.id}-countdown`);
      const result = await governanceApiService.configureProposalCountdown(proposal.id, {
        durationHours,
        approvalThresholdPercent,
        startNow: true,
      });
      toast({
        title: 'Countdown configured',
        description: `Voting window set to ${result.durationHours}h at ${result.approvalThresholdPercent}% threshold.`,
      });
      await loadAdminProposals();
    } catch (error: any) {
      toast({
        title: 'Countdown setup failed',
        description: error?.message || 'Could not configure proposal countdown.',
        variant: 'destructive',
      });
    } finally {
      setProposalActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        refetchMetrics(),
        refetchSystemStatus(),
        refetchAuditLog(),
        refetchRegistry(),
        loadAdminProposals(),
      ]);
      toast({
        title: "Consensus sync completed",
        description: "Metrics, registry, proposals and telemetry have been refreshed.",
      });
    } catch {
      toast({
        title: "Consensus sync failed",
        description: "Some governance modules could not be refreshed.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCsvExport = () => {
    const rows = registryData?.data || [];
    if (!rows.length) {
      toast({
        title: "No data to export",
        description: "Registry is empty for the selected view.",
      });
      return;
    }

    const header = ['id', 'name', 'walletAddress', 'status', 'currentPoICScore', 'proposalsSubmitted', 'createdAt'];
    const csv = [
      header.join(','),
      ...rows.map((inst: any) => [
        inst.id,
        JSON.stringify(inst.name || ''),
        inst.walletAddress,
        inst.status,
        inst.currentPoICScore ?? 0,
        inst.proposalsSubmitted ?? 0,
        inst.createdAt || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `institution-registry-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSystemAudit = async () => {
    try {
      await Promise.all([refetchAuditLog(), refetchSystemStatus()]);
      setActiveTab('NOC');
      toast({
        title: "System audit completed",
        description: "Latest audit records and telemetry have been loaded.",
      });
    } catch {
      toast({
        title: "System audit failed",
        description: "Could not fetch telemetry/audit records.",
        variant: "destructive",
      });
    }
  };

  const handleElevateStatus = async (institution: any) => {
    try {
      await governanceApiService.elevateInstitutionStatus(institution.id);
      await refetchRegistry();
      toast({
        title: "Status elevated",
        description: `${institution.name} is now approved and verified.`,
      });
    } catch (error: any) {
      toast({
        title: "Elevate failed",
        description: error?.message || "Could not elevate institution status.",
        variant: "destructive",
      });
    }
  };

  const handleDecommission = async (institution: any) => {
    try {
      await governanceApiService.decommissionInstitution(institution.id);
      await refetchRegistry();
      setSelectedInstitution(null);
      toast({
        title: "Institution decommissioned",
        description: `${institution.name} has been removed from active governance.`,
      });
    } catch (error: any) {
      toast({
        title: "Decommission failed",
        description: error?.message || "Could not decommission institution.",
        variant: "destructive",
      });
    }
  };

  const handleManualPoICRecompute = async (institution: any) => {
    try {
      setPoicRecomputeLoading(institution.id);
      const result = await governanceApiService.recomputeInstitutionPoIC(institution.id);

      toast({
        title: "PoIC recompute completed",
        description: `Updated score: ${result.score} (on-chain: ${result.onChainScore})`,
      });

      await refetchRegistry();
      setSelectedInstitution((current: any) =>
        current?.id === institution.id
          ? {
              ...current,
              currentPoICScore: result.onChainScore ?? result.score,
            }
          : current,
      );
    } catch (error: any) {
      toast({
        title: "PoIC recompute failed",
        description: error?.message || "Failed to recompute institution PoIC.",
        variant: "destructive",
      });
    } finally {
      setPoicRecomputeLoading(null);
    }
  };

  if (metricsLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto overflow-hidden">
        <div className="flex justify-between items-center mb-10">
           <Skeleton className="h-12 w-64 bg-gray-900 rounded-2xl" />
           <Skeleton className="h-10 w-32 bg-gray-900 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 w-full bg-gray-900 rounded-3xl" />)}
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
           <Skeleton className="h-[400px] lg:col-span-2 bg-gray-900 rounded-3xl" />
           <Skeleton className="h-[400px] bg-gray-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  const systemMetrics = metrics || {
    totalProposals: 0,
    activeProposals: 0,
    totalVotes: 0,
    totalInstitutions: 0,
    averagePoICScore: 0,
    systemHealthScore: 100
  };

  return (
    <div className="min-h-screen bg-gray-950/20 p-2 sm:p-4 md:p-8 space-y-8 md:space-y-12 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
      
      {/* High-Fidelity Tactical Header */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-4 border-b border-gray-900/60">
        <div className="space-y-3">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
             <div className="p-3 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/20">
                <ShieldCheck className="w-7 h-7 text-white" />
             </div>
             <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">
                    Protocol <span className="text-blue-500">Oversight</span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">DAO Management Console v2.4</span>
                    <Badge className="bg-blue-600/10 text-blue-500 border-none rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">Enterprise Ready</Badge>
                </div>
             </div>
          </motion.div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-gray-900/50 rounded-2xl border border-gray-800/50 backdrop-blur-sm">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Consensus State</span>
                <span className="text-xs font-bold text-green-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Synchronized
                </span>
             </div>
             <div className="w-px h-8 bg-gray-800" />
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Global Latency</span>
                <span className="text-xs font-bold text-gray-300">24ms <span className="text-[10px] text-gray-600 font-medium">AVG</span></span>
             </div>
          </div>
          
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            className="border-gray-800 bg-gray-900 text-gray-400 hover:text-white rounded-2xl h-12 px-6 group transition-all"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-700", isRefreshing && "animate-spin")} />
            Recalibrate
          </Button>
          <Button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black h-12 px-10 shadow-2xl shadow-blue-500/20 text-xs uppercase tracking-widest"
          >
            <Zap className="w-4 h-4 mr-2" />
            Trigger Consensus
          </Button>
        </div>
      </section>

      {/* Intelligence Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <TacticalMetric 
          title="Total Proposals" 
          value={systemMetrics.totalProposals} 
          trend={`+${systemMetrics.activeProposals} Delta`}
          icon={FileCheck} 
          color="blue"
          subtext="Protocol modifications pending"
        />
        <TacticalMetric 
          title="Avg Trust Index" 
          value={systemMetrics.averagePoICScore} 
          trend="Nominal"
          suffix="/100"
          icon={Cpu} 
          color="indigo"
          subtext="Network-wide credibility score"
        />
        <TacticalMetric 
          title="Core Integrity" 
          value={systemMetrics.systemHealthScore} 
          trend="Verified"
          suffix="%"
          icon={ShieldAlert} 
          color={systemMetrics.systemHealthScore > 90 ? "green" : "amber"}
          subtext="Distributed node health"
        />
        <TacticalMetric 
          title="Active Delegates" 
          value={systemMetrics.totalVotes} 
          trend="Stable"
          icon={Monitor} 
          color="purple"
          subtext="Unique voting signatures"
        />
      </section>

      {/* Main Command Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <div className="flex items-center justify-center sticky top-4 z-30">
            <TabsList className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-1.5 rounded-[2rem] h-16 w-full max-w-4xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <TabsTrigger value="oversight" className="flex-1 rounded-[1.5rem] data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] transition-all">Command</TabsTrigger>
                <TabsTrigger value="registry" className="flex-1 rounded-[1.5rem] data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] transition-all">Registry</TabsTrigger>
                <TabsTrigger value="intelligence" className="flex-1 rounded-[1.5rem] data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] transition-all">Intelligence</TabsTrigger>
                <TabsTrigger value="NOC" className="flex-1 rounded-[1.5rem] data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] transition-all">Telemetry</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="oversight" className="space-y-12 outline-none">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Visual Analytics */}
            <Card className="lg:col-span-2 bg-gray-900/40 border-gray-800/50 border-none shadow-2xl rounded-[2.5rem] backdrop-blur-md overflow-hidden !bg-gray-900/40">
              <CardHeader className="p-10 border-b border-gray-800/30">
                 <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <CardTitle className="text-2xl font-black text-white italic tracking-tighter">NETWORK PERFORMANCE</CardTitle>
                        <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-1">Voting density & proposal lifecycle velocity</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-950/50 p-2 rounded-2xl border border-gray-800/50">
                        <ChartLegend label="Votes" color="#3b82f6" />
                        <ChartLegend label="Props" color="#8b5cf6" />
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-10">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={VOTE_HISTORY_DATA}>
                      <defs>
                        <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} opacity={0.5} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#4b5563" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ dy: 10, fontWeight: 900, fill: '#6b7280' }}
                      />
                      <YAxis 
                        stroke="#4b5563" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fontWeight: 900, fill: '#6b7280' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#030712', border: '1px solid #1f2937', borderRadius: '24px', padding: '20px' }}
                        cursor={{ stroke: '#374151', strokeWidth: 1 }}
                      />
                      <Area type="monotone" dataKey="votes" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorVotes)" />
                      <Area type="monotone" dataKey="proposals" stroke="#8b5cf6" strokeWidth={3} fill="transparent" strokeDasharray="10 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Participation Distribution */}
            <Card className="bg-gray-900/40 border-gray-800/50 border-none shadow-2xl rounded-[2.5rem] backdrop-blur-md overflow-hidden !bg-gray-900/40">
              <CardHeader className="p-10 border-b border-gray-800/30">
                 <CardTitle className="text-2xl font-black text-white italic tracking-tighter">TIER DENSITY</CardTitle>
                 <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-1">Classification of network capacity</CardDescription>
              </CardHeader>
              <CardContent className="p-10 flex flex-col justify-center">
                <div className="h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Elite Status', value: 12 },
                          { name: 'Standard Alpha', value: 34 },
                          { name: 'Watchlist Gamma', value: 8 },
                          { name: 'Isolated Zeta', value: 4 }
                        ]}
                        innerRadius={90}
                        outerRadius={120}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                      >
                        {[0, 1, 2, 3].map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none hover:opacity-80 transition-opacity" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#030712', border: 'none', borderRadius: '16px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl font-black text-white">58</span>
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Nodes</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-10">
                    <TacticalTierMetric label="Elite Authority" value="12" color="#3b82f6" />
                    <TacticalTierMetric label="Active Watch" value="08" color="#f59e0b" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="bg-gray-900/40 border-gray-800/50 border-none shadow-2xl rounded-[2.5rem] backdrop-blur-md overflow-hidden !bg-gray-900/40">
            <CardHeader className="p-10 border-b border-gray-800/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl font-black text-white italic tracking-tighter">BOOTSTRAP DAO VOTING</CardTitle>
                  <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-1">
                    Admin fallback voting for pre-onboarding governance approvals
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={loadAdminProposals}
                  className="border-gray-800 bg-gray-900 text-gray-400 hover:text-white rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {activeProposals.length === 0 ? (
                <div className="py-8 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-600">
                  No active proposals requiring bootstrap vote.
                </div>
              ) : activeProposals.map((proposal) => (
                <div key={proposal.id} className="p-4 rounded-2xl border border-gray-800 bg-gray-950/70 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">{proposal.title}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">{proposal.state}</p>
                      {proposal.endBlock ? (
                        <p className="text-[10px] text-blue-400 uppercase tracking-[0.18em] mt-1">
                          Ends: {new Date(Number(proposal.endBlock) * 1000).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white"
                      disabled={proposalActionLoading !== null}
                      onClick={() => handleAdminVote(proposal.id, 1)}
                    >
                      {proposalActionLoading === `${proposal.id}-1` ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                      Vote For
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white"
                      disabled={proposalActionLoading !== null}
                      onClick={() => handleAdminVote(proposal.id, 0)}
                    >
                      {proposalActionLoading === `${proposal.id}-0` ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                      Vote Against
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      disabled={proposalActionLoading !== null}
                      onClick={() => handleAdminVote(proposal.id, 2)}
                    >
                      {proposalActionLoading === `${proposal.id}-2` ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                      Abstain
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/40 text-blue-300 hover:bg-blue-700 hover:text-white"
                      disabled={proposalActionLoading !== null}
                      onClick={() => handleConfigureCountdown(proposal)}
                    >
                      {proposalActionLoading === `${proposal.id}-countdown` ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                      Set Countdown
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <TacticalRiskMonitor
            registryData={registryData}
            onIntervene={(institution: any) => setSelectedInstitution(institution)}
          />
        </TabsContent>

        <TabsContent value="registry" className="outline-none">
            <Card className="bg-gray-900 border-gray-800 border-none shadow-2xl rounded-[2.5rem] overflow-hidden !bg-gray-900">
                <CardHeader className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800/40">
                    <div>
                        <CardTitle className="text-3xl font-black text-white italic tracking-tighter uppercase">Personnel & Node Registry</CardTitle>
                        <CardDescription className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Verified credentialing authorities global directory</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                            <input className="bg-gray-950 border border-gray-800 rounded-2xl h-12 pl-12 pr-6 text-xs font-black text-white focus:ring-2 focus:ring-blue-600 transition-all outline-none w-full md:w-64" placeholder="QUERY LEDGER..." />
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleCsvExport}
                          className="border-gray-800 bg-gray-900 rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-all"
                        >
                          CSV EXPORT
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-950/70">
                                <tr>
                                    <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Primary Authority</th>
                                    <th className="py-8 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 text-center">Protocol Load</th>
                                    <th className="py-8 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 text-center">Trust Index</th>
                                    <th className="py-8 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 text-center">State</th>
                                    <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40">
                                {registryLoading ? (
                                    Array(6).fill(0).map((idx) => <tr key={idx}><td colSpan={5} className="p-10"><Skeleton className="h-10 w-full bg-gray-900 rounded-xl" /></td></tr>)
                                ) : registryData?.data?.map((inst: any, idx: number) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={inst.id} 
                                        className="hover:bg-blue-600/[0.03] transition-all group cursor-pointer"
                                        onClick={() => setSelectedInstitution(inst)}
                                    >
                                        <td className="py-8 px-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center text-white font-black text-xl group-hover:bg-blue-600 group-hover:scale-105 transition-all duration-500 shadow-xl">
                                                    {inst.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-white tracking-tight">{inst.name}</p>
                                                    <p className="text-[10px] text-gray-600 font-mono mt-1 opacity-80 tracking-widest">{inst.walletAddress.substring(0, 16)}...{inst.walletAddress.substring(34)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-8 px-6 text-center font-black text-gray-400 italic text-sm">{inst.proposalsSubmitted || 0}</td>
                                        <td className="py-8 px-6">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className={cn(
                                                    "text-xl font-black italic tracking-tighter",
                                                    inst.currentPoICScore >= 80 ? "text-green-500" : inst.currentPoICScore >= 60 ? "text-amber-500" : "text-red-500"
                                                )}>{inst.currentPoICScore}</div>
                                                <div className="w-20 h-1.5 bg-gray-800/50 rounded-full overflow-hidden border border-gray-800/50">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${inst.currentPoICScore}%` }}
                                                        className={cn("h-full rounded-full shadow-[0_0_8px_rgba(var(--color))]")} 
                                                        style={{ 
                                                            backgroundColor: inst.currentPoICScore >= 80 ? '#22c55e' : inst.currentPoICScore >= 60 ? '#f59e0b' : '#ef4444' 
                                                        }} 
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-8 px-6 text-center">
                                            <Badge className={cn(
                                                "rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] border-none shadow-sm",
                                                inst.status === 'approved' ? "bg-blue-600/10 text-blue-400" : "bg-red-600/10 text-red-500"
                                            )}>{inst.status}</Badge>
                                        </td>
                                        <td className="py-8 px-10 text-right">
                                            <Button variant="ghost" size="icon" className="group-hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all rounded-xl h-10 w-10">
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                                {(!registryLoading && (!registryData?.data || registryData.data.length === 0)) && (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center text-gray-700 font-black uppercase tracking-widest text-xs">
                                            No active institutional nodes detected on current shard.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="outline-none">
            <Card className="bg-gray-900 border-gray-800 border-none shadow-2xl rounded-[2.5rem] overflow-hidden !bg-gray-900">
                <CardHeader className="p-10 border-b border-gray-800/40 bg-gray-950/30">
                    <CardTitle className="text-2xl font-black text-white italic tracking-tighter uppercase">Log Stream Intelligence</CardTitle>
                    <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-1">Real-time classification of protocol-level events</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-800/30">
                        {auditLoading ? (
                            Array(10).fill(0).map((idx) => <div key={idx} className="p-12"><Skeleton className="h-8 w-full bg-gray-900 rounded-xl" /></div>)
                        ) : auditData?.data?.map((log: any, idx: number) => (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                key={log.id} 
                                className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all border-l-4 border-l-transparent hover:border-l-blue-600 relative group"
                            >
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg group-hover:rotate-6 transition-transform",
                                        getLogStyle(log.action)
                                    )}>
                                        {getLogIcon(log.action)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-base font-black text-white uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</p>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest bg-gray-800/50 px-2 py-0.5 rounded-md border border-gray-800/50">{log.resourceType}</span>
                                            <span className="text-[10px] text-gray-700 font-mono tracking-widest italic">{log.userId.substring(0, 24)}...</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end relative z-10">
                                    <div className="flex items-center gap-2 text-gray-400 font-black text-xs">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </div>
                                    <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] mt-2 group-hover:text-blue-500 transition-colors">{new Date(log.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="NOC" className="outline-none space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-gray-900/60 border-gray-800 border-none shadow-2xl rounded-[2.5rem] backdrop-blur-xl overflow-hidden !bg-gray-900/60">
                   <CardHeader className="p-10 border-b border-gray-800/40">
                      <div className="flex items-center gap-4">
                         <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-600/20">
                            <Server className="w-6 h-6 text-blue-500" />
                         </div>
                         <div>
                            <CardTitle className="text-2xl font-black text-white italic tracking-tighter">TELEMETRY DIAGNOSTICS</CardTitle>
                            <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-1">Sub-system operational state logs</CardDescription>
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-10 space-y-5">
                      {statusData?.components && Object.entries(statusData.components).map(([key, comp]: [string, any], idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={key} 
                            className="flex items-center justify-between p-6 bg-gray-950/60 rounded-3xl border border-gray-800 shadow-lg group hover:bg-gray-900 transition-all"
                        >
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-3.5 h-3.5 rounded-full transition-all duration-700",
                              comp.status === 'healthy' ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] group-hover:scale-125" : "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                            )} />
                            <div className="space-y-1">
                                <span className="text-sm font-black text-white uppercase tracking-[0.2em]">{key}</span>
                                <p className="text-[10px] text-gray-600 font-bold max-w-[280px] truncate uppercase">{comp.message}</p>
                            </div>
                          </div>
                          <Badge className={cn(
                             "rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest border-none shadow-xl",
                             comp.status === 'healthy' ? "bg-green-600 text-white" : "bg-amber-600 text-white"
                          )}>{comp.status}</Badge>
                        </motion.div>
                      ))}
                   </CardContent>
                </Card>

                <Card className="bg-gray-900/60 border-gray-800 border-none shadow-2xl rounded-[2.5rem] backdrop-blur-xl overflow-hidden !bg-gray-900/60">
                   <CardHeader className="p-10 border-b border-gray-800/40">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-600/10 rounded-xl border border-indigo-600/20">
                            <Activity className="w-6 h-6 text-indigo-500" />
                         </div>
                         <div>
                            <CardTitle className="text-2xl font-black text-white italic tracking-tighter">RESOURCE ALLOCATION</CardTitle>
                            <CardDescription className="text-gray-500 font-bold uppercase tracking-widest text-[9px] mt-1">Autonomous governance processing density</CardDescription>
                        </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-10 space-y-12">
                      <ResourceTacticalBar label="Block Ingestion Latency" value={14} color="blue" />
                      <ResourceTacticalBar label="PoIC Recursive Compute" value={48} color="indigo" />
                      <ResourceTacticalBar label="Audit Pipeline Validation" value={72} color="green" />
                      <ResourceTacticalBar label="AI Fraud Detection Load" value={23} color="purple" />
                      <ResourceTacticalBar label="Cross-Shard Consensus" value={8} color="amber" />
                   </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

      {/* Extreme Detail Oversight Modal */}
      <AnimatePresence>
          {selectedInstitution && (
            <Dialog open={true} onOpenChange={() => setSelectedInstitution(null)}>
              <DialogContent className="max-w-3xl bg-gray-950 border-gray-800 text-white rounded-[3rem] p-0 overflow-hidden shadow-[0_0_150px_rgba(59,130,246,0.15)] ring-1 ring-white/5">
                <div className="bg-gradient-to-tr from-blue-600/20 via-indigo-600/10 to-transparent p-12 border-b border-gray-900">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-800 flex items-center justify-center text-4xl font-black shadow-2xl shadow-blue-500/30 text-white rotate-3 group-hover:rotate-0 transition-transform">
                      {selectedInstitution.name.charAt(0)}
                    </div>
                    <div>
                      <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic">{selectedInstitution.name}</DialogTitle>
                      <DialogDescription className="text-xs text-gray-400 mt-2">
                        Institution governance controls and live integrity intervention actions.
                      </DialogDescription>
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-600/10 px-4 py-1.5 rounded-full border border-blue-600/10">
                            PARTNER NODE: {selectedInstitution.walletAddress.substring(0, 16)}...
                        </span>
                        <Badge className="bg-green-600/10 text-green-500 border-none rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em]">INTEGRITY LEVEL: NOMINAL</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-12 space-y-12">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <TacticalOversightStat label="PoIC INDEX" value={selectedInstitution.currentPoICScore} color="blue" />
                    <TacticalOversightStat label="PROPOSALS" value={selectedInstitution.proposalsSubmitted} color="indigo" />
                    <TacticalOversightStat label="UPTIME" value="99.98%" color="green" />
                    <TacticalOversightStat label="RISK GRAD" value="ALPHA" color="purple" />
                  </div>

                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 flex items-center gap-4">
                        <div className="h-px flex-1 bg-gray-900" />
                        DIRECT INTERVENTION CONTROLS
                        <div className="h-px flex-1 bg-gray-900" />
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ActionTacticalButton
                          icon={Database}
                          label="System Audit"
                          desc="Deep-scan ledger issuance"
                          onClick={handleSystemAudit}
                        />
                        <ActionTacticalButton
                          icon={RefreshCw}
                          label="Rebase Score"
                          desc="Force credibility re-calc"
                          onClick={() => handleManualPoICRecompute(selectedInstitution)}
                          loading={poicRecomputeLoading === selectedInstitution.id}
                        />
                        <ActionTacticalButton
                          icon={ShieldCheck}
                          label="Elevate Status"
                          desc="Grant priority access"
                          color="blue"
                          onClick={() => handleElevateStatus(selectedInstitution)}
                        />
                        <ActionTacticalButton
                          icon={ShieldAlert}
                          label="Decommission"
                          desc="Revoke network rights"
                          color="red"
                          onClick={() => handleDecommission(selectedInstitution)}
                        />
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-10 bg-gray-950 border-t border-gray-900">
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedInstitution(null)} 
                    className="w-full text-gray-700 hover:text-white font-black uppercase tracking-[0.3em] text-[10px] bg-transparent hover:bg-white/5 h-16 rounded-[1.5rem] transition-all border border-gray-900"
                  >
                    TERMINATE SESSION
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
      </AnimatePresence>
    </div>
  );
}

// --- Specialized UI Components ---

function TacticalMetric({ title, value, trend, icon: Icon, color, subtext, suffix }: any) {
  const colorMap: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <Card className="bg-gray-900 border-none shadow-2xl overflow-hidden relative group rounded-[2rem] cursor-default border-t border-white/5 !bg-gray-900">
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-8">
          <div className={cn("p-3.5 rounded-2xl border transition-all duration-700 group-hover:-rotate-12 shadow-2xl", colorMap[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge className="bg-gray-800/80 text-gray-500 border-none text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full">{trend}</Badge>
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-5xl font-black text-white tracking-tighter italic">{value}</p>
          {suffix && <span className="text-2xl font-black text-gray-700 tracking-tighter">{suffix}</span>}
        </div>
        <div className="text-[10px] font-black text-gray-600 mt-6 uppercase tracking-widest opacity-60 flex items-center gap-2">
           <span className="w-1 h-3 bg-gray-800 rounded-full" />
           <span>{subtext}</span>
        </div>
      </CardContent>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-[80px] pointer-events-none group-hover:bg-white/10 transition-all duration-1000" />
    </Card>
  );
}

function TacticalTierMetric({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="w-4 h-4 rounded-lg shadow-xl shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}40` }} />
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-2xl font-black text-white mt-1 italic tracking-tighter">{value}</p>
            </div>
        </div>
    );
}

function TacticalRiskMonitor({ registryData, onIntervene }: any) {
  const highRisk = registryData?.data?.filter((i: any) => i.currentPoICScore < 75) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 px-4 bg-red-600/5 py-4 border-l-4 border-red-600 rounded-r-3xl">
        <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
        <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Critical Security Watchlist</h3>
            <p className="text-[10px] font-black text-red-600/60 uppercase tracking-widest">{highRisk.length} authorities with degraded integrity scores</p>
        </div>
      </div>
      <div className="grid gap-6">
        <AnimatePresence>
            {highRisk.length > 0 ? highRisk.map((inst: any, idx: number) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={inst.id}
                className="flex flex-col xl:flex-row xl:items-center justify-between p-8 bg-gray-900/60 hover:bg-gray-900 rounded-[2.5rem] border border-red-500/10 transition-all group overflow-hidden relative shadow-2xl"
              >
                <div className="flex items-center gap-8 relative z-10">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-red-600/10 flex items-center justify-center text-red-500 font-black text-3xl border border-red-500/10 group-hover:bg-red-600 group-hover:text-white transition-all duration-700 shadow-xl">
                    {inst.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{inst.name}</p>
                    <div className="flex flex-wrap items-center gap-6 mt-2">
                        <span className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                            CRITICAL INTEGRITY LOW
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono italic tracking-widest">{inst.walletAddress}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between xl:justify-end gap-12 mt-8 xl:mt-0 relative z-10">
                  <div className="text-right">
                    <p className="text-5xl font-black text-red-600 tracking-tighter italic">{inst.currentPoICScore}<span className="text-xs ml-2 opacity-30 not-italic">SCORE</span></p>
                    <p className="text-[9px] text-gray-700 uppercase tracking-[0.4em] font-black mt-1">PoIC Degradation Point</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => onIntervene?.(inst)}
                    className="h-14 px-10 border-red-500/20 bg-gray-950 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl"
                  >
                    INTERVENE
                  </Button>
                </div>
                {/* Background Danger Accent */}
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )) : (
              <div className="p-24 border-2 border-dashed border-gray-900 rounded-[4rem] text-center space-y-6 bg-gray-900/10">
                <ShieldCheck className="w-16 h-16 mx-auto text-green-600/20" />
                <div>
                   <p className="text-sm font-black uppercase tracking-[0.5em] text-gray-700">All Systems Nominal</p>
                   <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest">Network integrity verified across all 58 nodes</p>
                </div>
              </div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResourceTacticalBar({ label, value, color }: { label: string, value: number, color: string }) {
  const colorMap: any = {
    blue: "bg-blue-600", indigo: "bg-indigo-600", green: "bg-green-600", amber: "bg-amber-600", purple: "bg-purple-600"
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-2">
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">{label}</span>
        <span className="text-2xl font-black text-white italic tracking-tighter">{value}%</span>
      </div>
      <div className="h-3 bg-gray-950 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 2, ease: "circOut" }}
          className={cn("h-full rounded-full transition-all duration-1000", colorMap[color])}
          style={{ boxShadow: `0 0 20px ${colorMap[color].split('-')[1]}60` }}
        />
      </div>
    </div>
  );
}

function TacticalOversightStat({ label, value, color }: any) {
  const colors: any = {
    blue: "text-blue-500", indigo: "text-indigo-500", green: "text-green-500", purple: "text-purple-500"
  };
  return (
    <div className="bg-gray-900/60 p-8 rounded-[2rem] border border-gray-800 shadow-2xl backdrop-blur-md group hover:bg-gray-800 transition-all !bg-gray-900/60">
      <p className="text-[9px] uppercase tracking-[0.4em] font-black text-gray-600 mb-2 group-hover:text-gray-400 transition-colors">{label}</p>
      <p className={cn("text-3xl font-black italic tracking-tighter", colors[color])}>{value}</p>
    </div>
  );
}

function ActionTacticalButton({
  icon: Icon,
  label,
  desc,
  color,
  onClick,
  loading,
}: any) {
    const isRed = color === 'red';
    const isBlue = color === 'blue';

    return (
        <button
            onClick={onClick}
            disabled={Boolean(loading)}
            className={cn(
            "flex items-center gap-6 p-7 rounded-[2rem] border transition-all text-left group relative overflow-hidden",
            loading && "opacity-70 cursor-not-allowed",
            isRed ? "bg-red-600/5 border-red-500/20 hover:bg-red-600 hover:border-red-600 shadow-red-600/10" : 
            isBlue ? "bg-blue-600/10 border-blue-500/20 hover:bg-blue-600 hover:border-blue-600 shadow-blue-600/10" :
            "bg-gray-900 border-gray-800 hover:bg-white hover:border-white shadow-xl"
        )}>
            <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                isRed ? "bg-red-600/20 text-red-500 group-hover:bg-white/20 group-hover:text-white" :
                isBlue ? "bg-blue-600/20 text-blue-500 group-hover:bg-white/20 group-hover:text-white" :
                "bg-gray-800 text-gray-400 group-hover:bg-gray-950 group-hover:text-white shadow-xl"
            )}>
                {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Icon className="w-7 h-7" />}
            </div>
            <div className="relative z-10">
                <p className={cn(
                    "text-sm font-black uppercase tracking-widest",
                    isRed || isBlue ? "text-white" : "text-gray-200 group-hover:text-gray-950"
                )}>{label}</p>
                <p className={cn(
                    "text-[10px] font-bold mt-1 uppercase tracking-widest",
                    isRed || isBlue ? "text-white/60" : "text-gray-500 group-hover:text-gray-600"
                )}>{desc}</p>
            </div>
            {/* Gloss Effect */}
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[45deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
        </button>
    );
}

function ChartLegend({ label, color }: { label: string, color: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
        </div>
    );
}

function getLogIcon(action: string) {
    if (action.includes('PROPOSAL')) return <FileCheck className="w-6 h-6 text-blue-500" />;
    if (action.includes('VOTE')) return <Users className="w-6 h-6 text-indigo-500" />;
    if (action.includes('POIC')) return <TrendingUp className="w-6 h-6 text-purple-500" />;
    if (action.includes('AUTH')) return <Key className="w-6 h-6 text-amber-500" />;
    return <Database className="w-6 h-6 text-gray-500" />;
}

function getLogStyle(action: string) {
    if (action.includes('PROPOSAL')) return "bg-blue-600/10 border-blue-600/20 text-blue-500";
    if (action.includes('VOTE')) return "bg-indigo-600/10 border-indigo-600/20 text-indigo-500";
    if (action.includes('POIC')) return "bg-purple-600/10 border-purple-600/20 text-purple-500";
    if (action.includes('AUTH')) return "bg-amber-600/10 border-amber-600/20 text-amber-500";
    return "bg-gray-800 border-gray-700 text-gray-400";
}

interface AdminGovernanceDashboardProps {
  embedded?: boolean;
}

export default function AdminGovernanceDashboard({ embedded = false }: AdminGovernanceDashboardProps) {
  if (embedded) {
    return <AdminGovernanceDashboardContent />;
  }

  return (
    <AdminGuard>
      <AdminGovernanceDashboardContent />
    </AdminGuard>
  );
}
