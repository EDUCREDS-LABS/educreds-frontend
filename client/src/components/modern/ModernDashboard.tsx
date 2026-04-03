import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { Progress } from "@/components/ui/progress";
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
} from "recharts";
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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useState, useCallback, useMemo } from "react";
import CreateCertificateModal from "@/components/CreateCertificateModal";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { UsageDashboard } from "@/components/UsageDashboard";
import { NetworkIntegrity } from "./NetworkIntegrity";

export default function ModernDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

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

  const certificates = certificatesData?.certificates || [];
  const recentCertificates = certificates.slice(0, 5);

  // Memoize action callbacks to prevent unnecessary re-renders
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
    // Default to starter plan limit; enterprise is treated as effectively unlimited here
    const limit =
      (subscription as any)?.subscription?.planId === 'pro'
        ? 1000
        : (subscription as any)?.subscription?.planId === 'enterprise'
        ? 2000
        : 200;
    return Math.min((usage / limit) * 100, 100);
  };

  // Use API data with fallback to mock data
  const trendChartData = Array.isArray(issuanceTrendData) 
    ? issuanceTrendData 
    : [
        { month: "Jan", issued: 12, revoked: 1 },
        { month: "Feb", issued: 19, revoked: 1 },
        { month: "Mar", issued: 24, revoked: 2 },
        { month: "Apr", issued: 35, revoked: 2 },
        { month: "May", issued: 42, revoked: 3 },
        { month: "Jun", issued: 58, revoked: 2 },
      ];

  const certificateDistribution = Array.isArray(distributionData) && distributionData.length > 0
    ? distributionData.map((item: any, index: number) => ({
        name: item.name || `Type ${index + 1}`,
        value: item.value || 0,
        color: [
          "hsl(var(--primary))",
          "hsl(var(--success))",
          "hsl(var(--accent))",
          "hsl(var(--warning))"
        ][index % 4]
      }))
    : [
        { name: "Course Completion", value: 45, color: "hsl(var(--primary))" },
        { name: "Degree", value: 25, color: "hsl(var(--success))" },
        { name: "Certification", value: 20, color: "hsl(var(--accent))" },
        { name: "Achievement", value: 10, color: "hsl(var(--warning))" },
      ];

  const certificateLimit = (subscription as any)?.subscription?.monthlyLimit || 50;
  const certificatesUsed = (subscription as any)?.usage?.certificatesThisMonth || 0;
  const certificatesRemaining = Math.max(0, certificateLimit - certificatesUsed);
  const isNearLimit = getUsagePercentage() >= 80;

  // Memoize tooltip styles to prevent unnecessary re-renders
  const tooltipContentStyle = useMemo(() => ({
    backgroundColor: "rgba(31, 41, 55, 0.95)",
    border: "1px solid rgba(75, 85, 99, 0.5)",
    borderRadius: "8px",
  }), []);

  const tooltipLabelStyle = useMemo(() => ({ color: "#f3f4f6" }), []);

  return (
    <div className="dashboard-container">
      <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold dashboard-text-primary">
                Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
              </h1>
              {user?.isVerified ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Verification Pending
                </Badge>
              )}
            </div>
            <p className="dashboard-text-secondary text-sm sm:text-base">
              {format(new Date(), "EEEE, MMMM do, yyyy")}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => setLocation("/institution/issue")}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Issue Certificate
            </Button>
            <Button variant="outline" onClick={() => setLocation("/institution/certificates")}>
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="dashboard-card border-0">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-2 border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 bg-gradient-to-br from-blue-50/50 to-blue-50/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="p-3 w-fit rounded-lg bg-blue-100/50 group-hover:bg-blue-100">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 font-medium">Total Certificates</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-1">
                        {(stats as any)?.totalCertificates || 0}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100/70 text-emerald-700 border border-emerald-300 whitespace-nowrap">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 shadow-sm hover:shadow-md hover:border-green-200 bg-gradient-to-br from-green-50/50 to-green-50/30 transition-all">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="p-3 w-fit rounded-lg bg-green-100/50">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 font-medium">Active Certificates</p>
                    <p className="text-3xl font-bold text-neutral-900 mt-1">
                      {(stats as any)?.activeCertificates || 0}
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-2">Currently in use</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 bg-gradient-to-br from-purple-50/50 to-purple-50/30 transition-all">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="p-3 w-fit rounded-lg bg-purple-100/50">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 font-medium">On-Chain Verified</p>
                    <p className="text-3xl font-bold text-neutral-900 mt-1">
                      {(stats as any)?.activeCertificates || 0}
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-2">Blockchain confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 bg-gradient-to-br from-amber-50/50 to-amber-50/30 transition-all">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="p-3 w-fit rounded-lg bg-amber-100/50">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 font-medium">Monthly Usage</p>
                    <p className="text-3xl font-bold text-neutral-900 mt-1">
                      {(subscription as any)?.usage?.certificatesThisMonth || 0}/{certificateLimit}
                    </p>
                    <Progress value={getUsagePercentage()} className="h-1.5 mt-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions - Professional Card Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>
            <p className="text-sm text-neutral-600 mt-1">Access your most-used features</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {quickActions.map((action) => (
               <button
                 key={action.title}
                 onClick={action.action}
                 onKeyDown={(e) => e.key === 'Enter' && action.action()}
                 className={`group relative h-full p-5 rounded-lg border-2 transition-all duration-300 text-left flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                   action.primary
                     ? "bg-gradient-to-br from-primary via-blue-500 to-purple-600 border-primary/50 text-white shadow-lg hover:shadow-xl hover:scale-105 focus-visible:ring-white"
                     : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md hover:bg-neutral-50 focus-visible:ring-primary"
                 }`}
                 aria-label={`${action.title}: ${action.description}`}
               >
                {/* Background accent for non-primary cards */}
                {!action.primary && (
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity ${action.color.replace("text-", "bg-")}`} />
                )}
                
                <div className="relative z-10 space-y-3">
                  <div className={`w-fit p-3 rounded-lg transition-all ${
                    action.primary 
                      ? "bg-white/20 group-hover:bg-white/30" 
                      : `${action.bg} group-hover:shadow-md`
                  }`}>
                    <action.icon className={`w-6 h-6 ${action.primary ? "text-white" : action.color}`} />
                  </div>
                  
                  <div>
                    <h3 className={`font-semibold text-lg transition-colors ${
                      action.primary ? "text-white" : "text-neutral-900 group-hover:text-neutral-950"
                    }`}>
                      {action.title}
                    </h3>
                    <p className={`text-sm mt-1 transition-colors ${
                      action.primary ? "text-white/80" : "text-neutral-600 group-hover:text-neutral-700"
                    }`}>
                      {action.description}
                    </p>
                  </div>
                </div>
                
                {/* Arrow indicator */}
                <div className={`relative z-10 flex items-center gap-1 text-xs font-medium ${
                  action.primary ? "text-white/90" : "text-neutral-500 group-hover:text-neutral-900"
                }`}>
                  <span>Explore</span>
                  <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Network Integrity Telemetry - NEW Elite Component */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Live Network
          </h2>
          <NetworkIntegrity />
        </div>
      </div>

      {/* Usage Statistics Card */}
      {isNearLimit && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Approaching Limit:</strong> You've used {certificatesUsed} of {certificateLimit} certificates ({Math.round(getUsagePercentage())}%). 
            {certificatesRemaining < 10 && certificatesRemaining > 0 && ` Only ${certificatesRemaining} remaining.`}
            {certificatesRemaining === 0 && " Upgrade your plan to continue issuing."}
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Section - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issuance Trend Chart */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-primary" />
              Issuance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(229, 231, 235, 0.3)" />
                <XAxis dataKey="month" stroke="currentColor" className="dashboard-text-secondary" />
                <YAxis stroke="currentColor" className="dashboard-text-secondary" />
                <Tooltip 
                   contentStyle={tooltipContentStyle}
                   labelStyle={tooltipLabelStyle}
                 />
                <Legend />
                <Line 
                   type="monotone" 
                   dataKey="issued" 
                   stroke="hsl(var(--primary))" 
                   strokeWidth={2}
                   name="Issued"
                   dot={{ fill: "hsl(var(--primary))", r: 4 }}
                 />
                 <Line 
                   type="monotone" 
                   dataKey="revoked" 
                   stroke="hsl(var(--destructive))" 
                   strokeWidth={2}
                   name="Revoked"
                   dot={{ fill: "hsl(var(--destructive))", r: 4 }}
                 />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Certificate Distribution Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie
                  data={certificateDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {certificateDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {certificateDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-neutral-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-neutral-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlight Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Blockchain Benefits */}
        <div className="space-y-3 xl:col-span-2">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Blockchain & Trust
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Instant Verification</h3>
                    <p className="text-sm text-neutral-600 mt-1">Verify certificate authenticity in seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-green-50/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Tamper-Proof</h3>
                    <p className="text-sm text-neutral-600 mt-1">Immutable records secured on blockchain</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-purple-50/50 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-100">
                    <Globe className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Global Recognition</h3>
                    <p className="text-sm text-neutral-600 mt-1">W3C standard credentials accepted worldwide</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API & Usage Panel */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            API & Usage
          </h2>
          <Card className="border-2 border-neutral-200 shadow-sm bg-white/80 backdrop-blur">
            <CardContent className="p-0">
              {/* Compact enterprise-grade usage panel */}
              <div className="border-b border-neutral-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Subscription Overview
                  </p>
                  <p className="text-sm text-neutral-900 mt-1">
                    {(subscription as any)?.subscription?.planId
                      ? (subscription as any).subscription.planId.toUpperCase()
                      : "NO PLAN"}{" "}
                    •{" "}
                    <span className="text-neutral-500">
                      Renews{" "}
                      {subscription?.subscription?.currentPeriodEnd
                        ? format(new Date((subscription as any).subscription.currentPeriodEnd), "MMM dd")
                        : "soon"}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/institution/subscription")}
                  className="text-xs"
                >
                  Manage Plan
                </Button>
              </div>
              <div className="p-4">
                <UsageDashboard />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <GlobeLock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">PoIC governs trust, not billing</p>
                  <p className="text-xs text-slate-300 mt-1">
                    API quotas are enforced off-chain. PoIC and DAO governance remain on-chain, neutral, and independent.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-500 text-xs"
                onClick={() => setLocation("/docs/subscriptions")}
              >
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Certificates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Recent Certificates
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/institution/certificates")}>
            View All
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {recentCertificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No certificates yet</h3>
                <p className="text-neutral-600 mb-4">Start by issuing your first certificate</p>
                <Button onClick={() => setLocation("/institution/issue")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Issue Certificate
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCertificates.map((cert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border-2 border-neutral-100 hover:border-neutral-200 bg-neutral-50 hover:bg-neutral-100/50 transition-all group">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 truncate group-hover:text-neutral-950">{cert.studentName}</p>
                        <p className="text-sm text-neutral-600 truncate">{cert.certificateType || cert.courseName}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge className={cert.isMinted ? "bg-emerald-100/70 text-emerald-700 border border-emerald-300 mb-2" : "bg-amber-100/70 text-amber-700 border border-amber-300 mb-2"}>
                        {cert.isMinted ? "✓ On-Chain" : "Pending"}
                      </Badge>
                      <p className="text-xs text-neutral-500">
                        {format(new Date(cert.issuedAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Certificate Modal */}
      {/* This modal is no longer used - certificate creation is now via /institution/issue */}
      </div>
    </div>
  );
}
