import { ethers } from "ethers";
import { governanceApiService } from "@/lib/governanceApiService";
import { walletService } from "./walletService";

export async function castDirectWalletVote(
  proposal: { id: string; metadata?: any },
  support: 0 | 1 | 2,
): Promise<{ txHash: string; voterAddress: string }> {
  // ✅ Backend will auto-create proposal on-chain if needed
  // No need to check onChainProposalId here

  if (!walletService.isConnected()) {
    await walletService.connect();
  }
  const rawProvider = walletService.getRawProvider();
  const signer = walletService.getSigner();

  if (!rawProvider || !signer) throw new Error("Wallet not connected");

  const txData = await governanceApiService.getVoteTransactionData(proposal.id, support);

  if (txData?.chainId) {
    try {
      await rawProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${Number(txData.chainId).toString(16)}` }],
      });
    } catch (error: any) {
      // Keep going; provider will fail with a clearer transaction/network error if incompatible.
      console.warn("[Governance] Chain switch failed/skipped:", error?.message || error);
    }
  }

  const voterAddress = await signer.getAddress();

  const tx = await signer.sendTransaction({
    to: txData.to,
    data: txData.data,
    gasLimit: txData.gasEstimate ? BigInt(txData.gasEstimate) : undefined,
  });
  const receipt = await tx.wait();
  if (!receipt?.hash) {
    throw new Error("Transaction mined but tx hash was not available");
  }

  await governanceApiService.recordWalletDirectVote(proposal.id, {
    voterAddress,
    support,
    txHash: receipt.hash,
  });

  return { txHash: receipt.hash, voterAddress };
}
