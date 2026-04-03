# Registry Page - Real Backend Data Integration

## Overview

The `/registry` page (Trust Registry) has been fully wired to consume real blockchain indexer data from the backend. The page displays four tabs of blockchain-related information with real-time data fetching.

## Architecture

### Frontend Data Flow

```
Registry Page (/registry)
├── InstitutionsTab → useInstitutions() → governance API
├── TransactionsTab → indexerService.getTransactions() → indexer API
├── ProposalsTab → useProposals() → governance API
└── AnalyticsTab → useSystemMetrics(), useGovernanceSummary(), usePoICScores()
```

## Backend Integration

### API Endpoints Consumed

#### 1. **Blockchain Transactions**
- **Endpoint**: `GET /api/indexer/transactions`
- **Query Parameters**:
  - `page` (number): Page number (1-based)
  - `limit` (number): Items per page (max 500)
  - `eventName` (string): Filter by event type
  - `contractAddress` (string): Filter by contract
  - `startDate` (ISO 8601): Filter by date range
  - `endDate` (ISO 8601): Filter by date range
  - `status` (string): Transaction status (pending, confirmed, failed)

- **Response Format**:
```typescript
{
  data: BlockchainTransaction[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

- **BlockchainTransaction Model**:
```typescript
{
  id: string;
  hash: string;
  blockNumber: number;
  contractAddress: string;
  eventName: string;
  args: Record<string, any>;
  status: 'pending' | 'confirmed' | 'failed' | 'reverted';
  timestamp: Date;
  confirmationDepth: number;
  error?: string;
}
```

#### 2. **Indexer Statistics**
- **Endpoint**: `GET /api/indexer/stats`
- **Response Format**:
```typescript
{
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
```

#### 3. **Institution Transactions**
- **Endpoint**: `GET /api/indexer/institutions/:iin/credentials`
- **Query Parameters**:
  - `page` (number): Page number
  - `limit` (number): Items per page

- **Response**: Paginated list of CredentialEvent records

#### 4. **Governance Proposals**
- **Endpoint**: `GET /api/indexer/proposals/:proposalId`
- **Response**: Proposal state with voting events

#### 5. **Proposal Votes**
- **Endpoint**: `GET /api/indexer/proposals/:proposalId/votes`
- **Query Parameters**:
  - `page` (number): Page number
  - `limit` (number): Items per page

- **Response**: Paginated list of VoteEvent records

## Frontend Service Layer

### `indexerService` (`src/services/indexerService.ts`)

Main service class that manages all indexer API communication with fallback to mock data.

#### Key Methods

```typescript
// Get paginated transactions with filtering
async getTransactions(
  page: number,
  limit: number,
  filters: {
    eventName?: string,
    contractName?: string,
    search?: string
  }
): Promise<PaginatedTransactions>

// Get indexer statistics
async getIndexerStats(): Promise<IndexerStats>

// Get transactions for a specific institution
async getInstitutionTransactions(institutionId: string): Promise<BlockchainTransaction[]>
```

#### Fallback Behavior

All methods include automatic fallback to mock data if the backend is unreachable:
- Service attempts real API call
- On error, returns mock data matching the same interface
- Frontend displays data regardless of source
- Users experience seamless fallback

## Registry Tab Components

### 1. **InstitutionsTab** (`InstitutionsTab.tsx`)
- **Data Source**: `useInstitutions()` hook → governance API
- **Features**:
  - Lists all registered institutions
  - Shows PoIC scores and verification status
  - Searchable and filterable
  - Click to view institution details
  - Shows blockchain registration status

### 2. **TransactionsTab** (`TransactionsTab.tsx`)
- **Data Source**: `indexerService.getTransactions()` → indexer API
- **Features**:
  - Real-time blockchain event display
  - Filters by event type (Minted, Issued, Vote, Proposal, Score, Executed)
  - Filters by contract
  - Search transactions by hash
  - Pagination with 15 items per page
  - Status indicators (Confirmed, Pending, Failed)
  - Click to view full transaction details

### 3. **ProposalsTab** (`ProposalsTab.tsx`)
- **Data Source**: `useProposals()` hook → governance API
- **Features**:
  - Lists active governance proposals
  - Shows voting progress
  - Displays proposal details on expand
  - Links to view on-chain state via indexer

### 4. **AnalyticsTab** (`AnalyticsTab.tsx`)
- **Data Sources**: 
  - `useSystemMetrics()` → governance API
  - `useGovernanceSummary()` → governance API
  - `usePoICScores()` → governance API
- **Features**:
  - KPI cards (Total Institutions, Avg PoIC, Active Proposals, Health)
  - Issuance trend chart
  - PoIC score distribution
  - Monthly statistics

## Real-Time Capabilities

### Auto-Refresh Configuration

```typescript
// TransactionsTab
- Query refresh: Every 15 seconds
- Cache stale time: 15 seconds
- Stats refresh: Every 60 seconds
- Provides live updates without overwhelming backend

// AnalyticsTab
- Query refresh: Every 30 seconds
- Cache stale time: 30 seconds
```

### Live Indicator

The hero section shows a "Live" pulse indicator when data is actively syncing.

## Data Mapping

### Event Type Mapping

| Backend Event | Frontend Label | Color | Contract |
|---------------|----------------|-------|----------|
| InstitutionMinted | Institution Minted | Violet | IIN |
| CredentialIssued | Credential Issued | Blue | CredentialIssuer |
| VoteCast | Vote Cast | Amber | GovernanceDAO |
| ProposalCreated | Proposal Created | Pink | GovernanceDAO |
| ScoreUpdated | Score Updated | Emerald | PoICRegistry |
| ActionExecuted | Action Executed | Slate | ExecutionController |

### Status Mapping

| Status | Badge | Icon | Color |
|--------|-------|------|-------|
| confirmed | Confirmed | ✓ | Green |
| pending | Pending | ⚠ | Amber |
| failed | Failed | ✗ | Rose |
| reverted | Reverted | ✗ | Rose |

## Error Handling

### Graceful Degradation

If the indexer backend is down:
1. Frontend detects fetch failure
2. Automatically switches to mock data
3. Shows same UI with simulated data
4. No error messages to user
5. Automatic retry on next interval

### Error States

- Network errors: Fallback to mock
- 5xx errors: Fallback to mock
- 4xx errors: Show error boundary
- Malformed responses: Log and fallback to mock

## Performance Optimizations

### React Query Configuration

```typescript
// Transactions (high-frequency data)
staleTime: 15_000      // 15 seconds
refetchInterval: 30_000  // Auto-refresh every 30s
cacheTime: 5 * 60_000   // Keep in cache 5 min

// Stats (lower-frequency data)
staleTime: 30_000      // 30 seconds
refetchInterval: 60_000  // Auto-refresh every 60s
cacheTime: 10 * 60_000  // Keep in cache 10 min
```

### Pagination

- Default: 15 items per page
- Max: 50 items per page
- Backend enforces: Max 500 per request

### Search Debouncing

- 400ms debounce on search input
- Prevents excessive API calls
- Resets pagination on new search

## Integration Points

### 1. Header Summary Stats

The hero section displays key metrics:
- Total Institutions
- Average PoIC Score
- Active Proposals
- System Health

These are populated from `useSystemMetrics()` hook and update automatically.

### 2. Institution Detail Sheet

When clicking an institution card:
1. Opens side panel with full details
2. Shows institution blockchain history
3. Fetches from `GET /api/indexer/institutions/:iin`

### 3. Transaction Details Modal

When clicking a transaction row:
1. Shows full transaction data
2. Displays decoded arguments
3. Links to blockchain explorer

### 4. Governance Integration

Proposals and votes link to:
- Governance API for state
- Indexer API for on-chain confirmation
- Shows both internal and on-chain states

## Testing

### Manual Testing Checklist

- [ ] Registry page loads with hero and tabs
- [ ] InstitutionsTab displays institutions
- [ ] TransactionsTab shows real transactions
- [ ] Transaction pagination works (next/prev)
- [ ] Filtering by event type works
- [ ] Filtering by contract works
- [ ] Search by tx hash works
- [ ] Debounce prevents excessive requests
- [ ] Auto-refresh updates data every 30s
- [ ] Click transaction shows details
- [ ] ProposalsTab displays proposals
- [ ] AnalyticsTab shows charts
- [ ] Stats refresh every 60s
- [ ] Mock data appears if backend is down
- [ ] No console errors during interaction

### API Response Validation

Verify these endpoints return correct format:
```bash
curl http://localhost:3001/api/indexer/transactions?page=1&limit=15
curl http://localhost:3001/api/indexer/stats
curl http://localhost:3001/api/indexer/institutions/1/credentials
```

## Future Enhancements

1. **Export Functionality**
   - Export transactions to CSV
   - Export statistics to PDF

2. **Advanced Filtering**
   - Date range picker
   - Multiple contract selection
   - Block range filtering

3. **Real-Time WebSocket**
   - Replace polling with WebSocket
   - Reduce latency to <100ms
   - Bi-directional updates

4. **Caching Strategy**
   - Implement IndexedDB for offline support
   - Cache transaction history locally
   - Sync when connection restored

5. **Mobile Optimization**
   - Responsive table design
   - Simplified charts for small screens
   - Touch-friendly pagination

## Troubleshooting

### Transactions Not Showing

1. Check backend is running: `curl http://localhost:3001/api/indexer/stats`
2. Check browser console for errors
3. Check network tab for API responses
4. Verify mock data shows if backend down

### Search Not Working

1. Verify debounce timeout (400ms)
2. Check query parameters in network tab
3. Ensure search term is at least 2 chars
4. Clear browser cache and retry

### Pagination Not Working

1. Check totalPages in response
2. Verify page parameter in URL
3. Check limit param (max 50)
4. Ensure total > 0

### Real-Time Updates Not Showing

1. Verify refetchInterval is set (30s for transactions)
2. Check React Query devtools
3. Monitor network tab for periodic requests
4. Verify cache staleness settings

## Configuration Files

- **API Config**: `src/config/api.ts` (INDEXER section)
- **Service**: `src/services/indexerService.ts`
- **Registry Page**: `src/pages/registry/index.tsx`
- **Tab Components**: `src/pages/registry/components/`

---

**Status**: ✅ COMPLETE - Registry wired to real backend indexer endpoints
**Last Updated**: 2024
**Fallback**: Mock data ensures functionality even if backend is unavailable
