import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';

/**
 * Blockchain Event Indexer Hooks
 * Provides access to blockchain event indexing, querying, and management
 */

// Types for indexer responses
export interface BlockchainTransaction {
  id: string;
  hash: string;
  blockNumber: number;
  contractAddress: string;
  eventName: string;
  args: Record<string, any>;
  status: 'pending' | 'confirmed' | 'failed' | 'reverted';
  timestamp: Date;
  error?: string;
  confirmationDepth: number;
}

export interface IndexerStats {
  lastBlockProcessed: number;
  totalEvents: number;
  eventCounts: {
    iinEvents: number;
    credentialEvents: number;
    voteEvents: number;
    proposalEvents: number;
    poicEvents: number;
  };
  latestTimestamp: Date | null;
  contractStatuses: Array<{
    contractAddress: string;
    status: string;
    totalEventsProcessed: number;
    failedEventCount: number;
    lastBlockProcessed: number;
    lastUpdated: Date;
  }>;
  errors: Array<{
    contractAddress: string;
    error: string;
    lastOccurred: Date;
  }>;
  pendingJobs: number;
}

export interface SyncStatus {
  currentBlock: number;
  lastBlockProcessed: number;
  status: 'idle' | 'syncing' | 'error' | 'paused';
  pendingJobsCount: number;
  lastUpdated: Date;
  estimatedBlocksBehind: number;
}

export interface FailedEvent {
  eventName: string;
  timestamp: string;
  failureReason: string;
  attemptCount: number;
  contractAddress: string;
}

// Query Hooks

/**
 * Get blockchain transactions with filtering and pagination
 */
export const useTransactions = (
  filters?: {
    contractAddress?: string;
    eventName?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ['indexer', 'transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.contractAddress) params.append('contractAddress', filters.contractAddress);
      if (filters?.eventName) params.append('eventName', filters.eventName);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${API_CONFIG.INDEXER.TRANSACTIONS}?${params}`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Get transaction details by hash
 */
export const useTransactionByHash = (txHash: string | null) => {
  return useQuery({
    queryKey: ['indexer', 'transaction', txHash],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.INDEXER.TRANSACTION(txHash!), {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch transaction');
      return response.json();
    },
    enabled: !!txHash,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Get institution blockchain history
 */
export const useInstitutionHistory = (iin: number | null) => {
  return useQuery({
    queryKey: ['indexer', 'institution', iin],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.INDEXER.INSTITUTION_HISTORY(iin!), {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch institution history');
      return response.json();
    },
    enabled: iin !== null,
    staleTime: 30000,
  });
};

/**
 * Get credentials issued by institution
 */
export const useInstitutionCredentials = (
  iin: number | null,
  pagination?: { page?: number; limit?: number }
) => {
  return useQuery({
    queryKey: ['indexer', 'institution-credentials', iin, pagination],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', pagination.limit.toString());

      const response = await fetch(
        `${API_CONFIG.INDEXER.INSTITUTION_CREDENTIALS(iin!)}?${params}`,
        {
          headers: await getAuthHeaders(),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch institution credentials');
      return response.json();
    },
    enabled: iin !== null,
    staleTime: 30000,
  });
};

/**
 * Get proposal on-chain state
 */
export const useProposalState = (proposalId: string | null) => {
  return useQuery({
    queryKey: ['indexer', 'proposal', proposalId],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.INDEXER.PROPOSAL_STATE(proposalId!), {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch proposal state');
      return response.json();
    },
    enabled: !!proposalId,
    staleTime: 30000,
  });
};

/**
 * Get votes on proposal
 */
export const useProposalVotes = (
  proposalId: string | null,
  pagination?: { page?: number; limit?: number }
) => {
  return useQuery({
    queryKey: ['indexer', 'proposal-votes', proposalId, pagination],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', pagination.limit.toString());

      const response = await fetch(`${API_CONFIG.INDEXER.PROPOSAL_VOTES(proposalId!)}?${params}`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch proposal votes');
      return response.json();
    },
    enabled: !!proposalId,
    staleTime: 30000,
  });
};

/**
 * Get indexer health & metrics
 */
export const useIndexerStats = () => {
  return useQuery({
    queryKey: ['indexer', 'stats'],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.INDEXER.STATS, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch indexer stats');
      return response.json() as Promise<IndexerStats>;
    },
    staleTime: 10000, // 10 seconds - more frequent updates
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Get indexing sync status
 */
export const useSyncStatus = () => {
  return useQuery({
    queryKey: ['indexer', 'sync-status'],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.INDEXER.SYNC_STATUS, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json() as Promise<SyncStatus>;
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 15000, // Refetch every 15 seconds
  });
};

// Mutation Hooks

/**
 * Force indexing restart
 */
export const useForceSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (startBlock?: number) => {
      const response = await fetch(API_CONFIG.INDEXER.SYNC_FORCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ startBlock: startBlock || 0 }),
      });

      if (!response.ok) throw new Error('Failed to force sync');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['indexer', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['indexer', 'sync-status'] });
    },
  });
};

// Admin Hooks

/**
 * Get failed events from dead-letter queue
 */
export const useFailedEvents = (
  filters?: {
    eventName?: string;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['indexer', 'admin', 'failed-events', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.eventName) params.append('eventName', filters.eventName);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`${API_CONFIG.INDEXER.ADMIN.FAILED_EVENTS}?${params}`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch failed events');
      return response.json();
    },
    staleTime: 30000,
  });
};

/**
 * Retry a failed event
 */
export const useRetryFailedEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (failureKey: string) => {
      const response = await fetch(API_CONFIG.INDEXER.ADMIN.RETRY_EVENT(failureKey), {
        method: 'POST',
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to retry event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indexer', 'admin', 'failed-events'] });
    },
  });
};

/**
 * Clear all failed events from DLQ
 */
export const useClearFailedEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(API_CONFIG.INDEXER.ADMIN.CLEAR_FAILED, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to clear failed events');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indexer', 'admin', 'failed-events'] });
      queryClient.invalidateQueries({ queryKey: ['indexer', 'admin', 'dlq-stats'] });
    },
  });
};

/**
 * Get dead-letter queue statistics
 */
export const useDLQStats = () => {
  return useQuery({
    queryKey: ['indexer', 'admin', 'dlq-stats'],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.INDEXER.ADMIN.DLQ_STATS, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch DLQ stats');
      return response.json();
    },
    staleTime: 30000,
  });
};

/**
 * Export failed events as JSON or CSV
 */
export const useExportFailedEvents = (format: 'json' | 'csv' = 'json') => {
  return useQuery({
    queryKey: ['indexer', 'admin', 'export-failed-events', format],
    queryFn: async () => {
      const response = await fetch(`${API_CONFIG.INDEXER.ADMIN.EXPORT_FAILED}?format=${format}`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to export failed events');
      return response.json();
    },
    staleTime: 60000,
  });
};

/**
 * Sync pending transaction receipts
 */
export const useSyncReceipts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(API_CONFIG.INDEXER.ADMIN.SYNC_RECEIPTS, {
        method: 'POST',
        headers: await getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to sync receipts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indexer', 'stats'] });
    },
  });
};

/**
 * Reset contract indexing state
 */
export const useResetContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { contractAddress: string; startBlock?: number }) => {
      const response = await fetch(API_CONFIG.INDEXER.ADMIN.RESET_CONTRACT(data.contractAddress), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ startBlock: data.startBlock || 0 }),
      });

      if (!response.ok) throw new Error('Failed to reset contract');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indexer', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['indexer', 'sync-status'] });
    },
  });
};
