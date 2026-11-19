import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Award,
  FileCheck,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  usePublicSystemMetrics,
  usePublicGovernanceSummary,
  usePublicPoICScores,
} from '@/hooks/useGovernance';

// ── Chart configs ──────────────────────────────────────────────────────────
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
  const { data: metrics, isLoading: metricsLoading } = usePublicSystemMetrics();
  const { data: summary, isLoading: summaryLoading } = usePublicGovernanceSummary();
  const { data: poicScores, isLoading: poicLoading } = usePublicPoICScores();

  // There is no historical issuance endpoint yet. Never infer a time series from votes.
  const poicDistribution = useMemo(() => {
    const validScores = (poicScores ?? []).filter(({ score }) =>
      Number.isFinite(score) && score >= 0 && score <= 100,
    );
    if (validScores.length === 0) return [];
    const buckets = [
      { range: '0–20', count: 0 },
      { range: '21–40', count: 0 },
      { range: '41–60', count: 0 },
      { range: '61–80', count: 0 },
      { range: '81–100', count: 0 },
    ];
    validScores.forEach(({ score }) => {
      const idx = score <= 20 ? 0 : Math.min(4, Math.ceil((score - 20) / 20));
      buckets[idx].count++;
    });
    return buckets;
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
      value: '—',
      subtitle: 'Issuance data unavailable',
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
      delay: 0.05,
    },
    {
      icon: Award,
      label: 'Avg PoIC Score',
      value: metrics?.averagePoICScore != null
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
                  Issuance Trend
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <p className="h-[220px] flex items-center justify-center text-sm text-slate-500" role="status">
                Insufficient data — historical issuance data is not available.
              </p>
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
              ) : poicDistribution.length === 0 ? (
                <p className="h-[220px] flex items-center justify-center text-sm text-slate-500" role="status">
                  Insufficient data — no assessed PoIC scores yet.
                </p>
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
