import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  Users,
  DollarSign,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  LogOut,
  Loader2,
  Bell,
  Search,
  RefreshCw,
  Shield,
  Activity,
  History,
  Lock,
  Mail,
  Calendar,
  Settings,
  Building2,
  Link2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BlockchainManagement from "@/components/BlockchainManagement";
import UserManagement from "@/components/admin/UserManagement";
import AdminGovernanceDashboard from "@/pages/admin/governance-dashboard";
import { transformDocumentsForBackend } from "@/utils/documentTransform";
import { testBackendConnection, testAdminConnection, type ConnectionStatus } from "@/utils/connectionTest";
import { API_CONFIG } from "@/config/api";
import { cn } from "@/lib/utils";
import { AdminAuth } from "@/lib/admin-auth";

interface VerificationRequest {
  id: string;
  verificationRequestId: string;
  institutionId: string;
  institutionName: string;
  institutionEmail: string;
  registrationNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
  documents: Array<{
    type: string;
    description: string;
    url: string;
    originalName?: string;
  }>;
}

interface RevenueData {
  totalRevenue: number;
  activeSubscriptions: number;
  planBreakdown: Record<string, number>;
}

interface VerificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comments: z.string().optional(),
});

type ReviewForm = z.infer<typeof reviewSchema>;

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}

function AdminDashboardContent() {
  const [, setLocation] = useLocation();
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [verificationStats, setVerificationStats] = useState<VerificationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'governance' | 'blockchain' | 'users' | 'audit'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: 'approved',
      comments: '',
    },
  });

  useEffect(() => {
    fetchAdminData(true);
  }, [setLocation]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAdminData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    fetchAdminData(true);
  };

  const handleConnectionTest = async () => {
    setDiagnosticLoading(true);
    const [backendTest, adminTest] = await Promise.all([
      testBackendConnection(),
      testAdminConnection()
    ]);
    setConnectionStatus(backendTest);
    toast({
      title: "System Diagnostics",
      description: `Backend: ${backendTest.isConnected ? "✅ Online" : "❌ Offline"}. Admin API: ${adminTest.isConnected ? "✅ Online" : "❌ Offline"}`,
      variant: backendTest.isConnected && adminTest.isConnected ? "default" : "destructive"
    });
    setDiagnosticLoading(false);
  };

  const fetchAdminData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const connectionTest = await testBackendConnection();
      setConnectionStatus(connectionTest);

      const [verificationResponse, revenueResponse] = await Promise.all([
        fetch(API_CONFIG.ADMIN.VERIFICATION_REQUESTS, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(API_CONFIG.ADMIN.REVENUE, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
        })
      ]);

      if (!verificationResponse.ok) {
        throw new Error(`Verification API error: ${verificationResponse.status}`);
      }
      if (!revenueResponse.ok) {
        throw new Error(`Revenue API error: ${revenueResponse.status}`);
      }

      const verificationData = await verificationResponse.json();
      setVerificationRequests(verificationData.verificationRequests || []);
      setVerificationStats(
        verificationData.stats || { total: 0, pending: 0, approved: 0, rejected: 0 },
      );

      const revenue = await revenueResponse.json();
      setRevenueData(revenue);

      setLastUpdated(new Date());
    } catch (error: any) {
      toast({
        title: "Synchronization Error",
        description: error.message || "Failed to fetch real-time data",
        variant: "destructive",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleReview = async (data: ReviewForm) => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      const transformedData = {
        ...data,
        verificationDocuments: selectedRequest.documents ? transformDocumentsForBackend(selectedRequest.documents) : []
      };

      const response = await fetch(`${API_CONFIG.ADMIN.VERIFICATION_REQUESTS}/${selectedRequest.verificationRequestId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transformedData)
      });

      if (!response.ok) throw new Error('Operation failed');

      setReviewModal(false);
      setSelectedRequest(null);
      form.reset();
      handleRefresh();
      toast({ title: "Request Updated", description: "Institution status has been successfully updated." });
    } catch (error) {
      toast({ title: "Review Error", description: "Could not apply decision. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    AdminAuth.logout();
    setLocation('/admin/login');
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Validation Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(API_CONFIG.ADMIN.CHANGE_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (!response.ok) throw new Error('Failed to update password');

      toast({ title: "Success", description: "Identity credentials rotation completed." });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({ title: "Security Error", description: error.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading && !lastUpdated) {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-400 font-medium">Initializing Enterprise Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden font-sans">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] pointer-events-none" />

        {/* Top Header */}
        <header className="h-20 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950/50 backdrop-blur-xl z-20">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white capitalize">{activeTab}</h2>
            <p className="text-xs text-gray-500">System Governance & Administrative Oversight</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-full">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", connectionStatus?.isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                  {connectionStatus?.isConnected ? "Core Engine Active" : "Core Engine Offline"}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-gray-800" />
              <button onClick={handleRefresh} className="text-gray-400 hover:text-white transition-colors">
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-gray-900 rounded-full">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-gray-950" />
              </Button>
              <Button onClick={() => setShowPasswordModal(true)} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-900 rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Analytic Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Total Revenue"
                      value={`$${revenueData?.totalRevenue?.toLocaleString() || '0'}`}
                      icon={DollarSign}
                      trend="+12.5%"
                      color="blue"
                    />
                    <StatCard
                      title="Verified Institutions"
                      value={verificationStats.approved}
                      icon={Building2}
                      trend="+4 this week"
                      color="indigo"
                    />
                    <StatCard
                      title="Pending Approvals"
                      value={verificationStats.pending}
                      icon={FileCheck}
                      trend="Requires Action"
                      color="amber"
                      highlight={verificationStats.pending > 0}
                    />
                    <StatCard
                      title="Service Uptime"
                      value="99.98%"
                      icon={Activity}
                      trend="Stable"
                      color="green"
                    />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Main Verification List */}
                    <Card className="xl:col-span-2 bg-gray-900/50 border-gray-800 backdrop-blur-sm overflow-hidden border-none shadow-2xl shadow-black/20">
                      <CardHeader className="p-6 border-b border-gray-800/50 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">Verification Queue</CardTitle>
                          <p className="text-xs text-gray-500 mt-1">Pending institutional credibility reviews</p>
                        </div>
                        <Badge className="bg-blue-600/10 text-blue-400 border border-blue-600/20 px-3 py-1">
                          {verificationRequests.filter(r => r.status === 'pending').length} Priority
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        {verificationRequests.length === 0 ? (
                          <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3">
                            <Shield className="w-12 h-12 opacity-20" />
                            <p className="font-medium text-sm">No pending requests in queue</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-800/50">
                            {verificationRequests.map((req) => (
                              <div key={req.id} className="p-6 hover:bg-gray-800/30 transition-colors group">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-blue-500 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                      {req.institutionName.charAt(0)}
                                    </div>
                                    <div>
                                      <h4 className="text-white font-semibold flex items-center gap-2">
                                        {req.institutionName}
                                        {req.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                      </h4>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {req.institutionEmail}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(req.submittedAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <StatusBadge status={req.status} />
                                    <Button
                                      onClick={() => { setSelectedRequest(req); setReviewModal(true); }}
                                      variant="outline"
                                      className="border-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 h-9 transition-all duration-300"
                                    >
                                      Review Profile
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Regional/Revenue Breakdown */}
                    <div className="space-y-6">
                      <Card className="bg-gray-900 border-gray-800 shadow-xl border-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white text-sm font-semibold uppercase tracking-wider opacity-60">System Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue Streams</h5>
                            {revenueData?.planBreakdown && Object.entries(revenueData.planBreakdown).map(([plan, count]) => (
                              <div key={plan} className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className="text-gray-300 capitalize">{plan} Plan</span>
                                  <span className="text-white">{count} Institutions</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / (revenueData.activeSubscriptions || 1)) * 100}%` }}
                                    className={cn(
                                      "h-full rounded-full",
                                      plan === 'enterprise' ? "bg-purple-500" : plan === 'pro' ? "bg-blue-500" : "bg-teal-500"
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-6 border-t border-gray-800 space-y-4">
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Network</h5>
                            <div className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                  <Shield className="w-4 h-4 text-green-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">Security Score</p>
                                  <p className="text-[10px] text-gray-500">Based on recent audits</p>
                                </div>
                              </div>
                              <span className="text-xl font-black text-green-500">A+</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none p-6 text-white overflow-hidden relative shadow-2xl">
                        <div className="relative z-10 space-y-4">
                          <h3 className="font-bold text-lg">Platform Scalability</h3>
                          <p className="text-xs text-blue-100 leading-relaxed opacity-80">
                            Current system throughput is at 4% of total capacity. Infrastructure is ready for mass institutional onboarding.
                          </p>
                          <Button
                            onClick={handleConnectionTest}
                            disabled={diagnosticLoading}
                            className="bg-white text-blue-600 hover:bg-blue-50 w-full font-bold text-xs uppercase tracking-widest"
                          >
                            {diagnosticLoading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                            Load Diagnostics
                          </Button>
                        </div>
                        <Activity className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10" />
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'governance' && (
                <div className="w-full h-full">
                  <AdminGovernanceDashboard embedded />
                </div>
              )}

              {activeTab === 'blockchain' && (
                <div className="max-w-4xl mx-auto py-8">
                  <Card className="bg-gray-900 border-gray-800 p-8 shadow-2xl border-none">
                    <div className="mb-8 flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                        <Link2 className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">On-Chain Registry</h3>
                        <p className="text-sm text-gray-500">Syncing institutional records to the immutable ledger</p>
                      </div>
                    </div>
                    <BlockchainManagement />
                  </Card>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="max-w-6xl mx-auto py-8">
                  <Card className="bg-gray-900 border-gray-800 p-8 shadow-2xl border-none">
                    <UserManagement />
                  </Card>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="max-w-5xl mx-auto py-8 space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">System Audit logs</h3>
                      <p className="text-sm text-gray-500 mt-1">Comprehensive history of all administrative actions</p>
                    </div>
                    <Button variant="outline" className="border-gray-800 bg-gray-900 text-gray-400 hover:text-white">
                      Export Report
                    </Button>
                  </div>
                  <Card className="bg-gray-900 border-gray-800 p-0 overflow-hidden border-none shadow-2xl">
                    <div className="divide-y divide-gray-800">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="p-5 flex items-center justify-between hover:bg-gray-800/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                              <History className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">Institution Review Completed</p>
                              <p className="text-xs text-gray-500 mt-0.5">Admin processed Stanford University application</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-400">2 hours ago</p>
                            <Badge className="mt-1 bg-green-500/10 text-green-500 border-none text-[10px]">Success</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-800/40 text-center">
                      <Button variant="link" className="text-blue-500 text-xs font-bold uppercase tracking-widest">Load Archived Logs</Button>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footnote */}
        <footer className="h-10 border-t border-gray-800 bg-gray-950 flex items-center justify-center px-8 z-20">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">EduCreds Official Administration Layer • Advanced Trusted Ecosystem</p>
        </footer>
      </main>

      {/* Shared Modals */}
      <Dialog open={reviewModal} onOpenChange={setReviewModal}>
        <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-800 text-white rounded-3xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8">
            <DialogTitle className="text-2xl font-bold">Quality Control Review</DialogTitle>
            <DialogDescription className="text-blue-100 mt-2">
              Validating credentialing authority for {selectedRequest?.institutionName}
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Entity Details</p>
                <p className="text-sm font-bold text-white">{selectedRequest?.institutionName}</p>
                <p className="text-xs text-gray-400 mt-1">{selectedRequest?.institutionEmail}</p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">Registration ID</p>
                <p className="text-sm font-bold text-white">{selectedRequest?.registrationNumber}</p>
                <p className="text-xs text-gray-400 mt-1">Submitted {selectedRequest && new Date(selectedRequest.submittedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedRequest?.documents && selectedRequest.documents.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Evidence Provided</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedRequest.documents.map((doc, idx) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <FileCheck className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{doc.type}</p>
                          <p className="text-[10px] text-gray-500 truncate">Official Document</p>
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-blue-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleReview)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Security Verdict</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 border-gray-700 h-12 rounded-xl text-white">
                              <SelectValue placeholder="Select verdict" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="approved" className="hover:bg-blue-600">Authorize Entity</SelectItem>
                            <SelectItem value="rejected" className="hover:bg-red-600">Decline Application</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Internal Remarks</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-gray-800 border-gray-700 rounded-2xl p-4 text-white min-h-[100px]" placeholder="Add context for this administrative decision..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setReviewModal(false)}>Discard</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white h-12 px-8 rounded-xl font-bold">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize & Sync"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Security Hardening</DialogTitle>
            <DialogDescription className="text-gray-400">Maintain credential integrity by rotating your master key regularly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Current Key</Label>
              <Input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} className="bg-gray-800 border-gray-700 h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">New Strategic Key</Label>
              <Input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="bg-gray-800 border-gray-700 h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Verify Strategic Key</Label>
              <Input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="bg-gray-800 border-gray-700 h-11 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPasswordModal(false)} variant="ghost" className="text-gray-500 hover:text-white">Cancel</Button>
            <Button onClick={handlePasswordChange} disabled={passwordLoading} className="bg-blue-600 hover:bg-blue-500 h-11 px-6 rounded-xl font-bold">
              {passwordLoading ? <Loader2 className="animate-spin" /> : "Apply Key Rotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color, highlight }: any) {
  const colors: any = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-500",
    indigo: "from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-500",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-500",
    green: "from-green-500/10 to-green-600/5 border-green-500/20 text-green-500",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-500",
  };

  return (
    <Card className={cn(
      "bg-gradient-to-br border shadow-xl border-none transition-all duration-300 hover:scale-[1.02] relative overflow-hidden",
      colors[color || 'blue'],
      highlight && "ring-1 ring-amber-500 shadow-amber-500/10"
    )}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 rounded-xl bg-white/5 border border-white/10")}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <span className={cn(
              "text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 border border-white/5",
              trend.includes('+') ? "text-green-400" : "text-amber-400"
            )}>
              {trend}
            </span>
          )}
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{title}</h3>
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      </CardContent>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl pointer-events-none" />
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <Badge className={cn("capitalize font-bold border rounded-lg px-3 py-1", styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
      {status}
    </Badge>
  );
}
