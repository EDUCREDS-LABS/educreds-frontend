import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { governanceApiService } from "@/lib/governanceApiService";
import { Vote, Wallet, CheckCircle, XCircle, Minus, Loader2, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const IIN_ABI = ["function institutionIdOfOwner(address owner) external view returns (uint256)"];
const DAO_ABI = ["function vote(uint256 proposalId, uint8 support) external"];

export default function PublicWalletVotingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [votingKey, setVotingKey] = useState<string | null>(null);

  const governanceDaoAddress = import.meta.env.VITE_GOVERNANCE_DAO_ADDRESS || "";
  const institutionNftAddress = import.meta.env.VITE_INSTITUTION_NFT_ADDRESS || "";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["governance", "public-proposals"],
    queryFn: () => governanceApiService.listPublicProposals(1, 50),
  });

  const proposals = data?.data || [];

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("No Web3 wallet detected. Install MetaMask or a compatible wallet.");
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
    return Boolean(walletAddress && governanceDaoAddress && institutionNftAddress);
  }, [walletAddress, governanceDaoAddress, institutionNftAddress]);

  const castWalletVote = async (proposal: any, support: 0 | 1 | 2) => {
    const key = `${proposal.id}-${support}`;
    setVotingKey(key);

    try {
      if (!canVote) {
        throw new Error("Connect wallet and configure VITE_GOVERNANCE_DAO_ADDRESS / VITE_INSTITUTION_NFT_ADDRESS");
      }
      if (!proposal?.metadata?.onChainProposalId) {
        throw new Error("Proposal is not sponsored on-chain yet");
      }
      if (typeof window.ethereum === "undefined") {
        throw new Error("No Web3 wallet detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      const iin = new ethers.Contract(institutionNftAddress, IIN_ABI, provider);
      const iinId = Number(await iin.institutionIdOfOwner(signerAddress));
      if (!iinId) {
        throw new Error("Connected wallet does not hold an IIN. Only IIN holders can vote.");
      }

      const dao = new ethers.Contract(governanceDaoAddress, DAO_ABI, signer);
      const tx = await dao.vote(Number(proposal.metadata.onChainProposalId), support);
      const receipt = await tx.wait();
      if (!receipt?.hash) {
        throw new Error("Vote transaction mined but no tx hash found");
      }

      await governanceApiService.recordWalletDirectVote(proposal.id, {
        voterAddress: signerAddress,
        support,
        txHash: receipt.hash,
      });

      toast({
        title: "Vote submitted",
        description: `Vote recorded. Tx: ${receipt.hash.slice(0, 10)}...`,
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

      {(!governanceDaoAddress || !institutionNftAddress) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Missing frontend env config. Set `VITE_GOVERNANCE_DAO_ADDRESS` and `VITE_INSTITUTION_NFT_ADDRESS`.
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

