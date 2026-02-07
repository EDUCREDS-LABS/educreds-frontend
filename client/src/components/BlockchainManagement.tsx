import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Users,
  Shield,
  ExternalLink,
  Zap,
  Link2,
  Database,
  Globe,
  Cpu
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BlockchainSummary {
  totalInstitutions: number;
  verifiedInstitutions: number;
  blockchainRegistered: number;
  blockchainAuthorized: number;
  pendingBlockchainRegistration: number;
  pendingBlockchainAuthorization: number;
}

interface InstitutionBlockchainStatus {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  backendVerified: boolean;
  blockchainRegistered: boolean;
  blockchainAuthorized: boolean;
  blockchainStats: any;
  blockchainError: string | null;
  blockchainTxHash?: string;
  blockchainAuthTxHash?: string;
  blockchainRegistrationDate?: string;
  blockchainAuthorizationDate?: string;
}

export default function BlockchainManagement() {
  const [summary, setSummary] = useState<BlockchainSummary | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionBlockchainStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionBlockchainStatus | null>(null);
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState<'register' | 'authorize'>('register');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      const [summaryData, institutionsData] = await Promise.all([
        api.getBlockchainSummary(),
        api.getBlockchainStatusAll()
      ]);

      setSummary(summaryData.summary);
      setInstitutions(institutionsData.statusReport || []);
    } catch (error: any) {
      console.error('Failed to fetch blockchain data:', error);
      toast({
        title: "Synchronization Error",
        description: "Failed to load blockchain infrastructure status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRegistration = async () => {
    try {
      setBulkLoading(true);
      const result = await api.bulkRegisterInstitutionsOnBlockchain();

      toast({
        title: "Consensus Processed",
        description: `Successfully synchronized ${result.summary.successful} nodes with the mainnet.`,
      });

      fetchBlockchainData();
    } catch (error: any) {
      toast({
        title: "Broadcast Error",
        description: error.message || "Could not complete bulk synchronization.",
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleInstitutionAction = async () => {
    if (!selectedInstitution) return;

    try {
      setActionLoading(true);

      if (actionType === 'register') {
        await api.registerInstitutionOnBlockchain(selectedInstitution.id);
        toast({
          title: "Node Registered",
          description: `${selectedInstitution.name} identity anchored to blockchain.`,
        });
      } else {
        await api.authorizeInstitutionOnBlockchain(selectedInstitution.id);
        toast({
          title: "Access Authorized",
          description: `Cryptographic permissions granted to ${selectedInstitution.name}.`,
        });
      }

      setActionModal(false);
      fetchBlockchainData();
    } catch (error: any) {
      toast({
        title: "Transaction Reverted",
        description: error.message || "Failed to execute on-chain administrative action.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full bg-gray-900 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 w-full bg-gray-900 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Consensus Nodes"
          value={summary?.totalInstitutions || 0}
          icon={Users}
          color="blue"
          subtext="Total Institutional Entities"
        />
        <MetricCard
          title="Off-Chain Verified"
          value={summary?.verifiedInstitutions || 0}
          icon={Shield}
          color="indigo"
          subtext="Admin Audited"
        />
        <MetricCard
          title="On-Chain Identity"
          value={summary?.blockchainRegistered || 0}
          icon={Link2}
          color="purple"
          subtext="Registered Ledger Nodes"
          pending={summary?.pendingBlockchainRegistration}
        />
        <MetricCard
          title="Issue Capacity"
          value={summary?.blockchainAuthorized || 0}
          icon={Zap}
          color="green"
          subtext="Permissioned Authorities"
          pending={summary?.pendingBlockchainAuthorization}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-gray-900/40 border-gray-800 border-none shadow-2xl overflow-hidden">
            <CardHeader className="p-8 border-b border-gray-800/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-white flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-blue-500" />
                  Infrastructure Synchronizer
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Network: Base Mainnet (8453)</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchBlockchainData}
                  className="border-gray-800 bg-gray-900/50 text-gray-400 hover:text-white rounded-xl"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                  Refresh
                </Button>
                <Button
                  onClick={handleBulkRegistration}
                  disabled={bulkLoading || (summary?.pendingBlockchainRegistration || 0) === 0}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold px-6"
                >
                  {bulkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Bulk Anchor ({summary?.pendingBlockchainRegistration || 0})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-800/50">
                {institutions.map((inst, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={inst.id}
                    className="p-6 flex items-center justify-between hover:bg-gray-800/20 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border transition-all duration-300",
                        inst.blockchainAuthorized ? "bg-green-500/10 border-green-500/20 text-green-500" :
                          inst.blockchainRegistered ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                            "bg-gray-800 border-gray-700 text-gray-400"
                      )}>
                        {inst.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-white font-bold flex items-center gap-2">
                          {inst.name}
                          <StatusBadge status={getDetailedStatus(inst)} />
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="font-mono bg-gray-950 px-2 py-0.5 rounded border border-gray-800">{inst.walletAddress.substring(0, 8)}...{inst.walletAddress.substring(34)}</span>
                          {inst.blockchainTxHash && (
                            <a href={`https://basescan.org/tx/${inst.blockchainTxHash}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                              <Link2 className="w-3 h-3" /> Tx
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {inst.backendVerified && !inst.blockchainRegistered && (
                        <ActionButton onClick={() => { setSelectedInstitution(inst); setActionType('register'); setActionModal(true); }} label="Register Identity" />
                      )}
                      {inst.blockchainRegistered && !inst.blockchainAuthorized && (
                        <ActionButton onClick={() => { setSelectedInstitution(inst); setActionType('authorize'); setActionModal(true); }} label="Authorize Issuer" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Diagnostics Sidebar */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 border-none shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-sm font-black uppercase tracking-widest text-gray-500">Network Topology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-950 rounded-2xl border border-gray-800">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold text-white">Global Reach</span>
                </div>
                <span className="text-xs text-gray-500">Multichain Ready</span>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Operational Readiness</h5>
                <LoadIndicator label="Ledger Latency" value={14} color="blue" />
                <LoadIndicator label="DApp Connectivity" value={98} color="green" />
                <LoadIndicator label="Gas Optimization" value={72} color="purple" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-600 border-none p-6 text-white relative overflow-hidden shadow-2xl group cursor-pointer">
            <div className="relative z-10">
              <h4 className="font-black text-lg">Smart Contract Audits</h4>
              <p className="text-xs text-blue-100 mt-2 opacity-80 leading-relaxed">
                Our v2.0 verification logic is anchored to the Base Mainnet. All operations are immutable and cryptographically secured.
              </p>
              <Button variant="link" className="text-white p-0 text-xs font-bold mt-4 uppercase tracking-[0.2em] group-hover:gap-2 transition-all">
                View Cert Registry <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <Shield className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </Card>
        </div>
      </div>

      {/* Shared Action Modal */}
      <Dialog open={actionModal} onOpenChange={setActionModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white rounded-3xl p-0 overflow-hidden">
          <div className={cn(
            "p-8 bg-gradient-to-r",
            actionType === 'register' ? "from-blue-600 to-blue-700" : "from-green-600 to-green-700"
          )}>
            <DialogTitle className="text-2xl font-black">Cryptographic Operation</DialogTitle>
            <DialogDescription className="text-white/80 font-medium mt-1">
              {actionType === 'register' ? 'Anchor node identity to mainnet' : 'Elevate permissions to Verified Issuer'}
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Entity</p>
                <p className="text-sm font-bold text-white">{selectedInstitution?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Network</p>
                <p className="text-sm font-bold text-blue-400">Base Mainnet</p>
              </div>
            </div>

            <div className="text-xs text-gray-500 leading-relaxed italic">
              * Note: This administrative action generates a real transaction on the Base blockchain and will persist indefinitely.
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setActionModal(false)} className="text-gray-400">Cancel</Button>
              <Button onClick={handleInstitutionAction} disabled={actionLoading} className="bg-white text-gray-900 hover:bg-gray-100 font-black h-12 px-8 rounded-xl shadow-xl">
                {actionLoading ? <Loader2 className="animate-spin" /> : "Sign & Broadcast"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, subtext, pending }: any) {
  const colors: any = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
  };

  return (
    <Card className="bg-gray-900 border-none shadow-2xl overflow-hidden relative group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 rounded-xl border", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-white tracking-tight">{value}</p>
          {pending > 0 && <Badge className="bg-amber-500/10 text-amber-500 border-none text-[10px]">+{pending} pending</Badge>}
        </div>
        <p className="text-[10px] text-gray-500 font-bold uppercase mt-2 opacity-60 tracking-tighter">{subtext}</p>
      </CardContent>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl group-hover:bg-white/10 transition-all duration-700" />
    </Card>
  );
}

function StatusBadge({ status }: { status: any }) {
  const styles: any = {
    authorized: "bg-green-500/10 text-green-500",
    registered: "bg-blue-500/10 text-blue-500",
    pending: "bg-gray-800 text-gray-400",
    error: "bg-red-500/10 text-red-500"
  };
  return (
    <Badge className={cn("text-[10px] font-black uppercase tracking-widest border-none px-2 py-0.5", styles[status.id] || styles.pending)}>
      {status.label}
    </Badge>
  );
}

function getDetailedStatus(inst: InstitutionBlockchainStatus) {
  if (inst.blockchainError) return { id: 'error', label: 'Failure' };
  if (inst.blockchainAuthorized) return { id: 'authorized', label: 'Full Auth' };
  if (inst.blockchainRegistered) return { id: 'registered', label: 'Registered' };
  return { id: 'pending', label: 'Idle' };
}

function ActionButton({ onClick, label }: { onClick: any, label: string }) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className="bg-gray-800 hover:bg-blue-600 text-white border border-gray-700 h-9 font-bold text-xs rounded-xl transition-all shadow-lg"
    >
      {label}
    </Button>
  );
}

function LoadIndicator({ label, value, color }: { label: string, value: number, color: string }) {
  const colors: any = {
    blue: "bg-blue-600", indigo: "bg-indigo-600", green: "bg-green-600", purple: "bg-purple-600"
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
        <span className="text-gray-500">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={cn("h-full", colors[color])}
        />
      </div>
    </div>
  );
}
