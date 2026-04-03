import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wifi, 
  Database, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Cpu, 
  Clock,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NodeStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  latency: number;
}

export function NetworkIntegrity() {
  const [blockHeight, setBlockHeight] = useState(12485920);
  const [gasPrice, setGasPrice] = useState(0.12);
  const [isSyncing, setIsRefreshing] = useState(false);
  
  const nodes: NodeStatus[] = [
    { name: "Base Mainnet", status: "online", latency: 12 },
    { name: "IPFS Gateway", status: "online", latency: 45 },
    { name: "Trust Agent", status: "online", latency: 28 },
  ];

  // Simulation effect for live telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
      setGasPrice(prev => Math.max(0.01, prev + (Math.random() * 0.04 - 0.02)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="relative group p-6 rounded-[2rem] bg-[#0a0a0c]/60 border border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-500 hover:border-indigo-500/20">
      {/* Background Integrity Pulse */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] pointer-events-none group-hover:bg-blue-600/10 transition-all duration-1000" />
      
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Network Integrity</h3>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white italic tracking-tighter">BASE_MAINNET_L2</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                  Secure
                </Badge>
              </div>
            </div>
          </div>
          <button 
            onClick={triggerSync}
            className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Block Height</span>
            </div>
            <p className="text-xl font-black text-white font-mono tracking-tight">
              {blockHeight.toLocaleString()}
            </p>
          </div>
          
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Gas</span>
            </div>
            <p className="text-xl font-black text-white font-mono tracking-tight">
              {gasPrice.toFixed(3)} <span className="text-[10px] text-slate-600 font-bold uppercase ml-1">Gwei</span>
            </p>
          </div>
        </div>

        {/* Node Connectivity */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Consensus Nodes</h4>
          <div className="space-y-2">
            {nodes.map((node) => (
              <div key={node.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-950/40 border border-white/5 group/node hover:border-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    node.status === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"
                  )} />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{node.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{node.latency}ms</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-700 group-hover/node:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distributed Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-slate-600" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Engine: v2.4.0-Tactical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Telemetry Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
