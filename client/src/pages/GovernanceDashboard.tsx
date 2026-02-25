import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
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
import {
  AlertCircle,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Shield,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useProposals,
  useInstitutions,
  useGovernanceSummary,
  useProposalsSummary,
} from '@/hooks/useGovernance';
import { useProposalUpdates } from '@/hooks/useProposalSubscription';

interface Proposal {
  id: string;
  title: string;
  institution: string;
  status: 'pending' | 'active' | 'passed' | 'rejected' | 'queued';
  legitimacyScore: number;
  votesFor: number;
  votesAgainst: number;
  votingPower: number;
  createdAt: string;
  vetoWindow?: string;
  riskFlags?: string[];
}

interface Institution {
  id: string;
  name: string;
  poicScore: number;
  issuanceCount: number;
  revocationRate: number;
  employerFeedback: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
  scoreBreakdown?: {
    issuanceAccuracy: number;
    revocationRate: number;
    employerFeedback: number;
    governanceBehavior: number;
    auditOutcomes: number;
    aiRiskScore: number;
  };
}

interface GovernanceMetrics {
  totalProposals: number;
  activeProposals: number;
  approvalRate: number;
  averageVotingPower: number;
  totalInstitutions: number;
  highRiskInstitutions: number;
}

// Mock data - replace with API calls
const mockProposals: Proposal[] = [
  {
    id: '1',
    title: 'Admission Application: University of Technology',
    institution: 'University of Technology',
    status: 'active',
    legitimacyScore: 87,
    votesFor: 450,
    votesAgainst: 30,
    votingPower: 480,
    createdAt: '2024-01-20T10:00:00Z',
    vetoWindow: '2 days remaining',
  },
  {
    id: '2',
    title: 'PoIC Score Adjustment: Digital Arts Institute',
    institution: 'Digital Arts Institute',
    status: 'pending',
    legitimacyScore: 65,
    votesFor: 0,
    votesAgainst: 0,
    votingPower: 0,
    createdAt: '2024-01-22T14:30:00Z',
    riskFlags: ['anomalous_issuance_spike', 'low_verification_rate'],
  },
  {
    id: '3',
    title: 'Dispute Resolution: Business School Corp',
    institution: 'Business School Corp',
    status: 'queued',
    legitimacyScore: 42,
    votesFor: 350,
    votesAgainst: 280,
    votingPower: 630,
    createdAt: '2024-01-15T09:00:00Z',
    riskFlags: ['high_revocation_rate'],
  },
];

const mockInstitutions: Institution[] = [
  {
    id: '1',
    name: 'Stanford University',
    poicScore: 94,
    issuanceCount: 1250,
    revocationRate: 2.1,
    employerFeedback: 92,
    riskLevel: 'low',
    lastUpdated: '2024-01-22T18:00:00Z',
    scoreBreakdown: {
      issuanceAccuracy: 95,
      revocationRate: 94,
      employerFeedback: 92,
      governanceBehavior: 96,
      auditOutcomes: 90,
      aiRiskScore: 5,
    },
  },
  {
    id: '2',
    name: 'Tech Institute',
    poicScore: 72,
    issuanceCount: 450,
    revocationRate: 8.5,
    employerFeedback: 68,
    riskLevel: 'medium',
    lastUpdated: '2024-01-22T18:00:00Z',
    scoreBreakdown: {
      issuanceAccuracy: 75,
      revocationRate: 70,
      employerFeedback: 68,
      governanceBehavior: 74,
      auditOutcomes: 72,
      aiRiskScore: 15,
    },
  },
  {
    id: '3',
    name: 'UniversityX',
    poicScore: 48,
    issuanceCount: 200,
    revocationRate: 22.3,
    employerFeedback: 45,
    riskLevel: 'high',
    lastUpdated: '2024-01-22T18:00:00Z',
    scoreBreakdown: {
      issuanceAccuracy: 50,
      revocationRate: 45,
      employerFeedback: 45,
      governanceBehavior: 48,
      auditOutcomes: 52,
      aiRiskScore: 35,
    },
  },
];

const scoreHistoryData = [
  { date: '2024-01-01', avgScore: 72, institutionCount: 45 },
  { date: '2024-01-05', avgScore: 73, institutionCount: 48 },
  { date: '2024-01-10', avgScore: 74, institutionCount: 50 },
  { date: '2024-01-15', avgScore: 75, institutionCount: 52 },
  { date: '2024-01-20', avgScore: 76, institutionCount: 54 },
  { date: '2024-01-22', avgScore: 75, institutionCount: 56 },
];

const poicComponentsData = [
  { name: 'Issuance Accuracy', value: 30 },
  { name: 'Revocation Rate', value: 20 },
  { name: 'Employer Feedback', value: 20 },
  { name: 'Governance Behavior', value: 15 },
  { name: 'Audit Outcomes', value: 10 },
  { name: 'AI Risk Score', value: 5 },
];

// Use CSS variable references instead of hardcoded hex values
const COLORS = [
  'hsl(var(--primary))',           // Blue
  'hsl(var(--success))',           // Green
  'hsl(var(--warning))',           // Amber
  'hsl(var(--destructive))',       // Red
  'hsl(var(--accent))',            // Purple
  'hsl(var(--chart-5))',           // Pink
];

export default function GovernanceDashboard() {
  const { toast } = useToast();
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [proposalPage, setProposalPage] = useState(1);
  const [institutionPage, setInstitutionPage] = useState(1);

  // Fetch data using react-query hooks
  const {
    data: proposalsData,
    isLoading: proposalsLoading,
    error: proposalsError,
  } = useProposals(proposalPage, 10);
  
  const {
    data: institutionsData,
    isLoading: institutionsLoading,
    error: institutionsError,
  } = useInstitutions(institutionPage, 10);

  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
  } = useGovernanceSummary();

  // Subscribe to real-time updates
  const { updates: proposalUpdates, isLive } = useProposalUpdates((update) => {
    toast({
      title: 'Live Update',
      description: `Proposal "${update.id}" has been updated`,
      duration: 3000,
    });
  });

  const proposals = proposalsData?.data || [];
  const institutions = institutionsData?.data || [];

  // Calculate metrics from API data
  const metrics = {
    totalProposals: proposalsData?.pagination?.total || 0,
    activeProposals: proposals.filter((p: any) => p.state === 'ACTIVE').length,
    approvalRate: 78,
    averageVotingPower: 480,
    totalInstitutions: institutionsData?.pagination?.total || 0,
    highRiskInstitutions: 0,
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return { label: 'A+', color: 'bg-green-500' };
    if (score >= 75) return { label: 'A', color: 'bg-green-400' };
    if (score >= 65) return { label: 'B+', color: 'bg-blue-500' };
    if (score >= 55) return { label: 'B', color: 'bg-yellow-500' };
    return { label: 'C', color: 'bg-red-500' };
  };

  const getRiskBadge = (riskLevel: string) => {
    const config = {
      low: { label: 'Low Risk', variant: 'default', className: 'bg-green-100 text-green-900' },
      medium: { label: 'Medium Risk', variant: 'secondary', className: 'bg-yellow-100 text-yellow-900' },
      high: { label: 'High Risk', variant: 'destructive', className: 'bg-red-100 text-red-900' },
    };
    return config[riskLevel as keyof typeof config];
  };

  return (
    <div className="w-full space-y-8 p-6">
      {/* Header with Live Status */}
      <div className="space-y-2 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EduCreds Governance Dashboard</h1>
          <p className="text-muted-foreground">
            AI-Assisted DAO for Institution Admission, PoIC Scoring & Dispute Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <Badge className="bg-green-500 animate-pulse">
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {(proposalsError || institutionsError || summaryError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load governance data. Please refresh or try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {summaryLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <MetricCard
              title="Total Proposals"
              value={metrics.totalProposals}
              description="All governance proposals"
              icon={Activity}
              trend="+3 this week"
            />
            <MetricCard
              title="Active Voting"
              value={metrics.activeProposals}
              description="Currently voting"
              icon={Zap}
              trend="72h average"
            />
            <MetricCard
              title="Approval Rate"
              value={`${metrics.approvalRate}%`}
              description="Historical approval"
              icon={CheckCircle}
              trend="+2% this month"
            />
            <MetricCard
              title="Avg Voting Power"
              value={metrics.averageVotingPower}
              description="Mean PoIC weight"
              icon={TrendingUp}
              trend="480-630 range"
            />
            <MetricCard
              title="Institutions"
              value={metrics.totalInstitutions}
              description="Admitted to network"
              icon={Users}
              trend="+8 onboarded"
            />
            <MetricCard
              title="Risk Alerts"
              value={metrics.highRiskInstitutions}
              description="High-risk institutions"
              icon={AlertCircle}
              className="border-red-200 bg-red-50"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Active Proposals */}
            <Card>
              <CardHeader>
                <CardTitle>Active Proposals (PoIC-Weighted Voting)</CardTitle>
                <CardDescription>Real-time governance voting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposals
                  .filter((p) => p.status === 'active' || p.status === 'pending')
                  .slice(0, 3)
                  .map((proposal) => (
                    <ProposalListItem
                      key={proposal.id}
                      proposal={proposal}
                      onSelect={() => setSelectedProposal(proposal)}
                    />
                  ))}
              </CardContent>
            </Card>

            {/* PoIC Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>PoIC Score Components</CardTitle>
                <CardDescription>Weighting of the credibility formula</CardDescription>
              </CardHeader>
              <CardContent className="w-full">
               <ResponsiveContainer width="100%" height={250} minHeight={200}>
                    <PieChart>
                     <Pie
                       data={poicComponentsData}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={({ name, value }) => `${name} (${value}%)`}
                       outerRadius={80}
                       fill="hsl(var(--primary))"
                       dataKey="value"
                     >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Risk Alerts */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Active Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {proposals
                .filter((p) => p.riskFlags && p.riskFlags.length > 0)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between rounded-lg border border-yellow-200 bg-white p-3"
                  >
                    <div>
                      <p className="font-medium">{p.institution}</p>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {p.riskFlags?.map((flag) => (
                          <Badge key={flag} variant="outline" className="text-xs">
                            {flag.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProposal(p)}
                    >
                      Review
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Governance Proposals</CardTitle>
                <CardDescription>All proposals with PoIC-weighted voting status</CardDescription>
              </div>
              <Button>New Proposal</Button>
            </CardHeader>
            <CardContent>
              {proposalsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
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
                    <div
                      key={proposal.id}
                      className={`flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 cursor-pointer transition ${
                        proposalUpdates.some((u) => u.id === proposal.id) ? 'border-green-500 bg-green-50' : ''
                      }`}
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{proposal.title}</h3>
                        <p className="text-sm text-muted-foreground">Proposed by {proposal.proposerAddress?.slice(0, 10)}...</p>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-2xl font-bold">{Math.round(proposal.legitimacyScore)}</div>
                          <div className="text-xs text-muted-foreground">Legitimacy</div>
                        </div>

                        <Badge
                          variant={
                            proposal.state === 'ACTIVE'
                              ? 'default'
                              : proposal.state === 'PENDING'
                                ? 'secondary'
                                : proposal.state === 'EXECUTED'
                                  ? 'outline'
                                  : 'destructive'
                          }
                        >
                          {proposal.state === 'ACTIVE' && <Zap className="h-3 w-3 mr-1" />}
                          {proposal.state === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                          {proposal.state === 'EXECUTED' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {proposal.state === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                          {proposal.state}
                        </Badge>
                      </div>
                    </div>
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

        {/* Institutions Tab */}
        <TabsContent value="institutions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Institutional PoIC Scores</CardTitle>
              <CardDescription>Real-time credibility assessment of all admitted institutions</CardDescription>
            </CardHeader>
            <CardContent>
              {institutionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : institutions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No institutions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {institutions.map((institution: any) => (
                    <div
                      key={institution.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => setSelectedInstitution(institution)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{institution.name}</h3>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Status: {institution.verificationStatus}</span>
                          <span>Created: {new Date(institution.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-3xl font-bold">--</div>
                          <div className="text-xs text-muted-foreground">PoIC Score</div>
                        </div>

                        <Badge variant="secondary">{institution.verificationStatus}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {institutionsData && institutionsData.pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    disabled={institutionPage === 1}
                    onClick={() => setInstitutionPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {institutionPage} of {institutionsData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={institutionPage === institutionsData.pagination.totalPages}
                    onClick={() => setInstitutionPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PoIC Score Trend</CardTitle>
              <CardDescription>Average institutional credibility over time</CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              <ResponsiveContainer width="100%" height={300} minHeight={250}>
                <LineChart data={scoreHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" label={{ value: 'Avg PoIC Score', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Institution Count', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" name="Avg PoIC Score" />
                  <Line yAxisId="right" type="monotone" dataKey="institutionCount" stroke="hsl(var(--success))" name="Institution Count" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk vs. Issuance Volume</CardTitle>
              <CardDescription>Correlation analysis of institutional risk and activity</CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              <ResponsiveContainer width="100%" height={300} minHeight={250}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="poicScore" name="PoIC Score" type="number" />
                  <YAxis dataKey="issuanceCount" name="Issuance Count" type="number" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter
                    name="Institutions"
                    data={institutions}
                    fill="hsl(var(--primary))"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Proposal Detail Modal */}
      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}

      {/* Institution Detail Modal */}
      {selectedInstitution && (
        <InstitutionDetailModal
          institution={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
        />
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className = '',
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
            {trend && <p className="text-xs text-green-600 font-medium mt-1">{trend}</p>}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function ProposalListItem({
  proposal,
  onSelect,
}: {
  proposal: Proposal;
  onSelect: () => void;
}) {
  return (
    <div
      className="flex items-start justify-between rounded-lg border p-3 hover:bg-slate-50 cursor-pointer transition"
      onClick={onSelect}
    >
      <div className="flex-1">
        <p className="font-medium text-sm">{proposal.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{proposal.institution}</p>
        {proposal.vetoWindow && (
          <p className="text-xs text-yellow-600 font-medium mt-1">Veto: {proposal.vetoWindow}</p>
        )}
      </div>
      <div className="text-right">
        <p className="font-semibold text-sm">{proposal.legitimacyScore}</p>
        <Badge variant="secondary" className="text-xs mt-1">{proposal.status}</Badge>
      </div>
    </div>
  );
}

function ProposalDetailModal({
  proposal,
  onClose,
}: {
  proposal: Proposal;
  onClose: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{proposal.title}</DialogTitle>
          <DialogDescription>{proposal.institution}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Proposal Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Legitimacy Score</p>
              <p className="text-3xl font-bold mt-2">{proposal.legitimacyScore}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-xl font-bold mt-2 capitalize">{proposal.status}</p>
            </div>
          </div>

          {/* Voting Status */}
          {proposal.votingPower > 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-sm">Voting Status (PoIC-Weighted)</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>For: {proposal.votesFor}</span>
                    <span>{Math.round((proposal.votesFor / proposal.votingPower) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(proposal.votesFor / proposal.votingPower) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Against: {proposal.votesAgainst}</span>
                    <span>{Math.round((proposal.votesAgainst / proposal.votingPower) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${(proposal.votesAgainst / proposal.votingPower) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total Voting Power: {proposal.votingPower}</p>
            </div>
          )}

          {/* Risk Flags */}
          {proposal.riskFlags && proposal.riskFlags.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-sm">Risk Flags</p>
              <div className="flex flex-wrap gap-2">
                {proposal.riskFlags.map((flag) => (
                  <Badge key={flag} variant="outline">
                    {flag.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {proposal.status === 'pending' && (
            <div className="flex gap-3">
              <Button className="flex-1" variant="outline">
                Vote For
              </Button>
              <Button className="flex-1" variant="outline">
                Vote Against
              </Button>
              <Button className="flex-1" variant="outline">
                Abstain
              </Button>
            </div>
          )}

          {proposal.status === 'active' && (
            <div className="flex gap-3">
              <Button className="flex-1" variant="outline">
                Vote For
              </Button>
              <Button className="flex-1" variant="outline">
                Vote Against
              </Button>
              <Button className="flex-1" variant="outline">
                Abstain
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InstitutionDetailModal({
  institution,
  onClose,
}: {
  institution: Institution;
  onClose: () => void;
}) {
  const badge = institution.poicScore >= 85
    ? { label: 'A+', color: 'bg-green-500' }
    : institution.poicScore >= 75
      ? { label: 'A', color: 'bg-green-400' }
      : institution.poicScore >= 65
        ? { label: 'B+', color: 'bg-blue-500' }
        : institution.poicScore >= 55
          ? { label: 'B', color: 'bg-yellow-500' }
          : { label: 'C', color: 'bg-red-500' };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{institution.name}</DialogTitle>
          <DialogDescription>Institutional Credibility Profile</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* PoIC Score Overview */}
          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-50 to-slate-50 p-6">
            <div>
              <p className="text-sm text-muted-foreground">Proof of Institutional Credibility</p>
              <p className="text-4xl font-bold mt-2">{institution.poicScore}</p>
            </div>
            <div className={`h-24 w-24 rounded-full flex items-center justify-center font-bold text-white text-3xl ${badge.color}`}>
              {badge.label}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Total Issued</p>
              <p className="text-2xl font-bold mt-2">{institution.issuanceCount}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-600">Revocation Rate</p>
              <p className="text-2xl font-bold mt-2 text-red-600">{institution.revocationRate}%</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600">Employer Feedback</p>
              <p className="text-2xl font-bold mt-2 text-green-600">{institution.employerFeedback}/100</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-yellow-600">Risk Level</p>
              <p className="text-2xl font-bold mt-2 text-yellow-600 capitalize">{institution.riskLevel}</p>
            </div>
          </div>

          {/* Score Breakdown */}
          {institution.scoreBreakdown && (
            <div className="space-y-3">
              <p className="font-semibold text-sm">PoIC Score Components</p>
              {Object.entries(institution.scoreBreakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(institution.lastUpdated).toLocaleString()}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="default">Monitor PoIC Trend</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
