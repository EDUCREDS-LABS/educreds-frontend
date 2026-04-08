import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { API_CONFIG } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Award, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Activity,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsData {
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  certificatesByType: { type: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Count",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

const AnalyticsPage = () => {
  const { data: stats, isLoading, error } = useQuery<StatsData>({
    queryKey: ['institution-analytics'],
    queryFn: async () => {
      const response = await axios.get(`${API_CONFIG.CERT}/api/stats`, { headers: getAuthHeaders() });
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-[32px]" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[40px]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-none shadow-xl bg-red-50 dark:bg-red-950/20 rounded-3xl p-10 text-center">
        <XCircle className="size-12 text-red-500 mx-auto mb-4" />
        <CardTitle className="text-red-900 dark:text-red-100">Analytics Error</CardTitle>
        <CardDescription className="text-red-700 dark:text-red-300">Failed to load institutional performance data.</CardDescription>
      </Card>
    );
  }

  const statCards = [
    { label: "Total Issuance", value: stats.totalCertificates, sub: "Historical Lifetime", icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Active Nodes", value: stats.activeCertificates, sub: "Verified Authority", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Revocation Log", value: stats.revokedCertificates, sub: "Integrity Events", icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <BarChart3 className="size-4" />
            Network Performance
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
            Institutional <span className="text-primary">Analytics</span>.
          </h1>
        </div>
        <Badge className="bg-neutral-900 text-white rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">
          Live Audit Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] group overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{s.label}</p>
                <div className={cn("size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", s.bg, s.color)}>
                  <s.icon className="size-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">{s.value}</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-black uppercase tracking-wider">{s.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
        <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[9px] mb-2">
            <TrendingUp className="size-3" /> Distribution Matrix
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">Authority Distribution</CardTitle>
          <CardDescription>Volume split across institutional cryptographic credential types.</CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart data={stats.certificatesByType}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-neutral-100 dark:stroke-neutral-800" />
              <XAxis 
                dataKey="type" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="count" 
                fill="var(--color-primary)" 
                radius={[8, 8, 0, 0]} 
                barSize={60}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
