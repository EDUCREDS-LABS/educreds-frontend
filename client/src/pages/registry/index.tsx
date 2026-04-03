import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Layers,
  Vote,
  BarChart3,
  Zap,
  Activity,
  Award,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/loading-skeleton';
import ModernHeader from '@/components/modern/ModernHeader';
import ModernFooter from '@/components/modern/ModernFooter';
import { useSystemMetrics } from '@/hooks/useGovernance';
import InstitutionsTab from './components/InstitutionsTab';
import TransactionsTab from './components/TransactionsTab';
import ProposalsTab from './components/ProposalsTab';
import AnalyticsTab from './components/AnalyticsTab';

// ── Live indicator ─────────────────────────────────────────────────────────
function LivePulse() {
  return (
    <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

// ── Summary stat ───────────────────────────────────────────────────────────
interface SumStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  isLoading?: boolean;
}

function SumStat({ icon: Icon, label, value, color, isLoading }: SumStatProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="h-5 w-12 rounded mb-0.5" />
        ) : (
          <p className="text-lg font-black text-white leading-none">
            {value}
          </p>
        )}
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Tab trigger ────────────────────────────────────────────────────────────
interface TabTriggerProps {
  value: string;
  icon: React.ElementType;
  label: string;
}

function StyledTabTrigger({ value, icon: Icon, label }: TabTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      className="flex items-center gap-2 data-[state=active]:bg-neutral-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-xl px-4 h-10 text-slate-600 font-bold text-xs uppercase tracking-widest transition-all"
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function TrustRegistry() {
  const [activeTab, setActiveTab] = useState('institutions');
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();

  return (
    <div className="min-h-screen bg-neutral-50">
      <ModernHeader onStudentPortalClick={() => {}} />

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-10 bg-neutral-900 overflow-hidden text-white">
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <Badge className="bg-blue-600 text-white border-none px-4 py-1 font-black uppercase tracking-widest text-[10px] rounded-full">
                Protocol Transparency
              </Badge>
              <LivePulse />
            </div>

            <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tighter mb-4 italic uppercase">
              Institutional{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Trust Registry
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              A transparent, real-time window into the EduCreds protocol — explore institutions,
              blockchain transactions, governance proposals, and on-chain analytics.
              Powered by{' '}
              <span className="text-white font-semibold">Proof of Institutional Credibility (PoIC)</span>{' '}
              scores.
            </p>
          </motion.div>

          {/* Summary stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10 flex flex-wrap gap-8 border-t border-white/10 pt-8"
          >
            <SumStat
              icon={Users}
              label="Institutions"
              value={metrics?.totalInstitutions?.toLocaleString() ?? '—'}
              color="bg-blue-600"
              isLoading={metricsLoading}
            />
            <div className="w-px bg-white/10 hidden sm:block" />
            <SumStat
              icon={Award}
              label="Avg PoIC"
              value={
                metrics?.averagePoICScore != null
                  ? `${metrics.averagePoICScore.toFixed(0)}/100`
                  : '—'
              }
              color="bg-emerald-600"
              isLoading={metricsLoading}
            />
            <div className="w-px bg-white/10 hidden sm:block" />
            <SumStat
              icon={Activity}
              label="Active Proposals"
              value={metrics?.activeProposals?.toLocaleString() ?? '—'}
              color="bg-amber-600"
              isLoading={metricsLoading}
            />
            <div className="w-px bg-white/10 hidden sm:block" />
            <SumStat
              icon={Zap}
              label="System Health"
              value={
                metrics?.systemHealthScore != null
                  ? `${metrics.systemHealthScore.toFixed(0)}%`
                  : '—'
              }
              color="bg-violet-600"
              isLoading={metricsLoading}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tab navigation */}
          <div className="sticky top-16 z-20 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 bg-neutral-50/95 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm">
            <TabsList className="bg-neutral-200/50 rounded-2xl p-1.5 gap-1 w-full sm:w-auto border border-neutral-300/30">
              <StyledTabTrigger value="institutions" icon={Building2} label="Institutions" />
              <StyledTabTrigger value="transactions" icon={Layers} label="Transactions" />
              <StyledTabTrigger value="proposals" icon={Vote} label="Proposals & Votes" />
              <StyledTabTrigger value="analytics" icon={BarChart3} label="Analytics" />
            </TabsList>
          </div>

          {/* ── Institutions tab ── */}
          <TabsContent value="institutions" className="mt-0 focus-visible:outline-none">
            <InstitutionsTab />
          </TabsContent>

          {/* ── Transactions tab ── */}
          <TabsContent value="transactions" className="mt-0 focus-visible:outline-none">
            <TransactionsTab />
          </TabsContent>

          {/* ── Proposals tab ── */}
          <TabsContent value="proposals" className="mt-0 focus-visible:outline-none">
            <ProposalsTab />
          </TabsContent>

          {/* ── Analytics tab ── */}
          <TabsContent value="analytics" className="mt-0 focus-visible:outline-none">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </section>

      <ModernFooter />
    </div>
  );
}
