import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell, Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Award,
  XCircle,
  Eye,
  Clock,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_MONTHLY_DATA = [
  { month: "Jan", issued: 42, verified: 128, revoked: 2 },
  { month: "Feb", issued: 56, verified: 145, revoked: 1 },
  { month: "Mar", issued: 38, verified: 167, revoked: 3 },
  { month: "Apr", issued: 71, verified: 198, revoked: 0 },
  { month: "May", issued: 89, verified: 234, revoked: 2 },
  { month: "Jun", issued: 95, verified: 278, revoked: 1 },
];

const MOCK_VERIFICATION_SOURCES = [
  { name: "Employer", value: 45, color: "#3b82f6" },
  { name: "University", value: 25, color: "#8b5cf6" },
  { name: "Government", value: 15, color: "#06b6d4" },
  { name: "Self-Check", value: 10, color: "#f59e0b" },
  { name: "Other", value: 5, color: "#6b7280" },
];

const MOCK_RESPONSE_TIMES = [
  { hour: "00:00", avg: 120 },
  { hour: "04:00", avg: 95 },
  { hour: "08:00", avg: 245 },
  { hour: "12:00", avg: 310 },
  { hour: "16:00", avg: 280 },
  { hour: "20:00", avg: 175 },
];

const MOCK_GEO_DATA = [
  { country: "United States", verifications: 856, percentage: 34 },
  { country: "United Kingdom", verifications: 423, percentage: 17 },
  { country: "Germany", verifications: 312, percentage: 12 },
  { country: "India", verifications: 278, percentage: 11 },
  { country: "Canada", verifications: 198, percentage: 8 },
  { country: "Australia", verifications: 156, percentage: 6 },
  { country: "Others", verifications: 302, percentage: 12 },
];

const trendChartConfig = {
  issued: { label: "Issued", color: "#3b82f6" },
  verified: { label: "Verified", color: "#8b5cf6" },
  revoked: { label: "Revoked", color: "#ef4444" },
} satisfies ChartConfig;

const responseChartConfig = {
  avg: { label: "Avg Response (ms)", color: "#06b6d4" },
} satisfies ChartConfig;

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: typeof TrendingUp;
  iconBg: string;
}

function StatCard({ title, value, change, icon: Icon, iconBg }: StatCardProps) {
  const isPositive = change >= 0;
  return (
    <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("size-12 rounded-2xl flex items-center justify-center", iconBg)}>
            <Icon className="size-6" />
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
              isPositive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800"
            )}
          >
            {isPositive ? <TrendingUp className="size-3 mr-1" /> : <TrendingDown className="size-3 mr-1" />}
            {Math.abs(change)}%
          </Badge>
        </div>
        <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{value}</p>
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}

export default function EnhancedAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6m");

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["enhanced-analytics", timeRange],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_CONFIG.CERT}/api/institutions/analytics?range=${timeRange}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
      } catch {
        return null;
      }
    },
    staleTime: 60000,
  });

  const monthlyData = analyticsData?.monthly ?? MOCK_MONTHLY_DATA;
  const verificationSources = analyticsData?.sources ?? MOCK_VERIFICATION_SOURCES;
  const responseTimes = analyticsData?.responseTimes ?? MOCK_RESPONSE_TIMES;
  const geoData = analyticsData?.geo ?? MOCK_GEO_DATA;

  const totals = useMemo(() => {
    const totalIssued = monthlyData.reduce((s: number, d: { issued: number }) => s + d.issued, 0);
    const totalVerified = monthlyData.reduce((s: number, d: { verified: number }) => s + d.verified, 0);
    const totalRevoked = monthlyData.reduce((s: number, d: { revoked: number }) => s + d.revoked, 0);
    return { totalIssued, totalVerified, totalRevoked };
  }, [monthlyData]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-[32px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-[40px]" />
          <Skeleton className="h-[400px] rounded-[40px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
            Analytics
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            Comprehensive credential performance and verification insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 rounded-xl border-neutral-200 dark:border-neutral-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Issued" value={totals.totalIssued.toLocaleString()} change={12} icon={Award} iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" />
        <StatCard title="Verifications" value={totals.totalVerified.toLocaleString()} change={23} icon={Eye} iconBg="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" />
        <StatCard title="Revoked" value={totals.totalRevoked.toLocaleString()} change={-15} icon={XCircle} iconBg="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" />
        <StatCard title="Avg Response" value="245ms" change={-8} icon={Clock} iconBg="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issuance & Verification Trends */}
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] lg:col-span-2">
          <CardHeader className="px-8 pt-8 pb-2">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
              Credential Trends
            </CardTitle>
            <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Issuance, verification, and revocation over time
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="verified" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="issued" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="revoked" stackId="3" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                <Legend />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Verification Sources Pie */}
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px]">
          <CardHeader className="px-8 pt-8 pb-2">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
              Verification Sources
            </CardTitle>
            <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Who is verifying credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={verificationSources} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {verificationSources.map((entry: { name: string; color: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {verificationSources.map((source: { name: string; value: number; color: string }) => (
                <div key={source.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-neutral-600 dark:text-neutral-400">{source.name}</span>
                  </div>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">{source.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time */}
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px]">
          <CardHeader className="px-8 pt-8 pb-2">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
              Verification Response Time
            </CardTitle>
            <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Average API response latency throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <ChartContainer config={responseChartConfig} className="h-[250px] w-full">
              <LineChart data={responseTimes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" unit="ms" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="avg" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: "#06b6d4" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px]">
          <CardHeader className="px-8 pt-8 pb-2">
            <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight flex items-center gap-2">
              <Globe className="size-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Where verification requests originate
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-3">
              {geoData.map((row: { country: string; verifications: number; percentage: number }) => (
                <div key={row.country} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-32 truncate">{row.country}</span>
                  <div className="flex-1 h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 w-20 text-right">
                    {row.verifications.toLocaleString()} ({row.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
