import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAdminNotificationSettings, useUpdateAdminNotificationSettings } from "@/hooks/useAdmin";
import {
  Users,
  DollarSign,
  FileCheck,
  Activity,
  Bell,
  Search,
  RefreshCw,
  Shield,
  History,
  Lock,
  Mail,
  Calendar,
  Settings,
  Building2,
  Link2,
  ExternalLink,
  Loader2,
  Terminal,
  Cpu,
  Globe,
  Database,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BlockchainManagement from "@/components/BlockchainManagement";
import UserManagement from "@/components/admin/UserManagement";
import AdminGovernanceDashboard from "@/pages/admin/governance-dashboard";
import { SystemIntegrity } from "@/components/admin/SystemIntegrity";
import { useVerificationRequests, useRevenueData, useReviewVerification, useAuditLogs } from "@/hooks/useAdmin";
import { testBackendConnection, testAdminConnection } from "@/utils/connectionTest";
import { cn } from "@/lib/utils";
import { AdminAuth } from "@/lib/admin-auth";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState('admin@educreds.xyz');
  const [notificationForm, setNotificationForm] = useState({
    adminEmail: 'admin@educreds.xyz',
    institutionNotifications: 'WEEKLY',
    proposalNotifications: 'DAILY',
    enabled: true,
  });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'notifications' | 'governance' | 'blockchain' | 'users' | 'audit' | 'integrity'>('overview');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  const { data: notificationSettings, isLoading: notificationLoading, refetch: refetchNotificationSettings } = useAdminNotificationSettings(adminEmail);
  const updateNotificationSettings = useUpdateAdminNotificationSettings();

  useEffect(() => {
    AdminAuth.getSession().then((session) => {
      if (session?.email) {
        setAdminEmail(session.email);
      }
    });
  }, []);

  useEffect(() => {
    if (!notificationSettings) return;
    setNotificationForm({
      adminEmail: notificationSettings.adminEmail || adminEmail,
      institutionNotifications: notificationSettings.institutionNotifications || 'WEEKLY',
      proposalNotifications: notificationSettings.proposalNotifications || 'DAILY',
      enabled: notificationSettings.enabled ?? true,
    });
  }, [notificationSettings, adminEmail]);

  // TanStack Query Hooks
  const { data: verifData, isLoading: verifLoading, refetch: refetchVerif } = useVerificationRequests();
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useRevenueData();
  const { data: logsData, isLoading: logsLoading } = useAuditLogs();
  const reviewMutation = useReviewVerification();

  const verificationRequests = verifData?.verificationRequests || [];
  const verificationStats = verifData?.stats || { total: 0, pending: 0, approved: 0, rejected: 0 };

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { status: 'approved', comments: '' },
  });

  const handleRefresh = () => {
    refetchVerif();
    refetchRevenue();
    refetchNotificationSettings();
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await updateNotificationSettings.mutateAsync({
        adminEmail,
        settings: {
          institutionNotifications: notificationForm.institutionNotifications,
          proposalNotifications: notificationForm.proposalNotifications,
          enabled: notificationForm.enabled,
        },
      });

      toast({ title: 'Notification settings saved', description: 'Admin digest preferences were updated successfully.' });
    } catch (error: any) {
      toast({ title: 'Save Failed', description: error?.message || 'Could not update notification settings.', variant: 'destructive' });
    }
  };

  const handleReview = async (data: ReviewForm) => {
    if (!selectedRequest) return;
    try {
      await reviewMutation.mutateAsync({
        requestId: selectedRequest.verificationRequestId,
        status: data.status,
        comments: data.comments,
        documents: selectedRequest.documents
      });
      setReviewModal(false);
      setSelectedRequest(null);
      form.reset();
      toast({ title: "Strategic Decision Logged", description: "Institution authority status synchronized." });
    } catch (error) {
      toast({ title: "Consensus Error", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    AdminAuth.logout();
    setLocation('/admin/login');
  };

  if (verifLoading || revenueLoading) {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="size-16 text-primary animate-spin" />
            <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-primary/50" />
          </div>
          <p className="text-neutral-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Root Authority Portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden font-sans selection:bg-primary selection:text-white">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} adminEmail={adminEmail} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Deep Infrastructure Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(21,96,189,0.08),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

        {/* Global Control Header */}
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-gray-950/80 backdrop-blur-2xl z-20">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-primary" />
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">{activeTab}</h2>
            </div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">Network Governance & Administrative Oversight</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden xl:flex items-center gap-6 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl shadow-inner shadow-black/40">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Core Engine: Synchronized</span>
              </div>
              <div className="h-4 w-[1px] bg-white/10" />
              <button onClick={handleRefresh} className="text-neutral-500 hover:text-primary transition-all active:scale-90">
                <RefreshCw className={cn("size-4")} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative size-12 rounded-2xl bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                <Bell className="size-5" />
                <span className="absolute top-3 right-3 size-2 bg-primary rounded-full border-2 border-gray-950" />
              </Button>
              <Button onClick={() => setShowPasswordModal(true)} variant="ghost" size="icon" className="size-12 rounded-2xl bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                <Settings className="size-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Root Scroll Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-12">
                  {/* Strategic Analytics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <AdminStatCard 
                      label="Network Revenue" 
                      value={`$${revenueData?.totalRevenue?.toLocaleString() || '0'}`} 
                      sub="Lifetime Capital" 
                      icon={DollarSign} 
                      color="blue" 
                    />
                    <AdminStatCard 
                      label="Validated Nodes" 
                      value={verificationStats.approved} 
                      sub="Active Institutions" 
                      icon={Building2} 
                      color="green" 
                    />
                    <AdminStatCard 
                      label="Consensus Queue" 
                      value={verificationStats.pending} 
                      sub="Requests Requiring Audit" 
                      icon={ShieldAlert} 
                      color="amber" 
                      alert={verificationStats.pending > 0}
                    />
                    <AdminStatCard 
                      label="Protocol Uptime" 
                      value="99.99%" 
                      sub="Base Network Status" 
                      icon={Activity} 
                      color="indigo" 
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Verification Audit Queue */}
                    <Card className="lg:col-span-8 border-none shadow-2xl shadow-black/40 bg-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden group">
                      <CardHeader className="p-10 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-2xl font-black text-white tracking-tight">Institutional Audit Queue</CardTitle>
                          <CardDescription className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Strategic Credibility Verification</CardDescription>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none px-4 py-2 rounded-full font-black text-[10px] uppercase">
                          {verificationRequests.length} Pending
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        {verificationRequests.length === 0 ? (
                          <div className="py-32 flex flex-col items-center justify-center text-neutral-600 gap-6">
                            <div className="size-20 bg-white/5 rounded-[32px] flex items-center justify-center">
                              <ShieldCheck className="size-10 opacity-20" />
                            </div>
                            <p className="font-black uppercase tracking-[0.2em] text-xs">Registry Currently Synchronized</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {verificationRequests.map((req: any) => (
                              <div key={req.id} className="p-10 hover:bg-white/[0.03] transition-all duration-500 group/item relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between relative z-10">
                                  <div className="flex items-center gap-8">
                                    <div className="size-16 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center text-primary font-black text-2xl shadow-xl group-hover/item:scale-105 transition-transform duration-500">
                                      {req.institutionName.charAt(0)}
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="text-xl font-black text-white tracking-tight group-hover/item:text-primary transition-colors">{req.institutionName}</h4>
                                      <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                          <Mail className="size-3.5" /> {req.institutionEmail}
                                        </div>
                                        <div className="size-1.5 rounded-full bg-white/10" />
                                        <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                          <Calendar className="size-3.5" /> {new Date(req.submittedAt).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <AdminStatusBadge status={req.status} />
                                    <Button
                                      onClick={() => { setSelectedRequest(req); setReviewModal(true); }}
                                      className="h-12 px-8 rounded-xl bg-white text-gray-950 hover:bg-neutral-200 font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                                    >
                                      Initiate Audit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Infrastructure Health & Revenue */}
                    <div className="lg:col-span-4 space-y-10">
                      <Card className="border-none shadow-2xl bg-gray-900/80 rounded-[40px] overflow-hidden p-2">
                        <CardHeader className="p-8">
                          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Resource Utilization</p>
                          <CardTitle className="text-xl font-black text-white tracking-tight">System Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-10 space-y-8">
                          <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Revenue Distribution</h5>
                            {revenueData?.planBreakdown && Object.entries(revenueData.planBreakdown).map(([plan, count]: [string, any]) => (
                              <div key={plan} className="space-y-3">
                                <div className="flex justify-between items-end">
                                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">{plan} Nodes</span>
                                  <span className="text-lg font-black text-white tracking-tighter">{count}</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / (revenueData.activeSubscriptions || 1)) * 100}%` }}
                                    className={cn(
                                      "h-full rounded-full shadow-[0_0_8px_rgba(21,96,189,0.4)]",
                                      plan === 'enterprise' ? "bg-purple-600" : plan === 'pro' ? "bg-primary" : "bg-teal-500"
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-8 border-t border-white/5 space-y-6">
                            <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Security Posture</h5>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group cursor-default">
                              <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-green-500/10 flex items-center justify-center shadow-inner">
                                  <ShieldCheck className="size-6 text-green-500" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-white uppercase tracking-widest">Network Score</p>
                                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">Real-time Audit</p>
                                </div>
                              </div>
                              <span className="text-3xl font-black text-green-500 tracking-tighter group-hover:scale-110 transition-transform">AAA+</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="p-10 bg-primary rounded-[40px] shadow-2xl shadow-primary/20 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Cpu className="size-32 rotate-12" />
                        </div>
                        <div className="space-y-6 relative z-10">
                          <div className="size-14 bg-white/20 rounded-[24px] flex items-center justify-center backdrop-blur-xl border border-white/10">
                            <Zap className="size-8" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-3xl font-black tracking-tighter leading-none">Scalability Peak.</h3>
                            <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">Platform throughput is optimized. 96% excess capacity remains for rapid institutional expansion.</p>
                          </div>
                          <Button 
                            onClick={handleRefresh}
                            className="w-full h-14 bg-white text-primary hover:bg-neutral-100 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl"
                          >
                            Execute Heartbeat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="max-w-5xl mx-auto space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                        <Bell className="size-4" />
                        Admin Communications
                      </div>
                      <h3 className="text-4xl font-black text-white tracking-tighter">Notification Settings</h3>
                      <p className="text-neutral-500 font-medium">Configure automated email digests for institution and proposal activity</p>
                    </div>
                  </div>

                  <Card className="border-none shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[40px] p-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5"><Bell className="size-64 rotate-12" /></div>
                    <div className="mb-12 flex items-center gap-6 relative z-10">
                      <div className="size-16 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-600/20">
                        <Mail className="size-8 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black text-white tracking-tighter">Email Digest Configuration</h3>
                        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Automated Administrative Notifications</p>
                      </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-white font-bold text-sm uppercase tracking-widest">Institution Registrations</Label>
                            <Select value={notificationForm.institutionNotifications.toLowerCase()} onValueChange={(value) => setNotificationForm((form) => ({ ...form, institutionNotifications: value.toUpperCase() }))}>
                              <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily Digest</SelectItem>
                                <SelectItem value="weekly">Weekly Digest</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-neutral-500">Receive notifications when new institutions register on the platform</p>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-white font-bold text-sm uppercase tracking-widest">Proposal Submissions</Label>
                            <Select value={notificationForm.proposalNotifications.toLowerCase()} onValueChange={(value) => setNotificationForm((form) => ({ ...form, proposalNotifications: value.toUpperCase() }))}>
                              <SelectTrigger className="bg-neutral-900 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily Digest</SelectItem>
                                <SelectItem value="weekly">Weekly Digest</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-neutral-500">Receive notifications when new proposals are submitted for DAO voting</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-white font-bold text-sm uppercase tracking-widest">Admin Email</Label>
                            <Input
                              type="email"
                              placeholder="admin@educreds.xyz"
                              className="bg-white/5 border-white/10 text-white placeholder:text-neutral-500"
                              value={adminEmail}
                              readOnly
                            />
                            <p className="text-xs text-neutral-500">Signed-in administrator email receiving digest reports</p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="notifications-enabled"
                              className="rounded border-white/10"
                              checked={notificationForm.enabled}
                              onChange={(event) => setNotificationForm((form) => ({ ...form, enabled: event.target.checked }))}
                            />
                            <Label htmlFor="notifications-enabled" className="text-white font-bold text-sm uppercase tracking-widest">Enable Notifications</Label>
                          </div>

                          <Button
                            onClick={handleSaveNotificationSettings}
                            disabled={notificationLoading || updateNotificationSettings.isLoading}
                            className="w-full bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-widest"
                          >
                            {updateNotificationSettings.isLoading ? 'Saving...' : 'Save Settings'}
                          </Button>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-8">
                        <h4 className="text-lg font-black text-white mb-4">Notification Schedule</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-3">
                              <Calendar className="size-5 text-blue-500" />
                              <span className="text-white font-bold uppercase tracking-widest text-sm">Daily Digest</span>
                            </div>
                            <p className="text-neutral-400 text-sm">Sent every day at 9:00 AM UTC for daily notification preferences</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <div className="flex items-center gap-3 mb-3">
                              <Calendar className="size-5 text-purple-500" />
                              <span className="text-white font-bold uppercase tracking-widest text-sm">Weekly Digest</span>
                            </div>
                            <p className="text-neutral-400 text-sm">Sent every Monday at 9:00 AM UTC for weekly notification preferences</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'governance' && (
                <div className="w-full">
                  <AdminGovernanceDashboard embedded />
                </div>
              )}

              {activeTab === 'blockchain' && (
                <div className="max-w-5xl mx-auto">
                   <Card className="border-none shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[40px] p-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5"><Link2 className="size-64 rotate-12" /></div>
                    <div className="mb-12 flex items-center gap-6 relative z-10">
                      <div className="size-16 bg-indigo-600/10 rounded-3xl flex items-center justify-center border border-indigo-600/20">
                        <Database className="size-8 text-indigo-500" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black text-white tracking-tighter">On-Chain Ledger Status</h3>
                        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Immutable Institutional Registry Authorization</p>
                      </div>
                    </div>
                    <BlockchainManagement />
                  </Card>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="max-w-7xl mx-auto">
                  <UserManagement />
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="max-w-5xl mx-auto space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                        <Terminal className="size-4" />
                        Platform Telemetry
                      </div>
                      <h3 className="text-4xl font-black text-white tracking-tighter">Infrastructure Logs</h3>
                    </div>
                    <Button variant="outline" className="h-12 px-8 rounded-xl border-white/10 bg-white/5 text-neutral-400 hover:text-white font-black text-xs uppercase tracking-widest">
                      Export Audit Trail
                    </Button>
                  </div>

                  <Card className="border-none shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden">
                    <div className="divide-y divide-white/5">
                      {logsData?.logs ? logsData.logs.map((log: any, i: number) => (
                        <div key={i} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-center gap-6">
                            <div className="size-12 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center text-neutral-600 group-hover:text-primary transition-colors">
                              <History className="size-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-black text-white tracking-tight">{log.action}</p>
                              <p className="text-sm text-neutral-500 font-medium">{log.description}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            <Badge className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase px-2 h-5 rounded-full">Synchronized</Badge>
                          </div>
                        </div>
                      )) : (
                        [1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="p-8 flex items-center justify-between opacity-40">
                             <div className="flex items-center gap-6">
                                <div className="size-12 rounded-2xl bg-gray-800" />
                                <div className="space-y-2">
                                  <div className="h-4 w-48 bg-gray-800 rounded" />
                                  <div className="h-3 w-64 bg-gray-800 rounded" />
                                </div>
                             </div>
                             <div className="h-8 w-24 bg-gray-800 rounded-full" />
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'integrity' && (
                <div className="w-full">
                  <SystemIntegrity />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Root Footnote */}
        <footer className="h-12 border-t border-white/5 bg-gray-950 flex items-center justify-center px-10 z-20">
          <div className="flex items-center gap-3">
            <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(21,96,189,1)]" />
            <p className="text-[9px] text-neutral-600 uppercase tracking-[0.4em] font-black">Official Platform Administration Layer • Secure Multi-Chain Infrastructure</p>
          </div>
        </footer>
      </main>

      {/* Review Workflow Modal */}
      <Dialog open={reviewModal} onOpenChange={setReviewModal}>
        <DialogContent className="max-w-3xl bg-gray-950 border-white/5 text-white rounded-[40px] p-0 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-primary to-indigo-700 p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck className="size-48 rotate-12" /></div>
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Quality Control Review</p>
              <DialogTitle className="text-4xl font-black tracking-tighter leading-tight">Authorize Academic Entity.</DialogTitle>
              <DialogDescription className="text-blue-100/70 text-lg font-medium">Validating credentialing authority for {selectedRequest?.institutionName}</DialogDescription>
            </div>
          </div>

          <div className="p-12 space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-3">Identity Context</p>
                <p className="text-lg font-black text-white tracking-tight">{selectedRequest?.institutionName}</p>
                <p className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-tighter">{selectedRequest?.institutionEmail}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-inner">
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-3">Registry ID</p>
                <p className="text-lg font-black text-white tracking-tight">{selectedRequest?.registrationNumber}</p>
                <p className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-tighter">Round Initialized: {selectedRequest && new Date(selectedRequest.submittedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedRequest?.documents && (
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary px-2">Verification Evidence Cluster</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRequest.documents.map((doc: any, idx: number) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-gray-900 rounded-2xl border border-white/5 hover:border-primary/40 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileCheck className="size-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white truncate uppercase tracking-tighter">{doc.type}</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Signed Document</p>
                        </div>
                      </div>
                      <ExternalLink className="size-4 text-neutral-600 group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleReview)} className="space-y-10">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Final Administrative Verdict</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-white/5 h-16 rounded-2xl text-white font-black uppercase text-xs tracking-widest">
                              <SelectValue placeholder="Select verdict" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-950 border-white/5 text-white">
                            <SelectItem value="approved" className="hover:bg-primary font-black uppercase text-[10px] tracking-widest py-3">Authorize Entity</SelectItem>
                            <SelectItem value="rejected" className="hover:bg-red-600 font-black uppercase text-[10px] tracking-widest py-3">Decline Application</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Internal Registry Remarks</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="bg-gray-900 border-white/5 rounded-[32px] p-8 text-white min-h-[160px] resize-none text-sm font-medium focus:ring-primary/20" placeholder="State the technical and legal context for this administrative action..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="ghost" className="h-16 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-neutral-500" onClick={() => setReviewModal(false)}>Discard Draft</Button>
                  <Button type="submit" disabled={reviewMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90 text-white h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
                    {reviewMutation.isPending ? <Loader2 className="animate-spin size-6" /> : "Commit Audit & Synchronize"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Strategic Key Rotation Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md bg-gray-950 border-white/5 text-white rounded-[40px] p-10 shadow-2xl">
          <DialogHeader className="mb-8">
            <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
              <Lock className="size-7" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter">Security Hardening.</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium">Regular rotation of administrative keys ensures long-term protocol integrity.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">Current Authority Key</Label>
              <Input type="password" className="h-14 bg-gray-900 border-white/5 rounded-2xl focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-2">New Strategic Key</Label>
              <Input type="password" className="h-14 bg-gray-900 border-white/5 rounded-2xl focus:ring-primary/20" />
            </div>
          </div>
          <div className="pt-8">
            <Button className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-white text-gray-950 hover:bg-neutral-200 shadow-xl transition-all">
              Execute Key Rotation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminStatCard({ label, value, sub, icon: Icon, color, alert }: any) {
  const colors: any = {
    blue: "text-primary shadow-primary/5",
    green: "text-green-500 shadow-green-500/5",
    amber: "text-amber-500 shadow-amber-500/5",
    indigo: "text-indigo-500 shadow-indigo-500/5",
  };

  return (
    <Card className={cn(
      "border-none shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[32px] overflow-hidden group hover:bg-white/[0.07] transition-all duration-500",
      alert && "ring-2 ring-amber-500/50"
    )}>
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className={cn("size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110 duration-500", colors[color])}>
            <Icon className="size-6" />
          </div>
          {alert && <div className="size-2 rounded-full bg-amber-500 animate-ping" />}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{label}</p>
          <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
          <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminStatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]",
    approved: "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.1)]",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]",
  };
  return (
    <Badge className={cn("capitalize font-black border rounded-full px-4 py-1.5 text-[9px] uppercase tracking-widest", styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
      {status}
    </Badge>
  );
}
