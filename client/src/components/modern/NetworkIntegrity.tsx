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
import { Button } from "@/components/ui/button";
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
    <div className="relative group p-6 rounded-xl bg-white border border-neutral-200 shadow-sm transition-all duration-300 hover:border-primary/30 overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />
      
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Network Integrity</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-900">BASE MAINNET L2</span>
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Secure
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost"
            size="icon"
            onClick={triggerSync}
            className="h-8 w-8 rounded-full text-neutral-400 hover:text-primary transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          </Button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Block Height</span>
            </div>
            <p className="text-lg font-black text-neutral-900 font-mono tracking-tight">
              {blockHeight.toLocaleString()}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Avg Gas</span>
            </div>
            <p className="text-lg font-black text-neutral-900 font-mono tracking-tight">
              {gasPrice.toFixed(3)} <span className="text-[9px] text-neutral-400 font-bold uppercase ml-1">Gwei</span>
            </p>
          </div>
        </div>

        {/* Node Connectivity */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.3em] ml-1">Consensus Nodes</h4>
          <div className="space-y-2">
            {nodes.map((node) => (
              <div key={node.name} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50/50 border border-neutral-100 group/node hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    node.status === "online" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"
                  )} />
                  <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">{node.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400">{node.latency}ms</span>
                  <ArrowUpRight className="w-3 h-3 text-neutral-300 group-hover/node:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distributed Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-neutral-300" />
            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Protocol v2.4.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
