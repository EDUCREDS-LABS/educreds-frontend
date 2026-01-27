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
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  useSystemMetrics,
  useAuditLog,
  useSystemStatus,
  useInstitutionRegistry,
} from '@/hooks/useGovernance';

interface AdminMetrics {
  totalInstitutions: number;
  activeInstitutions: number;
  totalCredentials: number;
  totalRevocations: number;
  avgPoICScore: number;
  highRiskCount: number;
  pendingReviews: number;
  systemHealth: number;
}

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
}

interface SystemStatus {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  lastCheck: string;
  uptime: string;
}

// Mock data
const mockMetrics: AdminMetrics = {
  totalInstitutions: 56,
  activeInstitutions: 48,
  totalCredentials: 12540,
  totalRevocations: 156,
  avgPoICScore: 75.4,
  highRiskCount: 3,
  pendingReviews: 7,
  systemHealth: 98.5,
};

const credentialTrendData = [
  { month: 'Jan', issued: 420, revoked: 8 },
  { month: 'Feb', issued: 580, revoked: 11 },
  { month: 'Mar', issued: 680, revoked: 14 },
  { month: 'Apr', issued: 920, revoked: 18 },
  { month: 'May', issued: 1240, revoked: 22 },
  { month: 'Jun', issued: 1560, revoked: 25 },
];

const institutionDistribution = [
  { name: 'A+ (85+)', value: 18, color: '#10b981' },
  { name: 'A (75-84)', value: 22, color: '#3b82f6' },
  { name: 'B+ (65-74)', value: 12, color: '#f59e0b' },
  { name: 'B (55-64)', value: 3, color: '#ef4444' },
  { name: 'C (<55)', value: 1, color: '#8b5cf6' },
];

const auditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'Institution Admitted',
    actor: 'Governance DAO',
    target: 'Stanford University',
    timestamp: '2024-01-22T18:30:00Z',
    details: 'Progressive automation: Case A approval (score 89)',
    severity: 'info',
  },
  {
    id: '2',
    action: 'Dispute Escalated',
    actor: 'Monitoring Service',
    target: 'TechCorp Education',
    timestamp: '2024-01-22T16:15:00Z',
    details: 'Anomalous issuance spike detected (450% increase)',
    severity: 'warning',
  },
  {
    id: '3',
    action: 'PoIC Score Updated',
    actor: 'PoIC Scoring Service',
    target: 'University X',
    timestamp: '2024-01-22T14:00:00Z',
    details: 'Score decreased from 52 to 48 due to high revocation rate',
    severity: 'warning',
  },
  {
    id: '4',
    action: 'Credential Revoked',
    actor: 'Institution Admin',
    target: 'Various Students',
    timestamp: '2024-01-22T10:30:00Z',
    details: 'Batch revocation: 12 credentials (fraud investigation)',
    severity: 'error',
  },
  {
    id: '5',
    action: 'Proposal Executed',
    actor: 'Governance DAO',
    target: 'Policy Update',
    timestamp: '2024-01-21T22:00:00Z',
    details: 'Issuance limit adjustment for institution class 2',
    severity: 'info',
  },
];

const systemStatus: SystemStatus[] = [
  {
    component: 'Smart Contract Layer',
    status: 'healthy',
    lastCheck: '2 minutes ago',
    uptime: '99.9%',
  },
  {
    component: 'PoIC Scoring Engine',
    status: 'healthy',
    lastCheck: '5 minutes ago',
    uptime: '100%',
  },
  {
    component: 'Monitoring Service',
    status: 'healthy',
    lastCheck: '1 minute ago',
    uptime: '99.8%',
  },
  {
    component: 'Quack AI Analysis',
    status: 'warning',
    lastCheck: '8 minutes ago',
    uptime: '98.2%',
  },
  {
    component: 'Governance DAO',
    status: 'healthy',
    lastCheck: '3 minutes ago',
    uptime: '99.95%',
  },
];

export default function AdminGovernanceDashboard() {
  const { toast } = useToast();
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [showAuditDetail, setShowAuditDetail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [auditPage, setAuditPage] = useState(1);
  const [institutionPage, setInstitutionPage] = useState(1);

  // Fetch data using react-query hooks
  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
  } = useSystemMetrics();

  const {
    data: auditData,
    isLoading: auditLoading,
    error: auditError,
  } = useAuditLog(auditPage, 20);

  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
  } = useSystemStatus();

  const {
    data: registryData,
    isLoading: registryLoading,
    error: registryError,
  } = useInstitutionRegistry(institutionPage, 10);

  // Handle errors with toast notifications
  useEffect(() => {
    if (metricsError) {
      toast({
        title: 'Error',
        description: 'Failed to load system metrics',
        variant: 'destructive',
      });
    }
  }, [metricsError, toast]);

  const metrics = metricsData || mockMetrics;
  const auditLogs = auditData?.data || [];
  const institutions = registryData?.data || [];
  const systemStatus = statusData?.components || [];

  return (
    <div className="w-full space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Governance Control Panel</h1>
        <p className="text-muted-foreground">
          System oversight, institutional monitoring, and governance administration
        </p>
      </div>

      {/* Error Alert */}
      {(metricsError || auditError || statusError || registryError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load admin data. Please refresh or try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* System Health Alert */}
      {metrics.systemHealthScore < 95 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            System health at {Math.round(metrics.systemHealthScore)}%. Some services may be degraded.
            <Button variant="link" className="ml-2 h-auto p-0">
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
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
            <AdminMetricCard
              title="Total Institutions"
              value={metrics.totalInstitutions}
              active={metrics.totalInstitutions}
              icon={Users}
              trend="+3 this month"
            />
            <AdminMetricCard
              title="Total Proposals"
              value={metrics.totalProposals}
              subtext={`Active: ${metrics.activeProposals}`}
              icon={Activity}
              trend="+5 this week"
            />
            <AdminMetricCard
              title="Avg PoIC Score"
              value={Math.round(metrics.averagePoICScore * 10) / 10}
              subtext="Institutional credibility"
              icon={TrendingUp}
              trend="+0.2 this month"
            />
            <AdminMetricCard
              title="System Health"
              value={`${Math.round(metrics.systemHealthScore)}%`}
              subtext="Overall operational status"
              icon={Shield}
              className={metrics.systemHealthScore < 95 ? 'border-yellow-200 bg-yellow-50' : ''}
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Credential Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Credential Issuance & Revocation Trend</CardTitle>
                <CardDescription>Last 6 months activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={credentialTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="issued" fill="#3b82f6" name="Issued" />
                    <Bar dataKey="revoked" fill="#ef4444" name="Revoked" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* PoIC Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Institutional Distribution by PoIC Grade</CardTitle>
                <CardDescription>Credit tier breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={institutionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {institutionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* High-Risk Institutions Alert */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                High-Risk Institutions Requiring Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'UniversityX', poic: 48, reason: 'High revocation rate (22.3%)', action: 'Review' },
                { name: 'TechCorp Education', poic: 62, reason: 'Anomalous issuance spike detected', action: 'Investigate' },
                { name: 'Global Creds Inc', poic: 55, reason: 'Low employer satisfaction (45/100)', action: 'Audit' },
              ].map((inst, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
                  <div>
                    <p className="font-medium">{inst.name}</p>
                    <p className="text-sm text-muted-foreground">{inst.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">{inst.poic}</p>
                      <p className="text-xs text-muted-foreground">PoIC</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedInstitution(inst.name)}>
                      {inst.action}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Institutions Tab */}
        <TabsContent value="institutions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Institutional Governance Registry</CardTitle>
                <CardDescription>All institutions with real-time PoIC scores</CardDescription>
              </div>
              <Button>Export Registry</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Stanford University', poic: 94, status: 'Active', grade: 'A+', issueCount: 450, revocationRate: 1.2 },
                  { name: 'MIT', poic: 91, status: 'Active', grade: 'A+', issueCount: 380, revocationRate: 0.8 },
                  { name: 'Harvard University', poic: 93, status: 'Active', grade: 'A+', issueCount: 520, revocationRate: 1.5 },
                  { name: 'Tech Institute', poic: 72, status: 'Active', grade: 'B+', issueCount: 150, revocationRate: 8.5 },
                  { name: 'UniversityX', poic: 48, status: 'Monitored', grade: 'C', issueCount: 85, revocationRate: 22.3 },
                ].map((inst, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 cursor-pointer transition"
                    onClick={() => setSelectedInstitution(inst.name)}
                  >
                    <div>
                      <p className="font-semibold">{inst.name}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Issued: {inst.issueCount}</span>
                        <span>Revoked: {inst.revocationRate}%</span>
                        <span className="font-medium">Status: {inst.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{inst.poic}</p>
                        <p className="text-xs text-muted-foreground">PoIC</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full font-semibold text-white text-sm ${
                        inst.poic >= 85 ? 'bg-green-500' :
                        inst.poic >= 75 ? 'bg-blue-500' :
                        inst.poic >= 65 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}>
                        {inst.grade}
                      </div>
                      <Badge variant={inst.status === 'Monitored' ? 'destructive' : 'default'}>
                        {inst.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Governance Audit Log</CardTitle>
                <CardDescription>All governance actions and system events</CardDescription>
              </div>
              <Button variant="outline">Export Log</Button>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 rounded-lg border p-4 hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => setShowAuditDetail(log.id)}
                    >
                      <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                        log.action === 'CREATED' ? 'bg-blue-500' :
                        log.action === 'UPDATED' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{log.action}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">{log.resourceType}</span> → <span className="font-medium">{log.resourceId}</span>
                        </p>
                        <p className="text-sm mt-2">By: {log.userId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {auditData && auditData.pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    disabled={auditPage === 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {auditPage} of {auditData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={auditPage === auditData.pagination.totalPages}
                    onClick={() => setAuditPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Status Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Governance System Components Status</CardTitle>
              <CardDescription>Real-time health monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(statusData?.components || {}).map(([key, component]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-semibold">{key}</p>
                        <p className="text-sm text-muted-foreground">
                          {component.message || 'Monitoring active'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`h-3 w-3 rounded-full ${
                          component.status === 'healthy' ? 'bg-green-500' :
                          component.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <Badge variant={
                          component.status === 'healthy' ? 'default' :
                          component.status === 'warning' ? 'secondary' :
                          'destructive'
                        }>
                          {component.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Governance System Configuration</CardTitle>
              <CardDescription>Core parameters and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">PoIC High-Risk Threshold</p>
                  <p className="text-2xl font-bold mt-2">60</p>
                  <Button variant="outline" size="sm" className="mt-3">Change</Button>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Monitoring Interval</p>
                  <p className="text-2xl font-bold mt-2">6 hours</p>
                  <Button variant="outline" size="sm" className="mt-3">Change</Button>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Veto Window Duration</p>
                  <p className="text-2xl font-bold mt-2">72 hours</p>
                  <Button variant="outline" size="sm" className="mt-3">Change</Button>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Auto-Approval Threshold</p>
                  <p className="text-2xl font-bold mt-2">85</p>
                  <Button variant="outline" size="sm" className="mt-3">Change</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Institution Detail Modal */}
      {selectedInstitution && (
        <InstitutionDetailModal
          institutionName={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
        />
      )}
    </div>
  );
}

function AdminMetricCard({
  title,
  value,
  active,
  subtext,
  icon: Icon,
  trend,
  className = '',
}: {
  title: string;
  value: string | number;
  active?: number;
  subtext?: string;
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
            <p className="text-3xl font-bold mt-2">{value}</p>
            {active !== undefined && (
              <p className="text-sm text-green-600 font-medium mt-1">{active} active</p>
            )}
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            )}
            {trend && <p className="text-xs text-green-600 font-medium mt-1">{trend}</p>}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function InstitutionDetailModal({
  institutionName,
  onClose,
}: {
  institutionName: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{institutionName}</DialogTitle>
          <DialogDescription>Detailed institutional governance profile</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="poic">PoIC Breakdown</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-muted-foreground">PoIC Score</p>
                <p className="text-3xl font-bold mt-2">87</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-600">Grade</p>
                <p className="text-3xl font-bold mt-2 text-green-600">A+</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-muted-foreground">Total Issued</p>
                <p className="text-2xl font-bold mt-2">1,250</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-muted-foreground">Revocation Rate</p>
                <p className="text-2xl font-bold mt-2">2.1%</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="poic" className="space-y-4">
            {[
              { label: 'Issuance Accuracy', value: 90, weight: '30%' },
              { label: 'Revocation Rate', value: 85, weight: '20%' },
              { label: 'Employer Feedback', value: 88, weight: '20%' },
              { label: 'Governance Behavior', value: 92, weight: '15%' },
              { label: 'Audit Outcomes', value: 86, weight: '10%' },
              { label: 'AI Risk Score', value: 8, weight: '5%' },
            ].map((component, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{component.label}</span>
                  <span className="text-xs text-muted-foreground">({component.weight})</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${component.value}%` }}
                  />
                </div>
                <p className="text-sm font-semibold mt-1">{component.value}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="actions" className="space-y-3">
            <Button className="w-full" variant="default">
              Monitor PoIC Trend
            </Button>
            <Button className="w-full" variant="outline">
              Review Issuance History
            </Button>
            <Button className="w-full" variant="outline">
              Check Audit Status
            </Button>
            <Button className="w-full" variant="destructive">
              Initiate Investigation
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
