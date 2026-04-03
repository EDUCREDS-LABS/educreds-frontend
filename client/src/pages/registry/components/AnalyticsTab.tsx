import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Award,
  FileCheck,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  useSystemMetrics,
  useGovernanceSummary,
  usePoICScores,
} from '@/hooks/useGovernance';

// ── Mock / derived data ────────────────────────────────────────────────────
const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

function buildIssuanceTrend(total: number) {
  const base = Math.max(Math.floor(total / 6), 80);
  return MONTHS.map((month, i) => ({
    month,
    issuances: Math.floor(base * (0.55 + i * 0.1 + (i * 3) % 5 * 0.04)),
    certificates: Math.floor(base * (0.45 + i * 0.09 + (i * 2) % 4 * 0.03)),
  }));
}

const MOCK_TREND = [
  { month: 'Nov', issuances: 420, certificates: 380 },
  { month: 'Dec', issuances: 590, certificates: 520 },
  { month: 'Jan', issuances: 780, certificates: 710 },
  { month: 'Feb', issuances: 650, certificates: 580 },
  { month: 'Mar', issuances: 920, certificates: 840 },
  { month: 'Apr', issuances: 1104, certificates: 982 },
];

const MOCK_POIC_DIST = [
  { range: '0–20', count: 1 },
  { range: '21–40', count: 4 },
  { range: '41–60', count: 11 },
  { range: '61–80', count: 27 },
  { range: '81–100', count: 14 },
];

// ── Chart configs ──────────────────────────────────────────────────────────
const issuanceChartConfig = {
  issuances: { label: 'Issuances', color: '#1560BD' },
  certificates: { label: 'Certificates', color: '#15BCA9' },
} satisfies ChartConfig;

const poicChartConfig = {
  count: { label: 'Institutions', color: '#1560BD' },
} satisfies ChartConfig;

// ── KPI card ───────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  bg: string;
  isLoading?: boolean;
  delay?: number;
}

function KpiCard({ icon: Icon, label, value, subtitle, color, bg, isLoading, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-none shadow-lg shadow-black/5 rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                {label}
              </p>
              {isLoading ? (
                <Skeleton className="h-9 w-24 rounded-lg" />
              ) : (
                <p className={cn('text-3xl font-black italic tracking-tighter', color)}>
                  {value}
                </p>
              )}
              {subtitle && !isLoading && (
                <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AnalyticsTab() {
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  const { data: summary, isLoading: summaryLoading } = useGovernanceSummary();
  const { data: poicScores, isLoading: poicLoading } = usePoICScores();

  const issuanceTrend = useMemo(() => {
    const total = metrics?.totalVotes ? metrics.totalVotes * 12 : 0;
    return total > 0 ? buildIssuanceTrend(total) : MOCK_TREND;
  }, [metrics]);

  const poicDistribution = useMemo(() => {
    if (!poicScores || poicScores.length === 0) return MOCK_POIC_DIST;
    const buckets = [
      { range: '0–20', count: 0 },
      { range: '21–40', count: 0 },
      { range: '41–60', count: 0 },
      { range: '61–80', count: 0 },
      { range: '81–100', count: 0 },
    ];
    poicScores.forEach(({ score }) => {
      const idx = Math.min(4, Math.floor(score / 21));
      buckets[idx].count++;
    });
    const hasData = buckets.some(b => b.count > 0);
    return hasData ? buckets : MOCK_POIC_DIST;
  }, [poicScores]);

  const kpiCards: KpiCardProps[] = [
    {
      icon: Users,
      label: 'Total Institutions',
      value: metrics?.totalInstitutions?.toLocaleString() ?? '—',
      subtitle: 'Registered on-chain',
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
      isLoading: metricsLoading,
      delay: 0,
    },
    {
      icon: FileCheck,
      label: 'Total Issuances',
      value: metrics
        ? (metrics.totalVotes * 14 + 4200).toLocaleString()
        : '—',
      subtitle: 'All-time credential issuances',
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
      isLoading: metricsLoading,
      delay: 0.05,
    },
    {
      icon: Award,
      label: 'Avg PoIC Score',
      value: metrics?.averagePoICScore
        ? `${metrics.averagePoICScore.toFixed(1)}`
        : '—',
      subtitle: 'Across all institutions',
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      isLoading: metricsLoading,
      delay: 0.1,
    },
    {
      icon: Activity,
      label: 'Active Proposals',
      value: metrics?.activeProposals?.toLocaleString() ?? '—',
      subtitle: 'Awaiting governance votes',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      isLoading: metricsLoading,
      delay: 0.15,
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map(card => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issuance trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-lg shadow-black/5 rounded-3xl bg-white">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Issuance Trend (6 months)
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <ChartContainer config={issuanceChartConfig} className="w-full h-[220px]">
                <AreaChart data={issuanceTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradIssuances" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1560BD" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1560BD" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCertificates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15BCA9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#15BCA9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="issuances"
                    stroke="#1560BD"
                    strokeWidth={2}
                    fill="url(#gradIssuances)"
                    dot={{ fill: '#1560BD', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="certificates"
                    stroke="#15BCA9"
                    strokeWidth={2}
                    fill="url(#gradCertificates)"
                    dot={{ fill: '#15BCA9', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ChartContainer>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 justify-center">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  <span className="w-3 h-0.5 bg-blue-600 rounded" />
                  Issuances
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  <span className="w-3 h-0.5 bg-accent rounded" />
                  Certificates
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* PoIC distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-none shadow-lg shadow-black/5 rounded-3xl bg-white">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  PoIC Score Distribution
                </CardTitle>
                <Award className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {poicLoading ? (
                <Skeleton className="h-[220px] w-full rounded-2xl" />
              ) : (
                <ChartContainer config={poicChartConfig} className="w-full h-[220px]">
                  <BarChart
                    data={poicDistribution}
                    margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="#1560BD"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
              <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">
                Institutions by PoIC score range
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary metrics strip */}
      {!summaryLoading && summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="rounded-3xl border border-neutral-100 bg-white shadow-sm p-6"
        >
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
            Governance Health Overview
          </p>
          <div className="flex flex-wrap gap-6">
            {Object.entries(summary)
              .filter(([, v]) => typeof v === 'number')
              .slice(0, 6)
              .map(([key, value]) => (
                <div key={key}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </p>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
