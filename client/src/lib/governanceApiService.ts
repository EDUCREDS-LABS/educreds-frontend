import axios, { type AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import { walletService } from './walletService';

// Note: For wallet connection in utility functions, we use window.ethereum directly.

const rawApiBase = (import.meta.env.VITE_API_BASE ?? 'http://localhost:3001').replace(/\/$/, '');
const API_BASE_URL = rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase}/api`;

// Types for governance API responses
export interface ProposalResponse {
  id: string;
  title: string;
  description: string;
  state: 'PENDING' | 'ACTIVE' | 'EXECUTED' | 'REJECTED' | 'CANCELLED';
  legitimacyScore: number;
  proposerAddress: string;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
  startBlock?: number;
  endBlock?: number;
  executionDelay?: number;
  verificationConfidence?: number;
  missingSignals?: string[];
  evidenceSummary?: string;
  scoreSource?: 'llm' | 'heuristic' | 'hybrid';
}

export interface VoteResponse {
  id: string;
  proposalId: string;
  voterAddress: string;
  vote: boolean;
  votingPower: number;
  timestamp: Date;
}

export interface InstitutionResponse {
  id: string;
  name: string;
  walletAddress: string;
  verificationStatus: string;
  certificates?: any[];
  poicScore?: number | null;
  iinTokenId?: number | null;
  issuanceCount?: number | null;
  createdAt: Date;
}

export interface PoICScoreResponse {
  institutionId: string;
  score: number;
  timestamp: Date;
  components: {
    certificateScore: number;
    reputationScore: number;
    accreditationScore: number;
  };
}

export interface SystemMetricsResponse {
  totalProposals: number;
  activeProposals: number;
  totalVotes: number;
  totalInstitutions: number;
  averagePoICScore: number;
  systemHealthScore: number;
}

export interface AuditLogEntryResponse {
  id: string;
  timestamp: Date;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SystemStatusResponse {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  components: {
    database: { status: string; message: string };
    proposals: { status: string; message: string };
    voting: { status: string; message: string };
    governance: { status: string; message: string };
  };
  error?: string;
}

// ============ TRANSPARENCY API TYPES ============

export interface SubmittedDocumentResponse {
  type: 'accreditation' | 'audit_report' | 'financial' | 'other';
  label: string;
  ipfsHash: string;
  url: string;
  uploadedAt: Date;
  verified: boolean;
}

export interface InstitutionTransparencyResponse {
  name: string;
  walletAddress: string;
  domain?: string;
  country?: string;
  type: string;
  submittedDocuments: SubmittedDocumentResponse[];
}

export interface PoICComponentsResponse {
  issuanceAccuracy?: number;
  revocationRate?: number;
  governanceBehavior?: number;
  aiRiskComponent?: number;
  certificatesIssued?: number;
  certificateRevocations?: number;
  historicalStability?: number;
}

export interface PoICScoreDetailResponse {
  value: number;
  calculatedAt: Date;
  components: PoICComponentsResponse;
  methodology: string;
}

export interface RiskFlagResponse {
  flag: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  evidence: string;
}

export interface AIAnalysisResponse {
  legitimacyScore: number;
  confidence: 'high' | 'medium' | 'low';
  recommendedAction: 'approve' | 'approve_with_limits' | 'reject' | 'audit';
  summary: string;
  evidenceReview: string;
  riskFlags: RiskFlagResponse[];
}

export interface AuditTrailEventResponse {
  timestamp: Date;
  action: string;
  actor: string;
  details: any;
  status: 'success' | 'failed' | 'pending';
}

export interface VotingContextResponse {
  votingStartsAt: Date;
  votingEndsAt: Date;
  estimatedCompletionBlocks: number;
  estimatedCompletionSeconds: number;
  currentBlockNumber: number;
  currentBlockTimestamp: number;
  onChainProposalState: string;
  onChainProposalId: number;
  quorumRequired: number;
  approvalThreshold: number;
}

export interface AssessmentTransparencyResponse {
  proposal: ProposalResponse;
  institution: InstitutionTransparencyResponse;
  poicScore: PoICScoreDetailResponse;
  aiAnalysis: AIAnalysisResponse;
  auditTrail: AuditTrailEventResponse[];
  votingContext: VotingContextResponse;
}

export interface AssessmentHistoryEventResponse {
  timestamp: Date;
  event: 'created' | 'analyzed' | 'scored' | 'flagged' | 'revised';
  changes: {
    previousValue?: any;
    newValue?: any;
    reason?: string;
  };
}

export interface AssessmentHistoryResponse {
  proposalId: string;
  assessmentTimeline: AssessmentHistoryEventResponse[];
}

export interface RiskAssessmentResponse {
  proposalId: string;
  institutionName: string;
  overallRiskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskFactors: Array<{
    category: 'credential_issuance' | 'institution_stability' | 'accreditation' | 'compliance' | 'governance';
    risks: Array<{
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      mitigations: string[];
      recommendedLimits?: {
        dailyIssuanceLimit?: number;
        monthlyIssuanceLimit?: number;
        approvalDuration?: string;
      };
    }>;
  }>;
  recommendedAction: string;
}

class GovernanceApiService {
  private client: AxiosInstance;
  private readonly chainConfig: Record<number, {
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: { name: string; symbol: string; decimals: number };
    blockExplorerUrls: string[];
  }> = {
    84532: {
      chainName: 'Base Sepolia',
      rpcUrls: ['https://sepolia.base.org', 'https://base-sepolia-rpc.publicnode.com'],
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      blockExplorerUrls: ['https://sepolia.basescan.org'],
    },
    8453: {
      chainName: 'Base',
      rpcUrls: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'],
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      blockExplorerUrls: ['https://basescan.org'],
    },
  };

  private normalizeGovernanceRevert(error: any): Error {
    const candidates = [
      error?.reason,
      error?.shortMessage,
      error?.message,
      error?.info?.error?.message,
      error?.error?.message,
      error?.data?.message,
      error?.cause?.message,
      typeof error === 'string' ? error : undefined,
    ]
      .filter(Boolean)
      .map((v) => String(v));

    const raw = candidates.join(' | ');

    if (raw.includes('DAO: voted')) {
      return new Error('Vote blocked: this wallet already voted on this proposal.');
    }
    if (raw.includes('DAO: bad support')) {
      return new Error('Vote blocked: invalid support value.');
    }
    if (raw.includes('DAO: not IIN holder')) {
      return new Error('Vote blocked: connected wallet is not an IIN holder.');
    }
    if (raw.includes('DAO: no institutionId')) {
      return new Error('Vote blocked: wallet has no institutionId in IIN contract.');
    }
    if (raw.includes('DAO: zero weight')) {
      return new Error('Vote blocked: wallet has zero on-chain PoIC voting weight.');
    }
    if (raw.includes('DAO: missing')) {
      return new Error('Vote blocked: on-chain proposal does not exist.');
    }

    if (String(error?.receipt?.status) === '0' || raw.includes('transaction execution reverted')) {
      return new Error(
        'Vote transaction reverted on-chain. Common causes: proposal no longer ACTIVE, already voted, wallet is not IIN holder, or PoIC weight is zero.',
      );
    }

    return new Error(raw || 'Vote transaction reverted on-chain.');
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests if available
    this.client.interceptors.request.use((config: any) => {
      const token =
        localStorage.getItem('institution_token') ||
        localStorage.getItem('marketplace_token') ||
        localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ============ PROPOSALS API ============

  async listProposals(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ProposalResponse>> {
    const response = await this.client.get('/governance/proposals/list', {
      params: { page, limit },
    });
    return response.data;
  }

  async getProposalDetail(proposalId: string): Promise<ProposalResponse> {
    const response = await this.client.get(`/governance/proposals/${proposalId}/detail`);
    return response.data;
  }

  async createProposal(data: any): Promise<ProposalResponse> {
    const response = await this.client.post('/governance/proposals/create', data);
    return response.data;
  }

  async getProposalVotes(proposalId: string): Promise<VoteResponse[]> {
    const response = await this.client.get(`/governance/proposals/${proposalId}/votes`);
    return response.data;
  }

  async getProposalsSummary(): Promise<{ [key: string]: number }> {
    const response = await this.client.get('/governance/proposals/states/summary');
    return response.data;
  }

  async listPublicProposals(page: number = 1, limit: number = 20): Promise<PaginatedResponse<ProposalResponse>> {
    const response = await this.client.get('/governance/public/proposals', {
      params: { page, limit },
    });
    return response.data;
  }

  async listPublicProposalHistory(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<PaginatedResponse<ProposalResponse>> {
    const response = await this.client.get('/governance/public/proposals/history', {
      params: { page, limit, status },
    });
    return response.data;
  }

  async getPublicProposalDetail(proposalId: string): Promise<ProposalResponse & any> {
    const response = await this.client.get(`/governance/public/proposals/${proposalId}/detail`);
    return response.data;
  }

  async getVoteTransactionData(
    proposalId: string,
    support: 0 | 1 | 2,
  ): Promise<{
    to: string;
    data: string;
    method: string;
    params: { proposalId: number; support: number };
    chainId: number;
    gasEstimate?: string;
  }> {
    const response = await this.client.get(`/governance/public/proposals/${proposalId}/vote/tx-data`, {
      params: { support },
    });
    return response.data;
  }

  // ============ VOTING API ============

  private async tryWalletDirectVote(
    proposalId: string,
    support: 0 | 1 | 2,
    voterAddress?: string,
  ): Promise<any> {
    const txData = await this.getVoteTransactionData(proposalId, support);

    if (!walletService.isConnected()) {
      await walletService.connect();
    }
    const signer = walletService.getSigner();
    const eip1193Provider = walletService.getRawProvider();
    if (!signer || !eip1193Provider) throw new Error("Wallet not connected.");
    const connectedWallet = await signer.getAddress();
    const resolvedVoterAddress = (voterAddress || connectedWallet).toLowerCase();

    if (resolvedVoterAddress !== connectedWallet.toLowerCase()) {
      throw new Error('Connected wallet does not match requested voter address');
    }

    if (txData?.chainId) {
      try {
        await eip1193Provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${Number(txData.chainId).toString(16)}` }],
        });
      } catch (error: any) {
        const chainMeta = this.chainConfig[Number(txData.chainId)];
        const code = Number(error?.code);
        if ((code === 4902 || code === -32603) && chainMeta) {
          try {
            await eip1193Provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${Number(txData.chainId).toString(16)}`,
                chainName: chainMeta.chainName,
                rpcUrls: chainMeta.rpcUrls,
                nativeCurrency: chainMeta.nativeCurrency,
                blockExplorerUrls: chainMeta.blockExplorerUrls,
              }],
            });
            await eip1193Provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${Number(txData.chainId).toString(16)}` }],
            });
          } catch (addError: any) {
            console.warn('[Governance] wallet_addEthereumChain failed:', addError?.message || addError);
          }
        } else {
          console.warn('[Governance] Chain switch skipped/failed:', error?.message || error);
        }
      }
    }

    // Preflight with the connected wallet context so we surface a concrete DAO revert reason.
    try {
      await signer.estimateGas({
        to: txData.to,
        data: txData.data,
      });
    } catch (preflightError: any) {
      throw this.normalizeGovernanceRevert(preflightError);
    }

    let tx: any;
    try {
      tx = await signer.sendTransaction({
        to: txData.to,
        data: txData.data,
        gasLimit: txData.gasEstimate ? BigInt(txData.gasEstimate) : undefined,
      });
    } catch (sendError: any) {
      throw this.normalizeGovernanceRevert(sendError);
    }
    let receipt: any;
    try {
      receipt = await tx.wait();
    } catch (waitError: any) {
      throw this.normalizeGovernanceRevert(waitError);
    }

    if (!receipt || receipt.status === 0) {
      throw this.normalizeGovernanceRevert({
        message: 'transaction execution reverted',
        receipt,
      });
    }
    if (!receipt?.hash) {
      throw new Error('Vote transaction mined but tx hash missing');
    }

    const walletRecord = await this.recordWalletDirectVote(proposalId, {
      voterAddress: connectedWallet,
      support,
      txHash: receipt.hash,
    });

    return {
      ...walletRecord,
      txHash: receipt.hash,
      walletDirect: true,
    };
  }

  async castVote(
    proposalId: string,
    support: boolean | 0 | 1 | 2,
    voterAddress?: string
  ): Promise<any> {
    const normalizedSupport =
      typeof support === 'boolean' ? (support ? 1 : 0) : support;
    const resolvedVoterAddress =
      voterAddress ||
      localStorage.getItem('walletAddress') ||
      localStorage.getItem('institutionWalletAddress') ||
      '';
    const hasInstitutionToken = Boolean(localStorage.getItem('institution_token'));
    const walletDirectEnabled =
      String(import.meta.env.VITE_ENABLE_WALLET_DIRECT_VOTING ?? 'true').toLowerCase() !== 'false';

    if (walletDirectEnabled) {
      try {
        return await this.tryWalletDirectVote(
          proposalId,
          normalizedSupport as 0 | 1 | 2,
          resolvedVoterAddress || undefined,
        );
      } catch (error) {
        // Public wallet voting should not silently fall back to protected institution endpoint.
        if (!hasInstitutionToken) {
          throw error instanceof Error
            ? error
            : new Error(String(error || 'Wallet-direct voting failed'));
        }
        console.warn('[Governance] Wallet-direct voting failed, falling back to backend vote:', error);
      }
    }

    const response = await this.client.post(`/governance/proposals/${proposalId}/vote`, {
      support: normalizedSupport,
      voterAddress: resolvedVoterAddress,
    });
    return {
      ...response.data,
      walletDirect: false,
    };
  }

  async getVotingPower(
    proposalId: string,
    voterAddress?: string
  ): Promise<{ votingPower: number }> {
    const resolvedVoterAddress =
      voterAddress ||
      localStorage.getItem('walletAddress') ||
      localStorage.getItem('institutionWalletAddress') ||
      '';
    const response = await this.client.get(`/governance/proposals/${proposalId}/voting-power`, {
      params: { voterAddress: resolvedVoterAddress },
    });
    return response.data;
  }

  async getVoteDetail(voteId: string): Promise<VoteResponse> {
    const response = await this.client.get(`/governance/votes/${voteId}`);
    return response.data;
  }

  async recordWalletDirectVote(
    proposalId: string,
    payload: { voterAddress: string; support: 0 | 1 | 2; txHash: string; reason?: string }
  ): Promise<any> {
    const response = await this.client.post(`/governance/public/proposals/${proposalId}/vote/wallet`, payload);
    return response.data;
  }

  // ============ INSTITUTIONS API ============

  async listInstitutions(page: number = 1, limit: number = 20): Promise<PaginatedResponse<InstitutionResponse>> {
    const response = await this.client.get('/governance/institutions', {
      params: { page, limit },
    });
    return response.data;
  }

  async getInstitutionDetail(institutionId: string): Promise<InstitutionResponse> {
    const response = await this.client.get(`/governance/institutions/${institutionId}`);
    return response.data;
  }

  // ============ ADMIN API ============

  async getSystemMetrics(): Promise<SystemMetricsResponse> {
    const response = await this.client.get('/governance/admin/metrics');
    return response.data;
  }

  async getPublicSystemMetrics(): Promise<SystemMetricsResponse> {
    const response = await this.client.get('/governance/public/metrics');
    return response.data;
  }

  async getAuditLog(
    page: number = 1,
    limit: number = 50,
    filters?: { action?: string; resourceType?: string }
  ): Promise<PaginatedResponse<AuditLogEntryResponse>> {
    const response = await this.client.get('/governance/admin/audit-log', {
      params: { page, limit, ...filters },
    });
    return response.data;
  }

  async getSystemStatus(): Promise<SystemStatusResponse> {
    const response = await this.client.get('/governance/admin/system-status');
    return response.data;
  }

  async getInstitutionRegistry(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<InstitutionResponse>> {
    const response = await this.client.get('/governance/admin/institutions', {
      params: { page, limit },
    });
    return response.data;
  }

  async getAdminProposals(
    page: number = 1,
    limit: number = 20,
    state: string = 'active'
  ): Promise<PaginatedResponse<ProposalResponse>> {
    const response = await this.client.get('/governance/admin/proposals', {
      params: { page, limit, state },
    });
    return response.data;
  }

  async castAdminVote(
    proposalId: string,
    support: 0 | 1 | 2,
    reason?: string
  ): Promise<VoteResponse> {
    const response = await this.client.post(
      `/governance/admin/proposals/${proposalId}/vote`,
      { support, reason }
    );
    return response.data;
  }

  async configureProposalCountdown(
    proposalId: string,
    payload: { durationHours: number; approvalThresholdPercent?: number; startNow?: boolean }
  ): Promise<{
    proposalId: string;
    state: string;
    startBlock: number;
    endBlock: number;
    durationHours: number;
    approvalThresholdPercent: number;
    configured: boolean;
  }> {
    const response = await this.client.post(
      `/governance/admin/proposals/${proposalId}/configure-countdown`,
      payload
    );
    return response.data;
  }

  async updateSystemConfig(key: string, value: any): Promise<{ key: string; value: any; updated: boolean }> {
    const response = await this.client.patch(`/governance/admin/config/${key}`, { value });
    return response.data;
  }

  async recomputeInstitutionPoIC(
    institutionId: string
  ): Promise<{
    institutionId: string;
    score: number;
    onChainScore: number;
    updated: boolean;
    mode: string;
    timestamp: string;
  }> {
    const response = await this.client.post(
      `/governance/admin/institutions/${institutionId}/recompute-poic`,
      {}
    );
    return response.data;
  }

  async elevateInstitutionStatus(
    institutionId: string
  ): Promise<{
    institutionId: string;
    action: string;
    updated: boolean;
    verificationStatus: string;
    isVerified: boolean;
    timestamp: string;
  }> {
    const response = await this.client.post(
      `/governance/admin/institutions/${institutionId}/elevate-status`,
      {}
    );
    return response.data;
  }

  async decommissionInstitution(
    institutionId: string
  ): Promise<{
    institutionId: string;
    action: string;
    updated: boolean;
    verificationStatus: string;
    isVerified: boolean;
    blockchainAuthorized: boolean;
    timestamp: string;
  }> {
    const response = await this.client.post(
      `/governance/admin/institutions/${institutionId}/decommission`,
      {}
    );
    return response.data;
  }

  // ============ ANALYTICS API ============

  async getActiveProposals(): Promise<ProposalResponse[]> {
    const response = await this.client.get('/governance/analytics/active-proposals');
    return response.data;
  }

  async getPublicActiveProposals(): Promise<ProposalResponse[]> {
    const response = await this.client.get('/governance/public/analytics/active-proposals');
    return response.data;
  }

  async getGovernanceSummary(): Promise<any> {
    const response = await this.client.get('/governance/analytics/governance-summary');
    return response.data;
  }

  async getPublicGovernanceSummary(): Promise<any> {
    const response = await this.client.get('/governance/public/analytics/governance-summary');
    return response.data;
  }

  async getInstitutionMetrics(institutionId: string): Promise<any> {
    const response = await this.client.get(`/governance/analytics/institution-metrics/${institutionId}`);
    return response.data;
  }

  async getPoICScores(): Promise<PoICScoreResponse[]> {
    const response = await this.client.get('/governance/analytics/poic-scores');
    return response.data;
  }

  async getPublicPoICScores(): Promise<PoICScoreResponse[]> {
    const response = await this.client.get('/governance/public/analytics/poic-scores');
    return response.data;
  }

  async getPoICStatistics(): Promise<any> {
    const response = await this.client.get('/governance/analytics/poic-statistics');
    return response.data;
  }

  async getPublicPoICStatistics(): Promise<any> {
    const response = await this.client.get('/governance/public/analytics/poic-statistics');
    return response.data;
  }

  // ============ TRANSPARENCY API ============

  async getAssessmentTransparency(proposalId: string): Promise<AssessmentTransparencyResponse> {
    const response = await this.client.get(
      `/governance/proposals/${proposalId}/assessment-transparency`
    );
    return response.data;
  }

  async getAssessmentHistory(proposalId: string): Promise<AssessmentHistoryResponse> {
    const response = await this.client.get(
      `/governance/proposals/${proposalId}/assessment-history`
    );
    return response.data;
  }

  async getRiskAssessment(proposalId: string): Promise<RiskAssessmentResponse> {
    const response = await this.client.get(
      `/governance/proposals/${proposalId}/risk-assessment`
    );
    return response.data;
  }

  // ============ ERROR HANDLING ============

  async handleError(error: any): Promise<never> {
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data?.message || `Error: ${error.response.status}`);
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export const governanceApiService = new GovernanceApiService();
