import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { governanceApiService } from '@/lib/governanceApiService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, Database, Server, RefreshCw, ShieldCheck, Search } from 'lucide-react';
import { cn } from "@/lib/utils";

export const InfrastructureManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bootstrapId, setBootstrapId] = useState('');

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['blockchain-status'],
    queryFn: () => governanceApiService.getBlockchainStatus()
  });

  const bulkRegisterMutation = useMutation({
    mutationFn: () => governanceApiService.bulkRegisterInstitutions(),
    onSuccess: (data) => {
      toast({
        title: "Bulk Registration Initiated",
        description: data.message || "Institutional nodes are being registered on-chain.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to initiate bulk registration",
        variant: "destructive"
      });
    }
  });

  const bootstrapIinMutation = useMutation({
    mutationFn: (walletAddress?: string) => governanceApiService.bootstrapSignerIIN(walletAddress),
    onSuccess: (data) => {
      toast({
        title: "IIN Bootstrap Successful",
        description: data.message || "Signer IIN has been synchronized with the blockchain.",
      });
      refetch();
      setBootstrapId('');
    },
    onError: (error: any) => {
      toast({
        title: "Bootstrap Failed",
        description: error.message || "Failed to bootstrap signer IIN",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Network Infrastructure</h2>
          <p className="text-neutral-500 font-medium">Manage on-chain registration and node synchronization.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isLoading}
          className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-white/10 bg-white/5 text-neutral-400"
        >
          {isLoading ? <Loader2 className="size-3 animate-spin mr-2" /> : <RefreshCw className="size-3 mr-2" />}
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-neutral-900 text-white border border-white/5">
          <CardHeader className="p-8">
            <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
              <Database className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">On-Chain Registry</CardTitle>
            <CardDescription className="text-neutral-400 font-medium">Bulk register institutions to the decentralized registry on Base.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Button 
              onClick={() => bulkRegisterMutation.mutate()} 
              disabled={bulkRegisterMutation.isPending}
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02]"
            >
              {bulkRegisterMutation.isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
              Initialize Bulk Registration
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-neutral-900 text-white border border-white/5">
          <CardHeader className="p-8 pb-4">
            <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <Server className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">Signer Synchronization</CardTitle>
            <CardDescription className="text-neutral-400 font-medium">Bootstrap and sync the primary admin signer IIN status.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-600 group-focus-within:text-purple-400 transition-colors" />
              <Input 
                placeholder="Specific Wallet Address (Optional)" 
                value={bootstrapId}
                onChange={(e) => setBootstrapId(e.target.value)}
                className="h-12 pl-12 bg-white/5 border-white/5 rounded-xl text-white text-xs font-mono focus:ring-purple-500/20"
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => bootstrapIinMutation.mutate(bootstrapId || undefined)} 
              disabled={bootstrapIinMutation.isPending}
              className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02]"
            >
              {bootstrapIinMutation.isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <ShieldCheck className="size-4 mr-2" />}
              Execute IIN Bootstrap
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-8 border-b border-neutral-50 dark:border-neutral-800">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-neutral-400">System Technical Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-neutral-950 p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-neutral-600">Querying Infrastructure State...</p>
              </div>
            ) : (
              <pre className="text-[10px] font-mono text-cyan-400/80 leading-relaxed overflow-auto max-h-[500px] scrollbar-thin scrollbar-thumb-white/10 p-4">
                {JSON.stringify(status, null, 2)}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
