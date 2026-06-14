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
import SecurityDashboard from "@/components/admin/SecurityDashboard";
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
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState('admin@educreds.xyz');
  
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewModal, setReviewModal] = useState(false);

  useEffect(() => {
    const session = AdminAuth.getSession();
    if (session?.email) {
      setAdminEmail(session.email);
    }
  }, []);

  // TanStack Query Hooks
  const { data: verifData, isLoading: verifLoading, refetch: refetchVerif } = useVerificationRequests();
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useRevenueData();
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

  if (verifLoading || revenueLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <Loader2 className="size-16 text-primary animate-spin" />
          <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 text-primary/50" />
        </div>
        <p className="text-neutral-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Synchronizing Network State</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Network Control</h2>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Real-time Administrative Oversight</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="rounded-xl border-white/5 bg-white/5 text-neutral-400 font-bold uppercase text-[10px] tracking-widest">
           <RefreshCw className="size-3 mr-2" /> Refresh Core
        </Button>
      </div>

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
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-black/40 bg-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden group border border-white/5">
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

        {/* System Breakdown */}
        <div className="lg:col-span-4 space-y-10">
          <Card className="border-none shadow-2xl bg-gray-900/80 rounded-[40px] overflow-hidden p-2 border border-white/5">
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
        </div>
      </div>

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
