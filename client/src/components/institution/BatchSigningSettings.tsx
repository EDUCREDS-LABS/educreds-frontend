import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  Lock, 
  Zap, 
  ShieldAlert,
  ArrowRight,
  Fingerprint,
  Activity,
  CheckCircle,
  Database,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

export default function BatchSigningSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [institutionSettings, setInstitutionSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.CERT}/api/institutions/settings`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setInstitutionSettings(data);
    } catch (error) {
      console.error("Failed to fetch institution settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKey = async () => {
    if (!privateKey || privateKey.length < 64) {
      toast({
        title: "Invalid Security Key",
        description: "Private key must be a valid 64-character hex string.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(
        `${API_CONFIG.CERT}/api/institutions/batch-signing-config`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ privateKey }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Protocol Synchronized",
          description: "Batch signing keys have been cryptographically updated.",
        });
        setPrivateKey("");
        fetchSettings();
      } else {
        throw new Error(data.message || "Failed to update batch signing key");
      }
    } catch (error: any) {
      toast({
        title: "Key Rotation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-[32px]" />
        <Skeleton className="h-64 w-full rounded-[32px]" />
      </div>
    );
  }

  const isConfigured = institutionSettings?.batchSigningEnabled;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <Key className="size-4" />
            Cryptographic Authority
          </div>
          <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">
            Batch <span className="text-primary">Signing</span>.
          </h2>
          <p className="text-neutral-500 font-medium max-w-lg">
            Configure institutional keys for high-velocity, tamper-proof credential issuance across the decentralized network.
          </p>
        </div>
        <Badge className={cn(
          "px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border-none shadow-lg",
          isConfigured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
        )}>
          {isConfigured ? "Protocol Synchronized" : "Manual Authorization Only"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Configuration Card */}
        <Card className="lg:col-span-7 border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900 group">
          <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-700">
              <Zap className="size-32" />
            </div>
            <div className="relative z-10">
              <CardTitle className="text-2xl font-black">Key Rotation Protocol</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Authority Synchronization</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-neutral-700 flex items-start gap-5">
              <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">Security Advisory</p>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Batch signing keys grant the ability to issue credentials on behalf of the institution. Keep this key strictly confidential and rotate it periodically.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Institutional Authority Key (Hex)</label>
                <div className="relative">
                  <Input 
                    type="password"
                    placeholder="0x..." 
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="h-16 rounded-[24px] bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner pl-14 font-mono text-xs"
                  />
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-neutral-400" />
                </div>
              </div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest text-center px-4">
                Keys are encrypted using AES-256 and never stored in plain text.
              </p>
            </div>

            <Button 
              onClick={handleUpdateKey}
              disabled={isUpdating}
              className="w-full h-16 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              {isUpdating ? <RefreshCw className="size-5 mr-2 animate-spin" /> : <RefreshCw className="size-5 mr-2" />}
              Synchronize Protocol Keys
            </Button>
          </CardContent>
        </Card>

        {/* Status Info Card */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-neutral-900 text-white relative">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <ShieldCheck className="size-48 rotate-12" />
            </div>
            <CardHeader className="p-10 pb-4 relative z-10">
              <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary mb-6 backdrop-blur-xl border border-white/5">
                <Activity className="size-8" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight leading-tight">Identity Status.</CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-8 relative z-10">
              <div className="space-y-5">
                {[
                  { label: "Blockchain Sync", status: isConfigured ? "Active" : "Inactive", icon: Globe },
                  { label: "Protocol v2.4", status: "Enabled", icon: Database },
                  { label: "Signatory Authority", status: institutionSettings?.walletAddress?.substring(0, 10) + "...", icon: Fingerprint },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <item.icon className="size-4 text-white/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-white">{item.status}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] leading-relaxed">
                Institutional authority is validated through decentralized consensus audit before cryptographic keys are accepted by the network.
              </p>
            </CardContent>
          </Card>

          {/* Quick Help */}
          <div className="p-8 bg-white dark:bg-neutral-900 rounded-[40px] border border-neutral-100 dark:border-neutral-800 shadow-xl shadow-neutral-200/30">
            <h4 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest mb-4">Protocol Integration</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="size-3" />
                </div>
                <p className="text-xs text-neutral-500 font-medium">Batch signing allows for zero-interaction credential issuance via API.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="size-3" />
                </div>
                <p className="text-xs text-neutral-500 font-medium">All signatures are verifiable on-chain by any third party.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
