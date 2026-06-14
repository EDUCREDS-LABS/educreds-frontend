import { Filter, AlertCircle, CheckCircle2, Clock, ShieldAlert, type LucideIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function Observability() {
  const { data: observabilityData, isLoading: isLoadingObs } = useQuery({
    queryKey: ['/api/trust-agent/observability'],
    queryFn: api.trustAgent.getObservabilityData,
    refetchInterval: 30000,
  });

  const { data: healthData, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['/api/trust-agent/health'],
    queryFn: api.trustAgent.getSystemHealth,
    refetchInterval: 30000,
  });

  if (isLoadingObs || isLoadingHealth) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-neutral-500">Connecting to Trust Agent...</p>
      </div>
    );
  }

  const reviewQueue = observabilityData?.reviewQueue || [];
  const auditTrail = observabilityData?.auditTrail || [];
  const stats = observabilityData?.stats || {
    pendingReviews: 0,
    resolved24h: 0,
    escalations: 0
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Observability Hub</h2>
        <p className="text-neutral-500 mt-1">Monitor system integrity, compliance queues, and audit trails.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl rounded-[32px] bg-white dark:bg-neutral-900">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-0">
            <div>
              <CardTitle className="text-xl font-bold">Manual Review Queue</CardTitle>
              <p className="text-xs text-neutral-500 mt-1">Pending verification requests requiring human intervention.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Filter size={14} /> Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {reviewQueue.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-8">No pending reviews.</p>
              ) : (
                reviewQueue.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-white/5 hover:border-emerald-500/20 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.priority === 'Critical' ? "bg-red-500/10 text-red-400" :
                        item.priority === 'High' ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {item.priority === 'Critical' ? <ShieldAlert size={20} /> : <Clock size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 dark:text-neutral-200">{item.id}</span>
                          <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                        </div>
                        <p className="text-sm text-neutral-500">{item.institution}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-300">{item.status}</p>
                        <p className="text-[10px] text-neutral-500">{item.time}</p>
                      </div>
                      <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Review</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[32px] bg-white dark:bg-neutral-900">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Compliance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-8">
              <StatItem label="Pending Reviews" value={String(stats.pendingReviews)} icon={Clock} color="text-amber-400" />
              <StatItem label="Resolved (24h)" value={String(stats.resolved24h)} icon={CheckCircle2} color="text-emerald-400" />
              <StatItem label="Escalations" value={String(stats.escalations)} icon={AlertCircle} color="text-red-400" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[32px] bg-white dark:bg-neutral-900">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-500">Audit Trail Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {auditTrail.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center">No recent audit logs.</p>
              ) : (
                auditTrail.map((log: any, i: number) => (
                  <div key={i} className="relative pl-6 border-l border-neutral-200 dark:border-neutral-800 space-y-1">
                    <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <p className="text-xs font-bold text-neutral-900 dark:text-neutral-200">{log.event}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">{log.timestamp}</p>
                    <p className="text-[11px] text-neutral-400 italic">By {log.entity}</p>
                  </div>
                ))
              )}
              <Button variant="ghost" className="w-full text-xs text-emerald-400 hover:text-emerald-300">View Full Audit Log</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color }: { label: string, value: string, icon: LucideIcon, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
      <span className="text-sm font-bold text-neutral-900 dark:text-white">{value}</span>
    </div>
  );
}
