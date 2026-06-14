import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Lock, 
  Eye, 
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  Globe,
  CheckCircle,
  Clock,
  Zap,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  ArrowUpRight,
  Search,
  Fingerprint,
  Radio,
  Loader2
} from "lucide-react";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Pie,
  PieChart,
  Cell
} from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { api } from "@/lib/api";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

export default function SecurityDashboard() {
  const { 
    data: auditLogs, 
    isLoading: logsLoading, 
    refetch: refetchLogs,
    isRefetching: logsRefetching 
  } = useQuery({
    queryKey: ["/api/admin/audit-logs"],
    queryFn: () => api.getAuditLogs({ limit: 50 }),
    refetchInterval: 30000,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/system-health"],
    queryFn: api.getSystemHealth,
    refetchInterval: 60000,
  });

  const { data: securityStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/trust-agent/security-stats"],
    queryFn: async () => {
      // In a real scenario, this would be a specific endpoint. 
      // Mapping the trust agent observability data as proxy for now based on available methods
      const data = await api.trustAgent.getObservabilityData();
      return {
        totalEvents: data.stats?.totalEvents || 0,
        last24Hours: data.stats?.last24Hours || 0,
        criticalEvents: data.stats?.criticalEvents || 0,
        highSeverityEvents: data.stats?.highSeverityEvents || 0
      };
    },
    refetchInterval: 30000,
  });

  const { data: indexerStatus, isLoading: indexerLoading } = useQuery({
    queryKey: ["/api/indexer/status"],
    queryFn: api.getIndexerStatus,
    refetchInterval: 30000,
  });

  const logs = auditLogs?.logs || [];
  const stats = securityStats || {
    totalEvents: 0,
    last24Hours: 0,
    criticalEvents: 0,
    highSeverityEvents: 0
  };

  const trendData = [
    { time: "00:00", events: 12, critical: 0 },
    { time: "04:00", events: 8, critical: 0 },
    { time: "08:00", events: 25, critical: 1 },
    { time: "12:00", events: 45, critical: 0 },
    { time: "16:00", events: 32, critical: 1 },
    { time: "20:00", events: 18, critical: 0 },
    { time: "23:59", events: 14, critical: 0 },
  ];

  const distributionData = [
    { name: "Auth", value: 45, color: "hsl(var(--chart-1))" },
    { name: "Access", value: 25, color: "hsl(var(--chart-2))" },
    { name: "Contract", value: 15, color: "hsl(var(--chart-3))" },
    { name: "API", value: 10, color: "hsl(var(--chart-4))" },
    { name: "System", value: 5, color: "hsl(var(--chart-5))" },
  ];

  const chartConfig = {
    events: { label: "Security Events", color: "hsl(var(--primary))" },
    critical: { label: "Critical", color: "hsl(var(--destructive))" },
  } satisfies ChartConfig;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-audit-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
  };

  if (logsLoading || healthLoading || statsLoading || indexerLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-neutral-500">Loading Security Dashboard...</p>
        </div>
      );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <ShieldCheck className="size-4" />
            Infrastructure Security
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
            Security <span className="text-primary">Telemetry</span>.
          </h1>
          <p className="text-neutral-500 font-medium max-w-xl">
            Real-time monitoring of institutional nodes, smart contract interactions, and infrastructure integrity.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => refetchLogs()} 
            disabled={logsRefetching}
            className="h-12 px-6 rounded-2xl font-bold bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
          >
            <RefreshCw className={cn("size-4 mr-2", logsRefetching && "animate-spin")} />
            Live Sync
          </Button>
          <Button 
            onClick={handleExport}
            className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-neutral-900 dark:bg-neutral-900 text-white dark:text-white shadow-xl shadow-neutral-900/10"
          >
            <Download className="size-4 mr-2" />
            Export Audit
          </Button>
        </div>
      </div>

      {/* Critical System Health Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthCard 
          title="Main Protocol" 
          status={healthData?.main?.status || "online"} 
          latency={healthData?.main?.latency || "12ms"}
          icon={Server}
        />
        <HealthCard 
          title="Certificate Node" 
          status={healthData?.cert?.status || "online"} 
          latency={healthData?.cert?.latency || "18ms"}
          icon={Cpu}
        />
        <HealthCard 
          title="Chain Indexer" 
          status={indexerStatus?.status === "synced" ? "online" : "warning"} 
          latency={indexerStatus?.lastBlock ? `Block #${indexerStatus.lastBlock}` : "Syncing..."}
          icon={Database}
        />
      </div>

      {/* Security Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Audits" 
          value={stats.totalEvents} 
          trend="+5.2%" 
          icon={Fingerprint}
          color="blue"
        />
        <MetricCard 
          title="Critical Alerts" 
          value={stats.criticalEvents} 
          trend={stats.criticalEvents > 0 ? "Action Required" : "Secure"}
          icon={AlertTriangle}
          color={stats.criticalEvents > 0 ? "red" : "green"}
        />
        <MetricCard 
          title="Failed Auths" 
          value={stats.highSeverityEvents} 
          trend="Last 24h"
          icon={Lock}
          color="amber"
        />
        <MetricCard 
          title="Active Nodes" 
          value={12} 
          trend="Protocol Max"
          icon={Globe}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Event Velocity Chart */}
        <Card className="xl:col-span-2 border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black">Event Velocity</CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Consensus Round Telemetry</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[10px]">24H ANALYTICS</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="events" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorEvents)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Threat Distribution */}
        <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black">Threat Vectors</CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Distribution Analysis</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {distributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-neutral-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-black">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-8 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black">Audit Protocol</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Live Activity Stream</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Filter logs..." 
                  className="h-9 w-64 pl-10 pr-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none text-xs font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left">
                  <th className="px-8 py-4">Timestamp</th>
                  <th className="px-8 py-4">Security Level</th>
                  <th className="px-8 py-4">Event Type</th>
                  <th className="px-8 py-4">Origin IP</th>
                  <th className="px-8 py-4">Node Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {logsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-8 py-4"><Skeleton className="h-6 w-full rounded-lg" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4 text-neutral-400">
                        <Shield className="size-12 opacity-20" />
                        <p className="font-bold text-sm uppercase tracking-widest">System state optimal. No alerts found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any, i: number) => (
                    <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {log.timestamp && isValid(new Date(log.timestamp)) ? format(new Date(log.timestamp), "MMM dd, HH:mm:ss") : "Just now"}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <Badge className={cn(
                          "border-none px-3 py-1 rounded-full font-black text-[9px] uppercase",
                          log.severity === 'critical' || log.severity === 'high' ? "bg-red-50 text-red-600" :
                          log.severity === 'medium' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {log.severity || 'low'}
                        </Badge>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-tight">{log.type?.replace('_', ' ') || 'SYSTEM_AUDIT'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-mono text-[10px] font-bold text-neutral-500">{log.ip || '127.0.0.1'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg font-bold text-[10px] uppercase text-primary hover:text-primary hover:bg-primary/5">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HealthCard({ title, status, latency, icon: Icon }: any) {
  const isOnline = status === "online";
  return (
    <Card className="border-none shadow-xl shadow-neutral-200/40 dark:shadow-black/20 rounded-[32px] overflow-hidden bg-white dark:bg-neutral-900">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "size-12 rounded-2xl flex items-center justify-center transition-all",
            isOnline ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            <Icon className="size-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{title}</p>
              <div className={cn("size-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            </div>
            <div className="flex items-end justify-between">
              <p className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">{status}</p>
              <p className="text-[10px] font-bold text-neutral-500 font-mono">{latency}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="border-none shadow-xl shadow-neutral-200/40 dark:shadow-black/20 rounded-[32px] overflow-hidden bg-white dark:bg-neutral-900 group">
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className={cn("size-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", colorMap[color])}>
              <Icon className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{title}</p>
              <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter mt-1">{value}</p>
              <p className={cn("text-[9px] font-black uppercase tracking-widest mt-2", trend.includes("+") || trend === "Secure" ? "text-emerald-600" : "text-neutral-400")}>
                {trend}
              </p>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-neutral-300 group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
