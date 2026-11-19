import { API_CONFIG } from '@/config/api';

// ── Types ──────────────────────────────────────────────────────────────────
export type ContractName =
  | 'IIN'
  | 'CredentialIssuer'
  | 'PoICRegistry'
  | 'GovernanceDAO'
  | 'ExecutionController';

export type EventName =
  | 'InstitutionMinted'
  | 'CredentialIssued'
  | 'VoteCast'
  | 'ProposalCreated'
  | 'ScoreUpdated'
  | 'ActionExecuted';

export type TxStatus = 'confirmed' | 'pending' | 'failed';

export interface BlockchainTransaction {
  txHash: string;
  blockNumber: number;
  contractAddress: string;
  contractName: ContractName;
  eventName: EventName;
  args: Record<string, any>;
  timestamp: string;
  status: TxStatus;
}

export interface IndexerStats {
  totalTransactions?: number;
  lastIndexedBlock?: number;
  eventCounts?: Partial<Record<EventName, number>>;
  syncStatus?: 'synced' | 'syncing' | 'error';
  // Backend format
  lastBlockProcessed?: number;
  totalEvents?: number;
  latestTimestamp?: string | null;
  contractStatuses?: Array<any>;
  errors?: Array<any>;
  pendingJobs?: number;
}

export interface TransactionFilters {
  eventName?: EventName | 'all';
  contractName?: ContractName | 'all';
  search?: string;
}

export interface PaginatedTransactions {
  data: BlockchainTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

const EVENT_CONTRACT_MAP: Record<EventName, ContractName> = {
  InstitutionMinted: 'IIN',
  CredentialIssued: 'CredentialIssuer',
  VoteCast: 'GovernanceDAO',
  ProposalCreated: 'GovernanceDAO',
  ScoreUpdated: 'PoICRegistry',
  ActionExecuted: 'ExecutionController',
};

function normalizeTx(row: any): BlockchainTransaction {
  const txHash = (row?.txHash || row?.hash || '').toString();
  const contractAddress = row?.contractAddress || '';
  const contractName =
    row?.contractName ||
    EVENT_CONTRACT_MAP[row?.eventName as EventName];

  return {
    txHash,
    blockNumber: Number(row?.blockNumber ?? 0),
    contractAddress,
    contractName: contractName as ContractName,
    eventName: row?.eventName as EventName,
    args: row?.args || {},
    timestamp: row?.timestamp || row?.createdAt || '',
    status: row?.status || 'pending',
  };
}

// ── Service ────────────────────────────────────────────────────────────────
class IndexerService {
  private readonly base: string;

  constructor() {
    this.base = `${API_CONFIG.CERT}/api/indexer`;
  }

  async getTransactions(
    page = 1,
    limit = 20,
    filters: TransactionFilters = {},
  ): Promise<PaginatedTransactions> {
    try {
      const q = new URLSearchParams({ 
        page: String(page), 
        limit: String(limit) 
      });
      if (filters.eventName && filters.eventName !== 'all') q.set('eventName', filters.eventName);
      if (filters.contractName && filters.contractName !== 'all') {
        q.set('contractName', filters.contractName);
      }
      if (filters.search) q.set('search', filters.search);

      const res = await fetch(`${this.base}/transactions?${q}`);
      if (!res.ok) throw new Error('Indexer offline');
      
      const data = await res.json();
      
      // Map backend response to frontend format
      if (data.pagination) {
        return {
          data: (data.data || []).map(normalizeTx),
          total: data.pagination.total,
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
        };
      }
      
      return {
        data: (Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []).map(normalizeTx),
        total: data.total || data.pagination?.total || 0,
        page: data.page || page,
        totalPages: data.totalPages || data.pagination?.totalPages || 1,
      };
    } catch (error) {
      console.error('[Indexer] transactions fetch failed:', error);
      return { data: [], total: 0, page, totalPages: 1 };
    }
  }

  async getIndexerStats(): Promise<IndexerStats> {
    try {
      const res = await fetch(`${this.base}/stats`);
      if (!res.ok) throw new Error('Indexer offline');
      
      const data = await res.json();
      
      // Map backend response to unified format
      return {
        totalTransactions: data.totalEvents || data.totalTransactions,
        lastIndexedBlock: data.lastBlockProcessed || data.lastIndexedBlock,
        eventCounts: data.eventCounts,
        syncStatus: data.syncStatus,
        lastBlockProcessed: data.lastBlockProcessed,
        totalEvents: data.totalEvents,
        latestTimestamp: data.latestTimestamp,
        contractStatuses: data.contractStatuses,
        errors: data.errors,
        pendingJobs: data.pendingJobs,
      };
    } catch (error) {
      console.error('[Indexer] stats fetch failed:', error);
      return {
        totalTransactions: 0,
        lastIndexedBlock: undefined,
        eventCounts: {},
        syncStatus: 'error',
      };
    }
  }

  async getInstitutionTransactions(institutionId: string): Promise<BlockchainTransaction[]> {
    try {
      const res = await fetch(
        `${this.base}/institutions/${encodeURIComponent(institutionId)}/transactions`,
      );
      if (!res.ok) throw new Error('Indexer offline');
      return res.json();
    } catch (error) {
      console.error('[Indexer] institution transactions fetch failed:', error);
      return [];
    }
  }

}

export const indexerService = new IndexerService();
