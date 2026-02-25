import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { governanceApiService } from "@/lib/governanceApiService";
import { Vote, Wallet, CheckCircle, XCircle, Minus, Loader2, AlertCircle } from "lucide-react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function PublicWalletVotingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [votingKey, setVotingKey] = useState<string | null>(null);
  
  // Use AppKit hooks for wallet connection
  const { open } = useAppKit();
  const { address: appKitAddress, isConnected: appKitIsConnected } = useAppKitAccount();

  const governanceDaoAddress = import.meta.env.VITE_GOVERNANCE_DAO_ADDRESS || "";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["governance", "public-proposals"],
    queryFn: () => governanceApiService.listPublicProposals(1, 50),
  });

  const proposals = data?.data || [];

  // Sync AppKit address with local state
  useMemo(() => {
    if (appKitAddress) {
      setWalletAddress(appKitAddress);
    }
  }, [appKitAddress]);

  const connectWallet = async () => {
    try {
      // Try AppKit modal first for wallet selection
      if (open) {
        await open();
        // Address will be updated via useAppKitAccount hook
        if (appKitAddress) {
          setWalletAddress(appKitAddress);
          toast({
            title: "Wallet connected",
            description: `${appKitAddress.slice(0, 6)}...${appKitAddress.slice(-4)}`,
          });
          return;
        }
      }

      // Fallback to injected wallet (MetaMask)
      if (typeof window.ethereum === "undefined") {
        throw new Error("No Web3 wallet detected. Install MetaMask or use WalletConnect.");
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || !accounts[0]) {
        throw new Error("No wallet account returned");
      }
      setWalletAddress(accounts[0]);
      toast({
        title: "Wallet connected",
        description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Wallet connection failed",
        description: error?.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const canVote = useMemo(() => {
    return Boolean(walletAddress && governanceDaoAddress);
  }, [walletAddress, governanceDaoAddress]);

  const castWalletVote = async (proposal: any, support: 0 | 1 | 2) => {
    const key = `${proposal.id}-${support}`;
    setVotingKey(key);

    try {
      if (!canVote) {
        throw new Error("Connect wallet and configure VITE_GOVERNANCE_DAO_ADDRESS");
      }
      // ✅ Backend will auto-create proposal on-chain if needed
      // No need to check onChainProposalId here

      const result = await governanceApiService.castVote(
        proposal.id || proposal.proposalId,
        support,
        walletAddress || appKitAddress,
      );

      toast({
        title: "Vote submitted",
        description: result?.txHash
          ? `Vote recorded. Tx: ${String(result.txHash).slice(0, 10)}...`
          : "Vote recorded successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ["governance", "public-proposals"] });
      await refetch();
    } catch (error: any) {
      toast({
        title: "Vote failed",
        description: error?.message || "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setVotingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Vote className="w-8 h-8 text-blue-600" />
            Public Governance Voting
          </h1>
          <p className="text-muted-foreground mt-1">
            Non-institution members can vote if connected wallet holds an IIN.
          </p>
        </div>
        <Button onClick={connectWallet} variant={walletAddress ? "outline" : "default"}>
          <Wallet className="w-4 h-4 mr-2" />
          {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
        </Button>
      </div>

      {!governanceDaoAddress && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Missing frontend env config. Set `VITE_GOVERNANCE_DAO_ADDRESS`.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <Alert>
              <AlertDescription>No active sponsored proposals available right now.</AlertDescription>
            </Alert>
          ) : (
            proposals.map((proposal: any) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{proposal.title || "Governance Proposal"}</CardTitle>
                      <CardDescription className="mt-1">
                        {proposal.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      On-chain ID: {proposal?.metadata?.onChainProposalId || "N/A"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => castWalletVote(proposal, 1)}
                      disabled={!canVote || votingKey === `${proposal.id}-1`}
                    >
                      {votingKey === `${proposal.id}-1` ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      For
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => castWalletVote(proposal, 2)}
                      disabled={!canVote || votingKey === `${proposal.id}-2`}
                    >
                      {votingKey === `${proposal.id}-2` ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Minus className="w-4 h-4 mr-2" />
                      )}
                      Abstain
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => castWalletVote(proposal, 0)}
                      disabled={!canVote || votingKey === `${proposal.id}-0`}
                    >
                      {votingKey === `${proposal.id}-0` ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Against
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
