import React, { useState } from 'react';
import { useIndexerStats, useSyncStatus, useFailedEvents, useDLQStats } from '@/hooks/useIndexer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  Database, 
  Activity, 
  Zap, 
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Box,
  HardDrive,
  Cpu,
  Globe
} from 'lucide-react';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * Blockchain Indexer Dashboard
 * Displays real-time indexer statistics and blockchain event tracking
 */
export const BlockchainIndexerDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useIndexerStats();
  const { data: syncStatus, isLoading: syncLoading } = useSyncStatus();
  const { data: failedEvents } = useFailedEvents({ limit: 5 });
  const { data: dlqStats } = useDLQStats();

  const isHealthy = stats?.errors?.length === 0 && syncStatus?.status === 'idle';

  return (
    <div className="w-full space-y-10 p-2 sm:p-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <Database className="size-4" />
            Distributed Ledger Intelligence
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
            Chain <span className="text-primary">Indexer</span>.
          </h1>
          <p className="text-neutral-500 font-medium max-w-xl">
            Real-time event synchronization and cryptographic tracking for all protocol-level blockchain interactions.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-6 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-inner">
            <div className={cn(
              "size-2 rounded-full",
              isHealthy ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            )} />
            <span className="text-[10px] font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">
              {isHealthy ? "Infrastructure Stable" : "Intervention Required"}
            </span>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => refetchStats()}
            disabled={statsLoading}
            className="size-12 rounded-2xl border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-primary transition-all"
          >
            <RefreshCw className={cn("size-5", statsLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Main Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
        <TelemetryCard 
          title="Total Events" 
          value={stats?.totalEvents?.toLocaleString() || 0} 
          subValue={stats?.latestTimestamp ? `Last Sync: ${new Date(stats.latestTimestamp).toLocaleTimeString()}` : 'Initializing...'}
          icon={Activity}
          color="blue"
          loading={statsLoading}
        />
        <TelemetryCard 
          title="Latest Block" 
          value={stats?.lastBlockProcessed?.toLocaleString() || 0} 
          subValue={syncStatus?.estimatedBlocksBehind > 0 ? `${syncStatus.estimatedBlocksBehind} blocks behind` : 'Synchronized'}
          icon={Box}
          color="indigo"
          loading={statsLoading || syncLoading}
          alert={syncStatus?.estimatedBlocksBehind > 100}
        />
        <TelemetryCard 
          title="Pending Jobs" 
          value={stats?.pendingJobs || 0} 
          subValue="Consensus Queue"
          icon={Zap}
          color="amber"
          loading={statsLoading}
          alert={stats?.pendingJobs > 100}
        />
        <TelemetryCard 
          title="Node State" 
          value={syncStatus?.status || 'Unknown'} 
          subValue={syncStatus?.lastUpdated ? `Heartbeat: ${new Date(syncStatus.lastUpdated).toLocaleTimeString()}` : 'No Signal'}
          icon={Cpu}
          color={syncStatus?.status === 'idle' ? 'green' : 'blue'}
          loading={syncLoading}
          isStatus
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        {/* Failed Events / DLQ Section */}
        <Card className="lg:col-span-8 border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
          <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black">Dead Letter Queue</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Failed Protocol Events</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest border-red-200 text-red-500 bg-red-50">
              {failedEvents?.data?.length || 0} Critical Failures
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left">
                    <th className="px-10 py-5">Event Identifier</th>
                    <th className="px-10 py-5">Network Hash</th>
                    <th className="px-10 py-5">Error Context</th>
                    <th className="px-10 py-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {statsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}><td colSpan={4} className="px-10 py-6"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>
                    ))
                  ) : !failedEvents?.data || failedEvents.data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-24 text-center">
                        <div className="flex flex-col items-center gap-4 text-neutral-300">
                          <ShieldCheck className="size-16 opacity-20" />
                          <p className="font-black uppercase tracking-[0.2em] text-[10px]">All network events successfully processed</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    failedEvents.data.map((event: any) => (
                      <tr key={event.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                        <td className="px-10 py-6">
                          <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">{event.eventName || 'UNKNOWN_EVENT'}</p>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Block #{event.blockNumber}</p>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-lg w-fit">
                            {event.transactionHash?.substring(0, 12)}...
                          </div>
                        </td>
                        <td className="px-10 py-6 max-w-xs">
                          <p className="text-[10px] font-medium text-red-500 truncate leading-relaxed">
                            {event.error || 'Infrastructure timeout during ingestion'}
                          </p>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <Button variant="ghost" size="sm" className="rounded-lg h-9 px-4 font-black text-[9px] uppercase tracking-widest text-primary hover:bg-primary/5 transition-all">
                            Re-Ingest
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

        {/* Sync Progress & Shard Info */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-neutral-900 text-white group">
            <CardHeader className="p-10 pb-4">
              <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary mb-8 backdrop-blur-xl border border-white/5 transition-transform group-hover:scale-110">
                <Globe className="size-8" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight leading-tight italic uppercase">Network Shard #142</CardTitle>
              <CardDescription className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Mainnet Ingestion Cluster</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Synchronization Load</span>
                   <span className="text-2xl font-black italic tracking-tighter">98.4%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "98.4%" }}
                    transition={{ duration: 2, ease: "circOut" }}
                    className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(21,96,189,0.8)]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm space-y-1">
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Active Shards</p>
                   <p className="text-xl font-black tracking-tighter">12</p>
                </div>
                <div className="p-5 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm space-y-1">
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Global Peers</p>
                   <p className="text-xl font-black tracking-tighter">142</p>
                </div>
              </div>

              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] leading-relaxed">
                The EduCreds indexer maintains an immutable state of all on-chain certificate events for high-performance dapp rendering.
              </p>
            </CardContent>
          </Card>

          <div className="p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-[40px] bg-neutral-50/50 dark:bg-neutral-900/50">
             <div className="flex items-center gap-4 mb-6">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <HardDrive className="size-5" />
                </div>
                <h4 className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">Consensus Log</h4>
             </div>
             <div className="space-y-4">
                {[
                  "Shard synchronized with L2",
                  "Consensus audit completed for Block #12485",
                  "AI agent ETA re-calibrated models",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] font-medium text-neutral-500">{item}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function TelemetryCard({ title, value, subValue, icon: Icon, color, loading, isStatus, alert }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800",
    amber: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800",
  };

  return (
    <Card className={cn(
      "border-none shadow-xl shadow-neutral-200/40 dark:shadow-black/20 rounded-[32px] overflow-hidden bg-white dark:bg-neutral-900 group transition-all hover:shadow-2xl",
      alert && "ring-2 ring-red-500/20"
    )}>
      <CardContent className="p-8">
        {loading ? (
          <div className="space-y-4">
             <Skeleton className="size-12 rounded-2xl" />
             <Skeleton className="h-8 w-3/4 rounded-lg" />
             <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", colorMap[color])}>
                <Icon className="size-7" />
              </div>
              {alert && <div className="size-2.5 rounded-full bg-red-500 animate-ping" />}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">{title}</p>
              <p className={cn(
                "text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none pt-1",
                isStatus && "uppercase italic"
              )}>
                {value}
              </p>
              <p className={cn(
                "text-[9px] font-black uppercase tracking-widest pt-2",
                alert ? "text-red-500" : "text-neutral-500"
              )}>
                {subValue}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
