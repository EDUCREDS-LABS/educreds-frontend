import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Brain, 
  Shield, 
  Zap, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Cpu,
  Database,
  Globe,
  RefreshCw,
  Lock,
  ArrowUpRight,
  TrendingUp,
  Fingerprint
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Oracle feature is now AI Intelligence Layer (EduCreds Trust Agent)
export default function OracleManagement() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const mockEntities = [
    {
      id: "inst_01",
      name: "Global Institute of Tech",
      type: "University",
      trustScore: 98,
      status: "verified",
      riskLevel: "low",
      lastAudit: "2024-05-10",
      vulnerabilities: 0
    },
    {
      id: "inst_02",
      name: "Block Academy",
      type: "Training Center",
      trustScore: 84,
      status: "pending",
      riskLevel: "medium",
      lastAudit: "2024-05-12",
      vulnerabilities: 2
    },
    {
      id: "inst_03",
      name: "E-Learn Platform",
      type: "LMS",
      trustScore: 42,
      status: "suspended",
      riskLevel: "high",
      lastAudit: "2024-05-08",
      vulnerabilities: 12
    }
  ];

  const handleRecalibrate = () => {
    toast({
      title: "AI Recalibration Initialized",
      description: "EduCreds Trust Agent (ETA) is scanning global nodes.",
    });
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <Brain className="size-4" />
            AI Intelligence Layer
          </div>
          <h2 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
            Trust <span className="text-primary">Oracle</span>.
          </h2>
          <p className="text-neutral-500 font-medium max-w-lg">
            EduCreds Trust Agent (ETA) evaluates institutional legitimacy via decentralized consensus and behavioral analytics.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleRecalibrate}
            className="h-14 px-8 rounded-2xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 font-bold"
          >
            <RefreshCw className="size-4 mr-2" />
            Trigger ETA Scan
          </Button>
          <Button className="h-14 px-10 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-black text-xs uppercase tracking-widest shadow-xl shadow-neutral-900/10 transition-all hover:scale-[1.02]">
            Generate Risk Report
          </Button>
        </div>
      </div>

      {/* Intelligence Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard 
          title="Network Trust" 
          value="94.2%" 
          trend="+1.2%" 
          icon={Shield} 
          color="blue" 
        />
        <StatsCard 
          title="Nodes Verified" 
          value="142" 
          trend="Protocol Max" 
          icon={Globe} 
          color="purple" 
        />
        <StatsCard 
          title="Risk Signals" 
          value="3" 
          trend="Active Alerts" 
          icon={AlertTriangle} 
          color="amber" 
        />
        <StatsCard 
          title="ETA Accuracy" 
          value="99.9%" 
          trend="Self-Learning" 
          icon={Cpu} 
          color="green" 
        />
      </div>

      {/* Oracle Monitoring View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
          <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black">Agent Oversight</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Behavioral Analysis Stream</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input 
                placeholder="Filter entities..." 
                className="pl-10 h-11 w-64 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none text-xs font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-800/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left">
                    <th className="px-10 py-5">Entity Name</th>
                    <th className="px-10 py-5">Classification</th>
                    <th className="px-10 py-5">Trust Score</th>
                    <th className="px-10 py-5">Risk Matrix</th>
                    <th className="px-10 py-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-10 py-6"><Skeleton className="h-8 w-full rounded-xl" /></td>
                      </tr>
                    ))
                  ) : (
                    mockEntities.map((entity) => (
                      <tr key={entity.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="size-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400">
                              <Fingerprint className="size-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-neutral-900 dark:text-neutral-100">{entity.name}</p>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ID: {entity.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-widest border-neutral-200">
                            {entity.type}
                          </Badge>
                        </td>
                        <td className="px-10 py-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-black">
                              <span className={cn(
                                entity.trustScore > 80 ? "text-emerald-500" : 
                                entity.trustScore > 50 ? "text-amber-500" : "text-red-500"
                              )}>{entity.trustScore}%</span>
                            </div>
                            <div className="w-24 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000",
                                  entity.trustScore > 80 ? "bg-emerald-500" : 
                                  entity.trustScore > 50 ? "bg-amber-500" : "bg-red-500"
                                )}
                                style={{ width: `${entity.trustScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <Badge className={cn(
                            "border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest",
                            entity.riskLevel === 'low' ? "bg-emerald-50 text-emerald-600" :
                            entity.riskLevel === 'medium' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                          )}>
                            {entity.riskLevel} Risk
                          </Badge>
                        </td>
                        <td className="px-10 py-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-neutral-100 shadow-2xl">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-3 py-2">Entity Control</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-xl font-bold text-xs px-3 py-2.5 cursor-pointer">
                                <Search className="size-4 mr-2" /> Detailed Audit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl font-bold text-xs px-3 py-2.5 cursor-pointer">
                                <RefreshCw className="size-4 mr-2" /> Force Recalibration
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2 bg-neutral-50" />
                              <DropdownMenuItem 
                                className="rounded-xl font-bold text-xs px-3 py-2.5 cursor-pointer text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedEntity(entity);
                                  setShowOverrideDialog(true);
                                }}
                              >
                                <Lock className="size-4 mr-2" /> Manual Override
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Intelligence Health */}
        <div className="space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-neutral-900 text-white">
            <CardHeader className="p-8">
              <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary mb-6 backdrop-blur-xl border border-white/5">
                <Cpu className="size-6" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight leading-tight">Neural Sync Active.</CardTitle>
              <CardDescription className="text-white/50 font-medium">ETA behavioral models are synchronized across all validator clusters.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Model Confidence</span>
                  <span className="text-xs font-black text-emerald-400">Optimal</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[98%]" />
                  </div>
                  <span className="text-sm font-black">98.2%</span>
                </div>
              </div>
              <Button className="w-full h-14 bg-white text-neutral-900 hover:bg-neutral-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                Read ETA Technical Whitepaper
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
            <CardHeader className="p-8 pb-4">
               <CardTitle className="text-xl font-black tracking-tight">System Integrity</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-5">
              {[
                { name: "Global Ledger", status: "online", icon: Database },
                { name: "Consensus Engine", status: "online", icon: Zap },
                { name: "Risk Analysis", status: "online", icon: Activity },
                { name: "Node Verification", status: "online", icon: Globe },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm">
                      <item.icon className="size-4 text-neutral-400" />
                    </div>
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="rounded-[40px] max-w-lg p-10 border-none shadow-2xl">
          <DialogHeader>
            <div className="size-16 bg-red-50 rounded-[24px] flex items-center justify-center text-red-600 mb-6">
              <Shield className="size-8" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Manual Override Protocol</DialogTitle>
            <DialogDescription className="font-medium text-neutral-500 text-lg leading-relaxed pt-2">
              You are attempting to manually override the AI Intelligence Layer for <span className="font-black text-neutral-900">{selectedEntity?.name}</span>. This action is logged in the permanent immutable audit registry.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] block mb-3 ml-1">Reason for Override</label>
            <textarea 
              className="w-full h-32 rounded-3xl bg-neutral-50 border-none p-6 text-sm font-medium resize-none focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
              placeholder="Provide technical justification for the consensus override..."
            />
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowOverrideDialog(false)} className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">Abort Action</Button>
            <Button variant="destructive" className="h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20">
              Apply Secure Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ title, value, trend, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card className="border-none shadow-xl shadow-neutral-200/40 dark:shadow-black/20 rounded-[32px] overflow-hidden bg-white dark:bg-neutral-900 group transition-all hover:shadow-2xl">
      <CardContent className="p-8 flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div className={cn("size-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", colorMap[color])}>
            <Icon className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{title}</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter mt-1">{value}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                trend.includes("+") || trend === "Secure" || trend === "Self-Learning" ? "text-emerald-500" : "text-amber-500"
              )}>{trend}</span>
            </div>
          </div>
        </div>
        <ArrowUpRight className="size-4 text-neutral-300 group-hover:text-primary transition-colors" />
      </CardContent>
    </Card>
  );
}
