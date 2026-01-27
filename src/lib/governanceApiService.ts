import axios, { AxiosInstance } from 'axios';

// API Base URL - will be configured based on environment
const API_BASE_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

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

class GovernanceApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
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

  // ============ VOTING API ============

  async castVote(proposalId: string, support: boolean): Promise<VoteResponse> {
    const response = await this.client.post(`/governance/proposals/${proposalId}/vote`, { support });
    return response.data;
  }

  async getVotingPower(proposalId: string): Promise<{ votingPower: number }> {
    const response = await this.client.get(`/governance/proposals/${proposalId}/voting-power`);
    return response.data;
  }

  async getVoteDetail(voteId: string): Promise<VoteResponse> {
    const response = await this.client.get(`/governance/votes/${voteId}`);
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

  async updateSystemConfig(key: string, value: any): Promise<{ key: string; value: any; updated: boolean }> {
    const response = await this.client.patch(`/governance/admin/config/${key}`, { value });
    return response.data;
  }

  // ============ ANALYTICS API ============

  async getActiveProposals(): Promise<ProposalResponse[]> {
    const response = await this.client.get('/governance/analytics/active-proposals');
    return response.data;
  }

  async getGovernanceSummary(): Promise<any> {
    const response = await this.client.get('/governance/analytics/governance-summary');
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

  async getPoICStatistics(): Promise<any> {
    const response = await this.client.get('/governance/analytics/poic-statistics');
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
