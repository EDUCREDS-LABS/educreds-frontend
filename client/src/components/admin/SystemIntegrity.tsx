import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Cpu, 
  Globe, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Server, 
  Network,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const healthData = [
  { time: '00:00', load: 12, latency: 45 },
  { time: '04:00', load: 18, latency: 52 },
  { time: '08:00', load: 65, latency: 120 },
  { time: '12:00', load: 82, latency: 180 },
  { time: '16:00', load: 45, latency: 85 },
  { time: '20:00', load: 30, latency: 60 },
  { time: '23:59', load: 15, latency: 40 },
];

export function SystemIntegrity() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <Server className="size-4" />
            Infrastructure Audit
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">System <span className="text-primary">Integrity</span>.</h2>
          <p className="text-neutral-500 font-medium max-w-lg">Real-time monitoring of platform node health, database synchronization, and blockchain protocol throughput.</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} className="h-14 px-10 rounded-2xl bg-white text-gray-950 hover:bg-neutral-200 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
          <RefreshCw className={cn("size-4 mr-3", refreshing && "animate-spin")} />
          Recalibrate Sensors
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Real-time Telemetry */}
        <Card className="lg:col-span-8 border-none shadow-2xl bg-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden">
          <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-white tracking-tight">Platform Telemetry</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-neutral-500">Resource Utilization Cluster</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <div className="size-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Live Stream</span>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1560BD" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1560BD" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '16px', color: '#fff' }} />
                  <Area type="monotone" dataKey="load" stroke="#1560BD" strokeWidth={4} fillOpacity={1} fill="url(#colorLoad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <HealthGauge label="Core Compute" value={42} sub="CPU Load" status="optimal" />
              <HealthGauge label="Memory Bank" value={68} sub="RAM Usage" status="nominal" />
              <HealthGauge label="Network Pipe" value={14} sub="Bandwidth" status="low-util" />
            </div>
          </CardContent>
        </Card>

        {/* Node Health Clusters */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl bg-gray-900 rounded-[32px] p-2">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                <Zap className="size-3" /> Active Nodes
              </div>
              <CardTitle className="text-xl font-bold text-white tracking-tight">Infrastructure Pulse</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              {[
                { name: "Auth Engine", status: "Synchronized", uptime: "100%", icon: ShieldCheck, color: "text-green-500" },
                { name: "Issuance Node", status: "Active", uptime: "99.9%", icon: Cpu, color: "text-blue-500" },
                { name: "Base Sync", status: "Live", uptime: "100%", icon: Network, color: "text-purple-500" },
                { name: "Storage Array", status: "Nominal", uptime: "100%", icon: Database, color: "text-indigo-500" },
              ].map((node, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn("size-10 rounded-xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110", node.color)}>
                      <node.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white tracking-tight">{node.name}</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase">{node.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{node.uptime}</p>
                    <p className="text-[9px] font-black text-green-500 uppercase tracking-tighter">Uptime</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-8 bg-primary rounded-[40px] shadow-2xl shadow-primary/20 text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe className="size-32 rotate-12" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="size-14 bg-white/20 rounded-[24px] flex items-center justify-center backdrop-blur-xl border border-white/10">
                <ShieldCheck className="size-8" />
              </div>
              <h4 className="text-2xl font-black tracking-tight leading-tight">Security Hardening Active.</h4>
              <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">Global infrastructure is currently operating under a Zero-Trust architecture. All internal traffic is double-encrypted.</p>
            </div>
            <Button variant="secondary" className="w-full h-12 bg-white text-primary hover:bg-neutral-100 rounded-xl font-black text-[10px] uppercase tracking-widest relative z-10 transition-all active:scale-95">Download Audit Report</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthGauge({ label, value, sub, status }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm font-black text-white tracking-tight">{label}</p>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{sub}</p>
        </div>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
          status === 'optimal' ? "bg-green-500/20 text-green-500" :
          status === 'nominal' ? "bg-blue-500/20 text-blue-500" : "bg-neutral-500/20 text-neutral-400"
        )}>{status}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black text-neutral-600 uppercase">
          <span>Utilization</span>
          <span className="text-white">{value}%</span>
        </div>
        <Progress value={value} className="h-2 bg-white/5" />
      </div>
    </div>
  );
}
