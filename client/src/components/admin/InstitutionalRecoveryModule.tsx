import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { governanceApiService } from '@/lib/governanceApiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Loader2, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const InstitutionalRecoveryModule = () => {
  const [institutionId, setInstitutionId] = useState('');
  const [searchId, setSearchId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statusData, isLoading, isError, refetch } = useQuery({
    queryKey: ['institution-gov-status', searchId],
    queryFn: () => governanceApiService.getInstitutionGovernanceStatus(searchId),
    enabled: !!searchId,
    retry: false
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => governanceApiService.unblockInstitutionIssuance(id),
    onSuccess: (data) => {
      toast({
        title: "Institution Unblocked",
        description: data.message,
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-institutions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Unblock Failed",
        description: error.message || "Failed to unblock institution",
        variant: "destructive"
      });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId.trim()) return;
    setSearchId(institutionId.trim());
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-white dark:bg-neutral-900 rounded-[32px]">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <ShieldAlert className="size-8 text-amber-500" />
            Institutional Issuance Recovery
          </CardTitle>
          <CardDescription className="text-lg font-medium">
            Diagnose and resolve governance blocks for institutions stuck in "Pending Review" or restricted states.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input 
                placeholder="Enter Institution ID (UUID)..." 
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="h-14 pl-12 rounded-2xl border-neutral-200 dark:border-neutral-800 font-medium"
              />
            </div>
            <Button 
              type="submit" 
              className="h-14 px-8 rounded-2xl font-bold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin size-5 mr-2" /> : <Search className="size-5 mr-2" />}
              Scan Status
            </Button>
          </form>
        </CardContent>
      </Card>

      {statusData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Status Panel */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
              <div className={statusData.governanceStatus.canIssueCredentials ? "bg-emerald-500 h-2" : "bg-amber-500 h-2"} />
              <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold">{statusData.institution.name}</CardTitle>
                    <p className="text-xs font-mono text-neutral-400">{statusData.institution.id}</p>
                  </div>
                  <Badge className={statusData.governanceStatus.canIssueCredentials ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                    {statusData.governanceStatus.canIssueCredentials ? "Issuance Active" : "Issuance Blocked"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">PoIC Score</p>
                    <p className="text-2xl font-black">{statusData.institution.poicScore}%</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Tier</p>
                    <p className="text-2xl font-black">{statusData.governanceStatus.issuanceCapacity.tier}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Verification</p>
                    <p className="text-2xl font-black uppercase text-xs mt-2">{statusData.institution.verificationStatus}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-neutral-400">Diagnostic Analysis</h4>
                  <div className="space-y-3">
                    {statusData.governanceStatus.blockedReasons.length > 0 ? (
                      statusData.governanceStatus.blockedReasons.map((reason: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                          <XCircle className="size-5 text-amber-600 mt-0.5" />
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{reason}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                        <CheckCircle2 className="size-5 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">No active governance blocks detected.</p>
                      </div>
                    )}
                  </div>
                </div>

                {!statusData.governanceStatus.canIssueCredentials && (
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 rounded-2xl">
                    <Zap className="size-5 text-blue-600" />
                    <AlertTitle className="font-bold">Recovery Available</AlertTitle>
                    <AlertDescription className="font-medium text-blue-800 dark:text-blue-300">
                      The institution meets the PoIC threshold and has an IIN token. You can bypass the stuck governance state and enable issuance immediately.
                    </AlertDescription>
                    <Button 
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                      onClick={() => unblockMutation.mutate(searchId)}
                      disabled={unblockMutation.isPending}
                    >
                      {unblockMutation.isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
                      Execute Emergency Unblock
                    </Button>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl rounded-[32px]">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Recent Proposals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {statusData.recentProposals.length > 0 ? (
                  statusData.recentProposals.map((p: any) => (
                    <div key={p.id} className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold">{p.proposalId}</span>
                        <Badge variant="outline" className="text-[9px] uppercase">{p.state}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                        <Clock className="size-3" />
                        {new Date(p.createdAt).toLocaleDateString()}
                        {p.executed && <Badge className="bg-emerald-500/10 text-emerald-600 border-none ml-auto text-[8px]">EXECUTED</Badge>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500 text-center py-8">No proposal history found.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[32px] bg-neutral-900 text-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-blue-500">Protocol Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {statusData.governanceStatus.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex gap-3 text-sm font-medium text-neutral-300">
                    <ArrowRight className="size-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {isError && (
        <Alert variant="destructive" className="rounded-3xl">
          <XCircle className="size-5" />
          <AlertTitle className="font-bold">Scan Error</AlertTitle>
          <AlertDescription>Failed to retrieve governance status for this ID. Ensure the institution exists in the decentralized registry.</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
