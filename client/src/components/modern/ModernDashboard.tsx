import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { 
  Award, 
  Users, 
  Zap, 
  TrendingUp,
  Plus,
  Eye,
  BarChart3,
  CheckCircle,
  UserPlus,
  Activity,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles,
  Target,
  Globe,
  AlertCircle,
  FileText,
  Shield,
  KeyRound,
  GlobeLock,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { UsageDashboard } from "@/components/UsageDashboard";
import { NetworkIntegrity } from "./NetworkIntegrity";
import LmsMigrationPanel from "@/components/institution/LmsMigrationPanel";

export default function ModernDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats", user?.id],
    queryFn: () => api.getStats(user?.id),
    enabled: !!user,
    refetchOnMount: true,
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription/current"],
    queryFn: api.getCurrentSubscription,
    enabled: !!user,
    refetchOnMount: true,
  });

  const { data: certificatesData } = useQuery({
    queryKey: ["/api/certificates/institution"],
    queryFn: api.getCertificates,
    enabled: !!user,
    refetchOnMount: true,
  });

  const { data: issuanceTrendData, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/stats/trend", user?.id, 6],
    queryFn: () => api.getIssuanceTrend(6, user?.id),
    enabled: !!user,
    refetchOnMount: true,
  });

  const { data: distributionData, isLoading: distributionLoading } = useQuery({
    queryKey: ["/api/stats/distribution", user?.id],
    queryFn: () => api.getCertificateDistribution(user?.id),
    enabled: !!user,
    refetchOnMount: true,
  });

  const certificates = (certificatesData as any)?.certificates || [];
  const recentCertificates = certificates.slice(0, 5);

  const handleIssueCertificate = useCallback(() => setLocation("/institution/issue"), [setLocation]);
  const handleViewCertificates = useCallback(() => setLocation("/institution/certificates"), [setLocation]);
  const handleBrowseTemplates = useCallback(() => setLocation("/marketplace"), [setLocation]);
  const handleViewAnalytics = useCallback(() => setLocation("/institution/analytics"), [setLocation]);

  const quickActions = [
    {
      title: "Issue Certificate",
      description: "Create a new certificate",
      icon: Plus,
      color: "text-white",
      bg: "bg-gradient-to-r from-primary to-purple-600",
      action: handleIssueCertificate,
      primary: true
    },
    {
      title: "View All Certificates",
      description: "Manage issued certificates",
      icon: Award,
      color: "text-primary",
      bg: "bg-primary/10",
      action: handleViewCertificates,
    },
    {
      title: "Browse Templates",
      description: "Find certificate designs",
      icon: Sparkles,
      color: "text-purple-600",
      bg: "bg-purple-100",
      action: handleBrowseTemplates,
    },
    {
      title: "Analytics",
      description: "View detailed insights",
      icon: BarChart3,
      color: "text-green-600",
      bg: "bg-green-100",
      action: handleViewAnalytics,
    }
  ];

  const getUsagePercentage = () => {
    const usage = (subscription as any)?.usage?.certificatesThisMonth || 0;
    const limit =
      (subscription as any)?.subscription?.planId === 'pro'
        ? 1000
        : (subscription as any)?.subscription?.planId === 'enterprise'
        ? 2000
        : 200;
    return Math.min((usage / limit) * 100, 100);
  };

  const trendChartData = Array.isArray(issuanceTrendData) ? issuanceTrendData : [];

  const trendChartConfig = {
    issued: {
      label: "Issued",
      color: "hsl(var(--primary))",
    },
    revoked: {
      label: "Revoked",
      color: "hsl(var(--destructive))",
    },
  } satisfies ChartConfig;

  const certificateDistribution = Array.isArray(distributionData)
    ? distributionData
        .filter((item: any) => (item?.value ?? 0) > 0)
        .map((item: any, index: number) => ({
          name: item.name || `Type ${index + 1}`,
          value: item.value || 0,
          color: [
            "hsl(var(--primary))",
            "hsl(var(--success))",
            "hsl(var(--accent))",
            "hsl(var(--warning))"
          ][index % 4]
        }))
    : [];

  const trendTotals = trendChartData.reduce(
    (acc: { issued: number; revoked: number }, curr: any) => ({
      issued: acc.issued + (Number(curr.issued) || 0),
      revoked: acc.revoked + (Number(curr.revoked) || 0),
    }),
    { issued: 0, revoked: 0 }
  );

  const distributionTotal = certificateDistribution.reduce(
    (acc: number, curr: any) => acc + (Number(curr.value) || 0),
    0
  );

  const distributionConfig = certificateDistribution.reduce((acc, item) => {
    acc[item.name] = {
      label: item.name,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

  const certificateLimit = (subscription as any)?.subscription?.monthlyLimit || 50;
  const certificatesUsed = (subscription as any)?.usage?.certificatesThisMonth || 0;
  const certificatesRemaining = Math.max(0, certificateLimit - certificatesUsed);
  const isNearLimit = getUsagePercentage() >= 80;

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
              </h1>
              {user?.isVerified ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Verification Pending
                </Badge>
              )}
            </div>
            <p className="text-neutral-500 font-medium">
              {format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => setLocation("/institution/issue")}
              className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              Issue Certificate
            </Button>
            <Button variant="outline" onClick={() => setLocation("/institution/certificates")} className="bg-white">
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm bg-white animate-pulse">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard 
              title="Total Certificates"
              value={(stats as any)?.totalCertificates || 0}
              icon={Award}
              color="blue"
              trend="+12%"
            />
            <StatCard 
              title="Active Certificates"
              value={(stats as any)?.activeCertificates || 0}
              icon={CheckCircle}
              color="green"
              subtitle="Currently in use"
            />
            <StatCard 
              title="Revoked Certificates"
              value={(stats as any)?.revokedCertificates || 0}
              icon={XCircle}
              color="red"
              subtitle="Invalid credentials"
            />
            <StatCard 
              title="Monthly Usage"
              value={`${certificatesUsed}/${certificateLimit}`}
              icon={Target}
              color="amber"
              progress={getUsagePercentage()}
            />
          </>
        )}
      </div>

      {/* Quick Actions & Live Telemetry */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Access your most-used features</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {quickActions.map((action) => (
               <button
                 key={action.title}
                 onClick={action.action}
                 className={`group relative p-5 rounded-xl border transition-all duration-300 text-left flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                   action.primary
                     ? "bg-gradient-to-br from-primary via-blue-500 to-purple-600 border-transparent text-white shadow-lg hover:shadow-xl hover:-translate-y-1 focus-visible:ring-primary"
                     : "bg-white border-neutral-200 hover:border-primary/30 hover:shadow-md hover:bg-neutral-50 focus-visible:ring-primary"
                 }`}
               >
                <div className="relative z-10 space-y-3">
                  <div className={`w-fit p-3 rounded-lg transition-all ${
                    action.primary 
                      ? "bg-white/20 group-hover:bg-white/30" 
                      : `${action.bg} group-hover:shadow-sm`
                  }`}>
                    <action.icon className={`w-6 h-6 ${action.primary ? "text-white" : action.color}`} />
                  </div>
                  
                  <div>
                    <h3 className={`font-bold text-lg ${action.primary ? "text-white" : "text-neutral-900"}`}>
                      {action.title}
                    </h3>
                    <p className={`text-sm mt-1 ${action.primary ? "text-white/80" : "text-neutral-500"}`}>
                      {action.description}
                    </p>
                  </div>
                </div>
                
                <div className={`relative z-10 mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${
                  action.primary ? "text-white/90" : "text-primary"
                }`}>
                  <span>Explore</span>
                  <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Live Network
          </h2>
          <NetworkIntegrity />
        </div>
      </div>

      {/* Usage Warnings */}
      {isNearLimit && (
        <Alert className="border-amber-200 bg-amber-50 shadow-sm rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 font-medium">
            Approaching Limit: You've used {certificatesUsed} of {certificateLimit} certificates ({Math.round(getUsagePercentage())}%). 
            {certificatesRemaining < 10 && certificatesRemaining > 0 && ` Only ${certificatesRemaining} remaining.`}
            {certificatesRemaining === 0 && " Upgrade your plan to continue issuing."}
          </AlertDescription>
        </Alert>
      )}

      {/* LMS Migration & Sync */}
      <LmsMigrationPanel />

      {/* Analytics Section - Enterprise Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issuance Trend Chart */}
        <Card className="border-0 shadow-sm lg:col-span-2 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-white to-slate-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Issuance Trend
                </CardTitle>
                <p className="text-sm text-neutral-500 mt-1">Monthly issuance and revocation volume (last 6 months).</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Issued</p>
                  <p className="text-sm font-bold text-emerald-700">{trendTotals.issued}</p>
                </div>
                <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Revoked</p>
                  <p className="text-sm font-bold text-rose-700">{trendTotals.revoked}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {trendLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-[260px] w-full" />
              </div>
            ) : trendChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-[260px] border border-dashed border-neutral-200 rounded-xl bg-neutral-50/40">
                <FileText className="w-8 h-8 text-neutral-300 mb-3" />
                <p className="text-sm font-semibold text-neutral-700">No issuance data yet</p>
                <p className="text-xs text-neutral-500 mt-1">Issue certificates to populate trend analytics.</p>
              </div>
            ) : (
              <ChartContainer config={trendChartConfig} className="w-full h-[300px]">
                <LineChart data={trendChartData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="issued"
                    stroke="var(--color-issued)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--color-issued)", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revoked"
                    stroke="var(--color-revoked)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--color-revoked)", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Certificate Distribution Pie Chart */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-white to-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Distribution
                </CardTitle>
                <p className="text-sm text-neutral-500 mt-1">Certificate mix across categories.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total</p>
                <p className="text-sm font-bold text-neutral-900">{distributionTotal}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {distributionLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-[220px] w-full" />
              </div>
            ) : certificateDistribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center h-[220px] border border-dashed border-neutral-200 rounded-xl bg-neutral-50/40">
                <FileText className="w-8 h-8 text-neutral-300 mb-3" />
                <p className="text-sm font-semibold text-neutral-700">No distribution data yet</p>
                <p className="text-xs text-neutral-500 mt-1">Issue certificates to see category breakdowns.</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <ChartContainer config={distributionConfig} className="w-full h-[240px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={certificateDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {certificateDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total</p>
                    <p className="text-xl font-black text-neutral-900">{distributionTotal}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {certificateDistribution.map((item) => {
                    const percent = distributionTotal > 0 ? Math.round((item.value / distributionTotal) * 100) : 0;
                    return (
                      <div key={item.name} className="flex flex-col p-2 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-neutral-500 uppercase truncate">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-neutral-900">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature & Usage Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Blockchain & Trust
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrustFeatureCard 
              icon={CheckCircle}
              title="Instant Verification"
              description="Verify authenticity in seconds via blockchain"
              color="blue"
            />
            <TrustFeatureCard 
              icon={Shield}
              title="Tamper-Proof"
              description="Immutable records secured on decentralized network"
              color="green"
            />
            <TrustFeatureCard 
              icon={Globe}
              title="Global Standard"
              description="W3C-compliant credentials accepted worldwide"
              color="purple"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Plan & Usage
          </h2>
          <Card className="border border-neutral-200 shadow-sm bg-white overflow-hidden rounded-xl">
            <CardContent className="p-0">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    Current Subscription
                  </p>
                  <p className="text-sm font-bold text-neutral-900 mt-1">
                    {(subscription as any)?.subscription?.planId?.toUpperCase() || "STARTER"} PLAN
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/institution/subscription")}
                  className="text-xs font-bold h-8"
                >
                  Manage
                </Button>
              </div>
              <div className="p-1">
                {/* Embedded usage dashboard - passing props for more compact view */}
                <UsageDashboard compact />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Certificates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Recent Certificates
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/institution/certificates")} className="text-primary font-bold">
            View All
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <Card className="border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-0">
            {recentCertificates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-100">
                  <Award className="w-8 h-8 text-neutral-300" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">No certificates yet</h3>
                <p className="text-neutral-500 mb-6 max-w-xs mx-auto">Start issuing verifiable credentials to your students on the blockchain.</p>
                <Button onClick={() => setLocation("/institution/issue")} className="shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Issue First Certificate
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recentCertificates.map((cert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors group cursor-pointer" onClick={() => setLocation(`/institution/certificates/${cert.id}`)}>
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 truncate">{cert.studentName}</p>
                        <p className="text-xs text-neutral-500 truncate font-medium">{cert.certificateType || cert.courseName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:block text-right">
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-tighter">Issued On</p>
                        <p className="text-sm font-medium text-neutral-900">{format(new Date(cert.issuedAt), "MMM dd, yyyy")}</p>
                      </div>
                      <Badge className={cert.isMinted 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" 
                        : "bg-amber-50 text-amber-700 border-amber-200 font-bold"}>
                        {cert.isMinted ? "On-Chain" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, progress, subtitle }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all group rounded-xl bg-white overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1">
            <div className={`p-3 w-fit rounded-xl border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">{title}</p>
              <p className="text-3xl font-black text-neutral-900 mt-1 tracking-tighter">
                {value}
              </p>
              {subtitle && <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-wide">{subtitle}</p>}
              {progress !== undefined && (
                <div className="mt-4 space-y-1.5">
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex justify-between text-[10px] font-black text-neutral-400 uppercase">
                    <span>Usage</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {trend && (
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TrustFeatureCard({ icon: Icon, title, description, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-100 bg-blue-50/30 text-blue-600 icon-bg-blue-100",
    green: "border-emerald-100 bg-emerald-50/30 text-emerald-600 icon-bg-emerald-100",
    purple: "border-purple-100 bg-purple-50/30 text-purple-600 icon-bg-purple-100",
  };

  return (
    <Card className={`border shadow-none hover:shadow-sm transition-all rounded-xl ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl ${colorMap[color].split(' ')[3].replace('icon-bg-', 'bg-')}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm">{title}</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed font-medium">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
