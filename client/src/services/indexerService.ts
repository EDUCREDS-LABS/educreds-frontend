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
  totalTransactions: number;
  lastIndexedBlock: number;
  eventCounts: Partial<Record<EventName, number>>;
  syncStatus: 'synced' | 'syncing' | 'error';
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

// ── Mock data helpers ──────────────────────────────────────────────────────
const CONTRACT_ADDRESSES: Record<ContractName, string> = {
  IIN: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012',
  CredentialIssuer: '0xabcdef1234567890abcdef1234567890abcdef12',
  PoICRegistry: '0x9876543210fedcba9876543210fedcba98765432',
  GovernanceDAO: '0xfedcba9876543210fedcba9876543210fedcba98',
  ExecutionController: '0x1111222233334444555566667777888899990000',
};

const EVENT_CONTRACT_MAP: Record<EventName, ContractName> = {
  InstitutionMinted: 'IIN',
  CredentialIssued: 'CredentialIssuer',
  VoteCast: 'GovernanceDAO',
  ProposalCreated: 'GovernanceDAO',
  ScoreUpdated: 'PoICRegistry',
  ActionExecuted: 'ExecutionController',
};

function rndHex(n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

function buildArgs(eventName: EventName): Record<string, any> {
  switch (eventName) {
    case 'InstitutionMinted':
      return { tokenId: (Math.floor(Math.random() * 999) + 1000).toString(), owner: `0x${rndHex(40)}` };
    case 'CredentialIssued':
      return { tokenId: Math.floor(Math.random() * 50000), recipient: `0x${rndHex(40)}`, institutionId: `inst-${rndHex(8)}` };
    case 'VoteCast':
      return { proposalId: Math.floor(Math.random() * 100), voter: `0x${rndHex(40)}`, support: Math.random() > 0.4 ? 1 : 0, weight: Math.floor(Math.random() * 100) };
    case 'ProposalCreated':
      return { proposalId: Math.floor(Math.random() * 100), proposer: `0x${rndHex(40)}` };
    case 'ScoreUpdated':
      return { institutionId: `inst-${rndHex(8)}`, oldScore: Math.floor(Math.random() * 50) + 20, newScore: Math.floor(Math.random() * 40) + 60 };
    case 'ActionExecuted':
      return { proposalId: Math.floor(Math.random() * 100), executor: `0x${rndHex(40)}`, success: true };
    default:
      return {};
  }
}

function buildMockTransactions(): BlockchainTransaction[] {
  const events: EventName[] = [
    'InstitutionMinted',
    'CredentialIssued',
    'VoteCast',
    'ProposalCreated',
    'ScoreUpdated',
    'ActionExecuted',
  ];
  const statuses: TxStatus[] = ['confirmed', 'confirmed', 'confirmed', 'confirmed', 'pending', 'failed'];
  const now = Date.now();

  return Array.from({ length: 120 }, (_, i) => {
    const eventName = events[i % events.length];
    const contractName = EVENT_CONTRACT_MAP[eventName];
    const hoursAgo = i * 5 + Math.floor((i * 3) % 4);

    return {
      txHash: `0x${rndHex(64)}`,
      blockNumber: 12_487_293 - i * 12,
      contractAddress: CONTRACT_ADDRESSES[contractName],
      contractName,
      eventName,
      args: buildArgs(eventName),
      timestamp: new Date(now - hoursAgo * 3_600_000).toISOString(),
      status: statuses[i % statuses.length],
    };
  });
}

// Generated once at module load for stable references across renders
const MOCK_TXS = buildMockTransactions();

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
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filters.eventName && filters.eventName !== 'all') q.set('eventName', filters.eventName);
      if (filters.contractName && filters.contractName !== 'all') q.set('contractName', filters.contractName);
      if (filters.search) q.set('search', filters.search);

      const res = await fetch(`${this.base}/transactions?${q}`);
      if (!res.ok) throw new Error('Indexer offline');
      return res.json();
    } catch {
      return this._mockPage(MOCK_TXS, page, limit, filters);
    }
  }

  async getIndexerStats(): Promise<IndexerStats> {
    try {
      const res = await fetch(`${this.base}/stats`);
      if (!res.ok) throw new Error('Indexer offline');
      return res.json();
    } catch {
      const counts: Partial<Record<EventName, number>> = {};
      MOCK_TXS.forEach(tx => {
        counts[tx.eventName] = (counts[tx.eventName] ?? 0) + 1;
      });
      return {
        totalTransactions: MOCK_TXS.length,
        lastIndexedBlock: 12_487_293,
        eventCounts: counts,
        syncStatus: 'synced',
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
    } catch {
      return MOCK_TXS.filter(tx =>
        ['InstitutionMinted', 'CredentialIssued', 'ScoreUpdated'].includes(tx.eventName),
      ).slice(0, 8);
    }
  }

  private _mockPage(
    all: BlockchainTransaction[],
    page: number,
    limit: number,
    filters: TransactionFilters,
  ): PaginatedTransactions {
    let rows = all;
    if (filters.eventName && filters.eventName !== 'all')
      rows = rows.filter(t => t.eventName === filters.eventName);
    if (filters.contractName && filters.contractName !== 'all')
      rows = rows.filter(t => t.contractName === filters.contractName);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        t => t.txHash.toLowerCase().includes(q) || t.eventName.toLowerCase().includes(q),
      );
    }
    const total = rows.length;
    const data = rows.slice((page - 1) * limit, page * limit);
    return { data, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}

export const indexerService = new IndexerService();
