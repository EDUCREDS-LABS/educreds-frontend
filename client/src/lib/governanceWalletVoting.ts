import { ethers } from "ethers";
import { governanceApiService } from "@/lib/governanceApiService";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const IIN_ABI = ["function institutionIdOfOwner(address owner) external view returns (uint256)"];
const DAO_ABI = ["function vote(uint256 proposalId, uint8 support) external"];

export async function castDirectWalletVote(
  proposal: { id: string; metadata?: any },
  support: 0 | 1 | 2,
): Promise<{ txHash: string; voterAddress: string }> {
  const governanceDaoAddress = import.meta.env.VITE_GOVERNANCE_DAO_ADDRESS || "";
  const institutionNftAddress = import.meta.env.VITE_INSTITUTION_NFT_ADDRESS || "";

  if (!proposal?.metadata?.onChainProposalId) {
    throw new Error("Proposal is not sponsored on-chain yet");
  }
  if (!governanceDaoAddress || !institutionNftAddress) {
    throw new Error("Missing VITE_GOVERNANCE_DAO_ADDRESS or VITE_INSTITUTION_NFT_ADDRESS");
  }
  if (typeof window.ethereum === "undefined") {
    throw new Error("No Web3 wallet detected");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const voterAddress = await signer.getAddress();

  const iin = new ethers.Contract(institutionNftAddress, IIN_ABI, provider);
  const iinId = Number(await iin.institutionIdOfOwner(voterAddress));
  if (!iinId) {
    throw new Error("Connected wallet does not hold an IIN");
  }

  const dao = new ethers.Contract(governanceDaoAddress, DAO_ABI, signer);
  const tx = await dao.vote(Number(proposal.metadata.onChainProposalId), support);
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

