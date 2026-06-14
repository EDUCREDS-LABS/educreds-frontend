import { Filter, AlertCircle, CheckCircle2, Clock, ShieldAlert, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const reviewQueue = [
  { id: 'REQ-001', institution: 'Global Tech University', type: 'Verification', priority: 'High', status: 'Pending', time: '2m ago' },
  { id: 'REQ-002', institution: 'Metropolitan College', type: 'Dispute', priority: 'Medium', status: 'In Review', time: '15m ago' },
  { id: 'REQ-003', institution: 'Oxford International', type: 'Fraud Alert', priority: 'Critical', status: 'Escalated', time: '45m ago' },
];

const auditTrail = [
  { event: 'Credential Verified', entity: 'Employer Alpha', timestamp: '2026-06-04 14:22:10', details: 'Block #882,912' },
  { event: 'PoIC Score Updated', entity: 'System Agent', timestamp: '2026-06-04 12:05:45', details: 'Score: 92 -> 95' },
  { event: 'Dispute Initiated', entity: 'Student ID: 9928', timestamp: '2026-06-03 18:30:12', details: 'Reason: Metadata mismatch' },
];

export default function Observability() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Observability Hub</h2>
        <p className="text-slate-400 mt-1">Monitor system integrity, compliance queues, and audit trails.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Manual Review Queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Manual Review Queue</CardTitle>
              <p className="text-xs text-slate-500 mt-1">Pending verification requests requiring human intervention.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Filter size={14} /> Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviewQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-white/5 hover:border-emerald-500/20 transition-all group">
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
                        <span className="font-bold text-slate-200">{item.id}</span>
                        <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                      </div>
                      <p className="text-sm text-slate-400">{item.institution}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-300">{item.status}</p>
                      <p className="text-[10px] text-slate-500">{item.time}</p>
                    </div>
                    <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Real-time System Health */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Compliance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatItem label="Pending Reviews" value="12" icon={Clock} color="text-amber-400" />
              <StatItem label="Resolved (24h)" value="148" icon={CheckCircle2} color="text-emerald-400" />
              <StatItem label="Escalations" value="3" icon={AlertCircle} color="text-red-400" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Audit Trail Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {auditTrail.map((log, i) => (
                <div key={i} className="relative pl-6 border-l border-slate-800 space-y-1">
                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <p className="text-xs font-bold text-slate-200">{log.event}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{log.timestamp}</p>
                  <p className="text-[11px] text-slate-400 italic">By {log.entity}</p>
                </div>
              ))}
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
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}
