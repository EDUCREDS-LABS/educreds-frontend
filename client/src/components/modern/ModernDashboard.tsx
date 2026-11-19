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
  Area,
  AreaChart,
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
  ShieldAlert,
  Cpu,
  Network,
  Link2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, isValid } from "date-fns";
import { UsageDashboard } from "@/components/UsageDashboard";
import { NetworkIntegrity } from "./NetworkIntegrity";
import LmsMigrationPanel from "@/components/institution/LmsMigrationPanel";

export default function ModernDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tier detection
  const tier = (user as any)?.deploymentTier ?? 'workspace';
  const isConnector = tier === 'enterprise-connector' || tier === 'cloud-connector';
  const isEnterprise = tier === 'enterprise-connector';

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats", user?.id],
    queryFn: () => api.getStats(user?.id),
    enabled: !!user,
    refetchOnMount: true,
  });

  const stats = statsData || {};

  const { data: subscription } = useQuery({
    queryKey: ["commercial-subscription", "institution"],
    queryFn: () => api.getCommercialSubscription("institution"),
    enabled: !!user,
    refetchOnMount: true,
  });

  const { data: commercialUsage } = useQuery({
    queryKey: ["commercial-usage", "institution"],
    queryFn: () => api.getCommercialUsage("institution"),
    enabled: !!user,
    refetchOnMount: true,
  });

  const { data: certificatesData } = useQuery({
    queryKey: ["/api/certificates/institution"],
    queryFn: () => api.getCertificates(),
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

  const handleIssueCertificate = useCallback(() => navigate("/institution/issue"), [navigate]);
  const handleViewCertificates = useCallback(() => navigate("/institution/certificates"), [navigate]);
  const handleBrowseTemplates = useCallback(() => navigate("/institution/manage-specs"), [navigate]);
  const handleViewAnalytics = useCallback(() => navigate("/institution/analytics"), [navigate]);

  const quickActions = isConnector ? [
    {
      title: "Connector Health",
      description: "Monitor SIS sync status",
      icon: Activity,
      color: "text-amber-700",
      bg: "bg-amber-100 dark:bg-amber-950/30",
      action: () => navigate("/connect/health-dashboard"),
    },
    {
      title: "SIS Connector",
      description: "View sync schedule",
      icon: Link2,
      color: "text-amber-700",
      bg: "bg-amber-100 dark:bg-amber-950/30",
      action: () => navigate("/connect/connector"),
    },
    {
      title: "Delegated Signing",
      description: "Manage signing keys",
      icon: Shield,
      color: "text-amber-700",
      bg: "bg-amber-100 dark:bg-amber-950/30",
      action: () => navigate("/connect/delegated-signing"),
    },
    {
      title: "Data Mapping",
      description: "Field configuration",
      icon: Network,
      color: "text-amber-700",
      bg: "bg-amber-100 dark:bg-amber-950/30",
      action: () => navigate("/connect/data-mapping"),
    },
  ] : [
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

  const usageSnapshot = (commercialUsage as any)?.usage;
  const commercialSub = (subscription as any)?.subscription;
  const certificatesUsed = usageSnapshot?.meters?.certificates
    ?? (subscription as any)?.usage?.certificatesThisMonth
    ?? 0;
  const certificateLimitRaw = usageSnapshot?.limits?.certificates
    ?? (subscription as any)?.subscription?.monthlyLimit
    ?? 200;
  const certificateLimit = certificateLimitRaw < 0 ? Number.POSITIVE_INFINITY : certificateLimitRaw;
  const certificatesRemaining = Number.isFinite(certificateLimit)
    ? Math.max(certificateLimit - certificatesUsed, 0)
    : Number.POSITIVE_INFINITY;
  const subscriptionStatus = commercialSub?.status as string | undefined;
  const accessBlocked = !!usageSnapshot?.accessBlocked || subscriptionStatus === "suspended";

  const getUsagePercentage = () => {
    if (!Number.isFinite(certificateLimit) || certificateLimit <= 0) return 0;
    return Math.min((certificatesUsed / certificateLimit) * 100, 100);
  };

  const trendChartData = Array.isArray(issuanceTrendData) ? issuanceTrendData : [];

  const trendChartConfig = {
    issued: {
      label: "Issued",
      color: "hsl(var(--chart-1))",
    },
    revoked: {
      label: "Revoked",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  const certificateDistribution = Array.isArray(distributionData)
    ? distributionData
        .filter((item: any) => (item?.value ?? 0) > 0)
        .map((item: any, index: number) => ({
          name: item.name || `Type ${index + 1}`,
          value: item.value || 0,
          color: [
            "hsl(var(--chart-1))",
            "hsl(var(--chart-2))",
            "hsl(var(--chart-3))",
            "hsl(var(--chart-4))",
            "hsl(var(--chart-5))",
            "hsl(var(--primary))",
            "hsl(var(--success))",
            "hsl(var(--accent))"
          ][index % 8]
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

  const isNearLimit = getUsagePercentage() >= 80;

  const isInstitutionVerified = useMemo(() => {
    if (!user) return false;
    const hasIIN = Boolean(stats.iinTokenId || stats.iinId);
    const hasHighPoIC = Number(stats.poicScore || 0) >= 60;
    const isExplicitlyVerified = Boolean(user.isVerified);
    return isExplicitlyVerified || hasIIN || hasHighPoIC;
  }, [user, stats]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-50/50">
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
                </h1>
                {isInstitutionVerified && (
                  <div className="size-6 flex-shrink-0 animate-in fade-in zoom-in duration-500">
                    <img 
                      src="https://res.cloudinary.com/dycszahnr/image/upload/q_auto/f_auto/v1777384457/verified_badge_mysrk6.jpg" 
                      alt="Verified" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                )}
              </div>
              {isInstitutionVerified ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
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
            {!isConnector && (
              <Button 
                onClick={() => navigate("/institution/issue")}
                className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                Issue Certificate
              </Button>
            )}
            {isConnector && (
              <Button
                onClick={() => navigate("/connect/health-dashboard")}
                className="bg-amber-600 hover:bg-amber-700 shadow-md transition-all active:scale-95 text-white"
              >
                <Activity className="w-4 h-4 mr-2" />
                Connector Health
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/institution/certificates")} className="bg-white dark:bg-neutral-900">
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </div>

        {/* ── Deployment Mode Banner (connector tiers only) ── */}
        {isEnterprise && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Enterprise Connector — On-Premise Deployment</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Credentials are issued automatically via your SIS connector. Manual issuance is not available on this tier.</p>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold">Tier 1</Badge>
          </div>
        )}
        {tier === 'cloud-connector' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40">
            <Cpu className="h-5 w-5 text-purple-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-purple-800 dark:text-purple-300">Cloud Connector — API Integration</p>
              <p className="text-xs text-purple-700 dark:text-purple-400">Credentials sync automatically from your connected SIS. Manage your API connector in Integrations.</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs font-bold">Tier 2</Badge>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm bg-white dark:bg-neutral-900 animate-pulse">
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
              value={stats.totalCertificates || 0}
              icon={Award}
              color="blue"
            />
            <StatCard 
              title="Active Certificates"
              value={stats.activeCertificates || 0}
              icon={CheckCircle}
              color="green"
              subtitle="Currently in use"
            />
            <StatCard 
              title="Total Students"
              value={stats.totalStudents || 0}
              icon={Users}
              color="purple"
              subtitle="Enrolled recipients"
            />
            <StatCard 
              title="Monthly Usage"
              value={`${certificatesUsed}/${Number.isFinite(certificateLimit) ? certificateLimit : "∞"}`}
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
                     : "bg-white dark:bg-neutral-900 border-neutral-200 hover:border-primary/30 hover:shadow-md hover:bg-neutral-50 dark:bg-neutral-50 focus-visible:ring-primary"
                 }`}
               >
                <div className="relative z-10 space-y-3">
                  <div className={`w-fit p-3 rounded-lg transition-all ${
                    action.primary 
                      ? "bg-white dark:bg-neutral-900/20 group-hover:bg-white dark:bg-neutral-900/30" 
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

        {/* Blockchain/network section removed — not relevant for institutional UI */}
      </div>

      {accessBlocked && (
        <Alert className="border-red-200 bg-red-50 shadow-sm rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              Subscription suspended — new issuance and API calls are blocked. Existing credentials remain verifiable.
            </span>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate("/institution/subscription")}>
              Restore billing
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {subscriptionStatus === "past_due" && !accessBlocked && (
        <Alert className="border-amber-200 bg-amber-50 shadow-sm rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Payment past due. Update billing before the grace period ends.</span>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate("/institution/subscription")}>
              Update payment
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Warnings */}
      {isNearLimit && !accessBlocked && (
        <Alert className="border-amber-200 bg-amber-50 shadow-sm rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 font-medium">
            Approaching Limit: You've used {certificatesUsed} of {Number.isFinite(certificateLimit) ? certificateLimit : "∞"} certificates ({Math.round(getUsagePercentage())}%). 
            {Number.isFinite(certificatesRemaining) && certificatesRemaining < 10 && certificatesRemaining > 0 && ` Only ${certificatesRemaining} remaining.`}
            {certificatesRemaining === 0 && " Upgrade your plan to continue issuing."}
          </AlertDescription>
        </Alert>
      )}

      {/* Enterprise Analytics Dashboard */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Analytics Dashboard</h2>
            <p className="text-neutral-600 mt-1">Real-time insights into your certificate ecosystem</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-emerald-700">Live Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Issued</p>
                  <p className="text-3xl font-black mt-1">{stats.totalCertificates || 0}</p>
                  <p className="text-blue-200 text-xs mt-2">All time</p>
                </div>
                <Award className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Active Certificates</p>
                  <p className="text-3xl font-black mt-1">{stats.activeCertificates || 0}</p>
                  <p className="text-emerald-200 text-xs mt-2">{stats.activeCertificates || 0} currently valid</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">This Month</p>
                  <p className="text-3xl font-black mt-1">{certificatesUsed}</p>
                  <p className="text-amber-200 text-xs mt-2">{certificateLimit - certificatesUsed} remaining</p>
                </div>
                <Zap className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Revoked</p>
                  <p className="text-3xl font-black mt-1">{stats.revokedCertificates || 0}</p>
                  <p className="text-purple-200 text-xs mt-2">Requires attention</p>
                </div>
                <Activity className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Issuance Trend - Modern Area Chart */}
          <Card className="xl:col-span-2 border-0 shadow-xl bg-white dark:bg-neutral-900 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Issuance Velocity
                  </CardTitle>
                  <p className="text-slate-600 mt-1 font-medium">Certificate issuance and revocation patterns</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                    <span className="text-xs font-bold text-blue-700">ISSUED</span>
                  </div>
                  <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                    <span className="text-xs font-bold text-red-700">REVOKED</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {trendLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-80 w-full" />
                </div>
              ) : trendChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <BarChart3 className="w-16 h-16 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-2">No Data Yet</h3>
                  <p className="text-slate-500">Start issuing certificates to see trends</p>
                </div>
              ) : (
                <ChartContainer config={trendChartConfig} className="h-80 w-full">
                  <AreaChart data={trendChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="issuedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="revokedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />} 
                      cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="issued"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={3}
                      fill="url(#issuedGradient)"
                      animationDuration={2000}
                      animationEasing="ease-out"
                    />
                    <Area
                      type="monotone"
                      dataKey="revoked"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={3}
                      fill="url(#revokedGradient)"
                      animationDuration={2000}
                      animationEasing="ease-out"
                      animationBegin={500}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Certificate Distribution - Modern Donut Chart */}
          <Card className="border-0 shadow-xl bg-white dark:bg-neutral-900 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Type Distribution
                  </CardTitle>
                  <p className="text-slate-600 mt-1 font-medium">Certificate categories breakdown</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-black text-slate-900">{distributionTotal}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {distributionLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-64 w-full rounded-full" />
                </div>
              ) : certificateDistribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <PieChart className="w-16 h-16 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700 mb-2">No Data</h3>
                  <p className="text-slate-500">Issue certificates to see distribution</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <ChartContainer config={distributionConfig} className="h-64 w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={certificateDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {certificateDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                            stroke="white"
                            strokeWidth={3}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>

                  {/* Legend */}
                  <div className="space-y-3">
                    {certificateDistribution.slice(0, 5).map((item, index) => {
                      const percentage = distributionTotal > 0 ? Math.round((item.value / distributionTotal) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                            />
                            <span className="text-sm font-semibold text-slate-700 truncate">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900">{percentage}%</span>
                            <span className="text-xs text-slate-500 ml-1">({item.value})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Issuance vs Revocation — derived from real trend data (no fabricated KPIs) */}
        <Card className="border-0 shadow-xl bg-white dark:bg-neutral-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Issuance vs Revocation
              </CardTitle>
              <p className="text-slate-600 mt-1 font-medium">Monthly issued and revoked certificate volume</p>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {trendLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-80 w-full" />
              </div>
            ) : trendChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <BarChart3 className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">No Data Yet</h3>
                <p className="text-slate-500">Start issuing certificates to populate performance metrics</p>
              </div>
            ) : (
              <ChartContainer config={trendChartConfig} className="h-80 w-full">
                <BarChart
                  data={trendChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="issued" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} animationDuration={1500} animationEasing="ease-out" />
                  <Bar dataKey="revoked" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} animationDuration={1500} animationEasing="ease-out" animationBegin={300} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature & Usage Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Trust & Verification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrustFeatureCard 
              icon={CheckCircle}
              title="Instant Verification"
              description="Verify authenticity in seconds, anywhere"
              color="blue"
            />
            <TrustFeatureCard 
              icon={Shield}
              title="Tamper-Proof"
              description="Records are secured and cannot be altered"
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
          <Card className="border border-neutral-200 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden rounded-xl">
            <CardContent className="p-0">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 dark:bg-neutral-50/50">
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    Current Subscription
                  </p>
                  <p className="text-sm font-bold text-neutral-900 mt-1">
                    {(commercialSub?.planKey || commercialSub?.planId || "starter").toString().replace(/_/g, " ").toUpperCase()} PLAN
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/institution/subscription")}
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/institution/certificates")} className="text-primary font-bold">
            View All
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <Card className="border-0 shadow-sm rounded-xl bg-white dark:bg-neutral-900 overflow-hidden">
          <CardContent className="p-0">
            {recentCertificates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-100">
                  <Award className="w-8 h-8 text-neutral-300" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">No certificates yet</h3>
                <p className="text-neutral-500 mb-6 max-w-xs mx-auto">Start issuing verifiable credentials to your students.</p>
                <Button onClick={() => navigate("/institution/issue")} className="shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  Issue First Certificate
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recentCertificates.map((cert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-5 hover:bg-neutral-50 dark:bg-neutral-50 transition-colors group cursor-pointer" onClick={() => navigate(`/institution/certificates/${cert.id}`)}>
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
                        <p className="text-sm font-medium text-neutral-900">{cert.issuedAt && isValid(new Date(cert.issuedAt)) ? format(new Date(cert.issuedAt), "MMM dd, yyyy") : "N/A"}</p>
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
    <Card className="border-0 shadow-sm hover:shadow-md transition-all group rounded-xl bg-white dark:bg-neutral-900 overflow-hidden">
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
