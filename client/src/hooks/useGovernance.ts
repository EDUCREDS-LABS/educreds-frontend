import { useQuery, useMutation, useInfiniteQuery, UseQueryOptions } from '@tanstack/react-query';
import { governanceApiService } from '../lib/governanceApiService.ts';
import type {
  ProposalResponse,
  InstitutionResponse,
  PoICScoreResponse,
  SystemMetricsResponse,
  AuditLogEntryResponse,
  PaginatedResponse,
  VoteResponse,
  SystemStatusResponse,
} from '../lib/governanceApiService.ts';

// Query keys for cache management
export const governanceKeys = {
  all: ['governance'],
  proposals: ['governance', 'proposals'],
  proposalDetail: (id: string) => ['governance', 'proposals', id],
  proposalVotes: (id: string) => ['governance', 'proposals', id, 'votes'],
  proposalsSummary: ['governance', 'proposals', 'summary'],
  institutions: ['governance', 'institutions'],
  institutionDetail: (id: string) => ['governance', 'institutions', id],
  adminMetrics: ['governance', 'admin', 'metrics'],
  auditLog: ['governance', 'admin', 'audit-log'],
  systemStatus: ['governance', 'admin', 'system-status'],
  institutionRegistry: ['governance', 'admin', 'institutions'],
  analytics: ['governance', 'analytics'],
  activeProposals: ['governance', 'analytics', 'active-proposals'],
  governanceSummary: ['governance', 'analytics', 'summary'],
  institutionMetrics: (id: string) => ['governance', 'analytics', 'institution', id],
  poicScores: ['governance', 'analytics', 'poic-scores'],
  poicStatistics: ['governance', 'analytics', 'poic-statistics'],
};

// ============ PROPOSALS HOOKS ============

export function useProposals(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [...governanceKeys.proposals, { page, limit }],
    queryFn: () => governanceApiService.listProposals(page, limit),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useInfiniteProposals(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: [...governanceKeys.proposals, { limit }],
    queryFn: ({ pageParam = 1 }) => governanceApiService.listProposals(pageParam, limit),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useProposalDetail(proposalId: string | undefined) {
  return useQuery({
    queryKey: governanceKeys.proposalDetail(proposalId || ''),
    queryFn: () => governanceApiService.getProposalDetail(proposalId!),
    enabled: !!proposalId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useProposalVotes(proposalId: string | undefined) {
  return useQuery({
    queryKey: governanceKeys.proposalVotes(proposalId || ''),
    queryFn: () => governanceApiService.getProposalVotes(proposalId!),
    enabled: !!proposalId,
    staleTime: 15 * 1000, // More frequent updates for votes
    gcTime: 5 * 60 * 1000,
  });
}

export function useProposalsSummary() {
  return useQuery({
    queryKey: governanceKeys.proposalsSummary,
    queryFn: () => governanceApiService.getProposalsSummary(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateProposal() {
  return useMutation({
    mutationFn: (data: any) => governanceApiService.createProposal(data),
  });
}

// ============ VOTING HOOKS ============

export function useVotingPower(proposalId: string | undefined) {
  return useQuery({
    queryKey: [...governanceKeys.proposalDetail(proposalId || ''), 'voting-power'],
    queryFn: () => governanceApiService.getVotingPower(proposalId!),
    enabled: !!proposalId,
    staleTime: 10 * 1000, // 10 seconds - voting power changes frequently
    gcTime: 5 * 60 * 1000,
  });
}

export function useCastVote() {
  return useMutation({
    mutationFn: ({ proposalId, support }: { proposalId: string; support: boolean }) =>
      governanceApiService.castVote(proposalId, support),
  });
}

// ============ INSTITUTIONS HOOKS ============

export function useInstitutions(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...governanceKeys.institutions, { page, limit }],
    queryFn: () => governanceApiService.listInstitutions(page, limit),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000,
  });
}

export function useInstitutionDetail(institutionId: string | undefined) {
  return useQuery({
    queryKey: governanceKeys.institutionDetail(institutionId || ''),
    queryFn: () => governanceApiService.getInstitutionDetail(institutionId!),
    enabled: !!institutionId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============ ADMIN HOOKS ============

export function useSystemMetrics() {
  return useQuery({
    queryKey: governanceKeys.adminMetrics,
    queryFn: () => governanceApiService.getSystemMetrics(),
    staleTime: 30 * 1000, // 30 seconds for metrics
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useAuditLog(page: number = 1, limit: number = 50, filters?: any) {
  return useQuery({
    queryKey: [...governanceKeys.auditLog, { page, limit, ...filters }],
    queryFn: () => governanceApiService.getAuditLog(page, limit, filters),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: governanceKeys.systemStatus,
    queryFn: () => governanceApiService.getSystemStatus(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useInstitutionRegistry(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...governanceKeys.institutionRegistry, { page, limit }],
    queryFn: () => governanceApiService.getInstitutionRegistry(page, limit),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUpdateSystemConfig() {
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      governanceApiService.updateSystemConfig(key, value),
  });
}

// ============ ANALYTICS HOOKS ============

export function useActiveProposals() {
  return useQuery({
    queryKey: governanceKeys.activeProposals,
    queryFn: () => governanceApiService.getActiveProposals(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useGovernanceSummary() {
  return useQuery({
    queryKey: governanceKeys.governanceSummary,
    queryFn: () => governanceApiService.getGovernanceSummary(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useInstitutionMetrics(institutionId: string | undefined) {
  return useQuery({
    queryKey: governanceKeys.institutionMetrics(institutionId || ''),
    queryFn: () => governanceApiService.getInstitutionMetrics(institutionId!),
    enabled: !!institutionId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePoICScores() {
  return useQuery({
    queryKey: governanceKeys.poicScores,
    queryFn: () => governanceApiService.getPoICScores(),
    staleTime: 60 * 1000, // PoIC scores update less frequently
    gcTime: 10 * 60 * 1000,
  });
}

export function usePoICStatistics() {
  return useQuery({
    queryKey: governanceKeys.poicStatistics,
    queryFn: () => governanceApiService.getPoICStatistics(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============ CACHING HELPERS ============

/**
 * Helper to get stale time based on data importance
 * Real-time data: 10-30 seconds
 * Frequently changing: 30-60 seconds
 * Stable data: 5-10 minutes
 */
export const getCacheConfig = (type: 'realtime' | 'frequent' | 'stable') => {
  switch (type) {
    case 'realtime':
      return { staleTime: 15 * 1000, gcTime: 5 * 60 * 1000 };
    case 'frequent':
      return { staleTime: 45 * 1000, gcTime: 10 * 60 * 1000 };
    case 'stable':
      return { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 };
    default:
      return { staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 };
  }
};
