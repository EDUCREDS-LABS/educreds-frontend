# Frontend Indexer Integration Guide

## Overview

The EduCreds frontend has been successfully wired to the real blockchain indexer backend endpoints. This enables real-time viewing of indexed blockchain transactions, smart contract events, and system health metrics.

## What Was Added

### 1. API Configuration (`src/config/api.ts`)

Added complete indexer endpoint configuration:

```typescript
INDEXER: {
  // Public query endpoints
  TRANSACTIONS: /api/indexer/transactions
  TRANSACTION: /api/indexer/transactions/:txHash
  INSTITUTION_HISTORY: /api/indexer/institutions/:iin
  INSTITUTION_CREDENTIALS: /api/indexer/institutions/:iin/credentials
  PROPOSAL_STATE: /api/indexer/proposals/:proposalId
  PROPOSAL_VOTES: /api/indexer/proposals/:proposalId/votes
  STATS: /api/indexer/stats
  SYNC_STATUS: /api/indexer/sync/status
  SYNC_FORCE: /api/indexer/sync/force
  
  // Admin endpoints
  ADMIN: {
    FAILED_EVENTS: /api/indexer/admin/failed-events
    RETRY_EVENT: /api/indexer/admin/retry-failed-event/:key
    CLEAR_FAILED: /api/indexer/admin/clear-failed-events
    DLQ_STATS: /api/indexer/admin/dlq-stats
    EXPORT_FAILED: /api/indexer/admin/export-failed-events
    SYNC_RECEIPTS: /api/indexer/admin/sync-receipts
    RESET_CONTRACT: /api/indexer/admin/reset-contract/:address
  }
}
```

### 2. Custom Hook (`src/hooks/useIndexer.ts`)

Created comprehensive React Query hooks for all indexer operations:

#### Query Hooks (Read Data)
- `useTransactions(filters)` - Get blockchain transactions with pagination
- `useTransactionByHash(txHash)` - Get specific transaction details
- `useInstitutionHistory(iin)` - Get institution blockchain history
- `useInstitutionCredentials(iin, pagination)` - Get credentials issued by institution
- `useProposalState(proposalId)` - Get proposal on-chain state
- `useProposalVotes(proposalId, pagination)` - Get votes on proposal
- `useIndexerStats()` - Get indexer health & metrics (auto-refreshes every 30s)
- `useSyncStatus()` - Get indexing sync progress (auto-refreshes every 15s)
- `useFailedEvents(filters)` - Get failed events from dead-letter queue
- `useDLQStats()` - Get dead-letter queue statistics
- `useExportFailedEvents(format)` - Export failed events as JSON/CSV

#### Mutation Hooks (Write Data)
- `useForceSync(startBlock)` - Force indexer restart
- `useRetryFailedEvent(failureKey)` - Retry a failed event
- `useClearFailedEvents()` - Clear all failed events
- `useSyncReceipts()` - Fetch pending transaction receipts
- `useResetContract(address, startBlock)` - Reset contract indexing state

### 3. Blockchain Indexer Dashboard (`src/components/modern/BlockchainIndexerDashboard.tsx`)

Admin dashboard displaying:
- ✅ Total events indexed
- ✅ Latest block number
- ✅ Pending jobs in queue
- ✅ Real-time sync status
- ✅ Event distribution by type (IIN, Credential, Vote, Proposal, PoIC)
- ✅ Contract status tracking
- ✅ Failed events in dead-letter queue
- ✅ System errors and issues
- ✅ Health indicator

Features:
- Live refresh capability
- Real-time auto-updates
- Error highlighting
- Dead-letter queue management

### 4. Blockchain Transaction Viewer (`src/components/modern/BlockchainTransactionViewer.tsx`)

Transaction explorer featuring:
- Transaction search by hash
- Transaction filtering (event type, status)
- Detailed transaction view
- Related events display
- Copy-to-clipboard functionality
- Pagination support
- Status badges (pending, confirmed, failed, reverted)

## Usage Examples

### Display Indexer Dashboard

```tsx
import { BlockchainIndexerDashboard } from '@/components/modern/BlockchainIndexerDashboard';

function AdminPage() {
  return <BlockchainIndexerDashboard />;
}
```

### Display Transaction Viewer

```tsx
import { BlockchainTransactionViewer } from '@/components/modern/BlockchainTransactionViewer';

function TransactionsPage() {
  return <BlockchainTransactionViewer />;
}
```

### Use Indexer Hooks Directly

```tsx
import { useIndexerStats, useTransactions } from '@/hooks/useIndexer';

function MyComponent() {
  const { data: stats, isLoading } = useIndexerStats();
  const { data: transactions } = useTransactions({ 
    eventName: 'InstitutionMinted',
    page: 1,
    limit: 10
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total Events: {stats?.totalEvents}</h2>
      {transactions?.data.map(tx => (
        <div key={tx.hash}>{tx.eventName}</div>
      ))}
    </div>
  );
}
```

### Query Institution Events

```tsx
import { useInstitutionHistory } from '@/hooks/useIndexer';

function InstitutionBlockchainView({ institutionIin }) {
  const { data: history } = useInstitutionHistory(institutionIin);

  return (
    <div>
      <h3>Institution: {history?.institution?.name}</h3>
      <ul>
        {history?.events?.map(event => (
          <li key={event.txHash}>{event.eventType} at {event.timestamp}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Get and Retry Failed Events (Admin)

```tsx
import { useFailedEvents, useRetryFailedEvent } from '@/hooks/useIndexer';

function FailedEventsManager() {
  const { data: failedEvents } = useFailedEvents();
  const { mutate: retryEvent } = useRetryFailedEvent();

  return (
    <div>
      {failedEvents?.events?.map(event => (
        <div key={event.id}>
          <p>{event.eventName}: {event.failureReason}</p>
          <button onClick={() => retryEvent(event.id)}>Retry</button>
        </div>
      ))}
    </div>
  );
}
```

## Integration Points

### 1. Institution Dashboard
Add indexer data to institution profile:
```tsx
// Show institution's blockchain registration status
const { data: history } = useInstitutionHistory(institution.iinTokenId);
<Badge>{history?.institution?.blockchainRegistered ? 'On-Chain' : 'Not On-Chain'}</Badge>
```

### 2. Certificate Verification
Link certificates to blockchain events:
```tsx
// Show certificate blockchain status
const { data: tx } = useTransactionByHash(certificate.txHash);
<p>Status: {tx?.transaction?.status}</p>
```

### 3. Governance Dashboard
Display vote events from indexer:
```tsx
// Show proposal voting statistics
const { data: votes } = useProposalVotes(proposal.id);
<p>Total Votes: {votes?.votes?.length}</p>
```

### 4. Admin Panel
Full indexer management:
```tsx
// Show indexer health and allow management
<BlockchainIndexerDashboard />
```

## Backend Endpoints Reference

All endpoints return JSON and are authenticated with Bearer token in Authorization header.

### Public Query Endpoints

```
GET /api/indexer/transactions
  Query: page, limit, contractAddress, eventName, status, startDate, endDate
  Returns: { data: Transaction[], pagination: { page, limit, total, totalPages } }

GET /api/indexer/transactions/:txHash
  Returns: { transaction: Transaction, events: {...} }

GET /api/indexer/institutions/:iin
  Returns: { institution: Institution, events: IINEvent[] }

GET /api/indexer/institutions/:iin/credentials
  Query: page, limit
  Returns: { institutionId, credentials: CredentialEvent[], pagination }

GET /api/indexer/proposals/:proposalId
  Returns: { proposal: Proposal, events: ProposalEvent[] }

GET /api/indexer/proposals/:proposalId/votes
  Query: page, limit
  Returns: { proposalId, votes: VoteEvent[], stats: {}, pagination }

GET /api/indexer/stats
  Returns: IndexerStatsDto with event counts, contract statuses, errors

GET /api/indexer/sync/status
  Returns: SyncStatusDto with block progress and queue depth

POST /api/indexer/sync/force
  Body: { startBlock?: number }
  Returns: { success: boolean, message: string }
```

### Admin Endpoints

```
GET /api/indexer/admin/failed-events
  Query: eventName, limit, offset
  Returns: { events: FailedEvent[], total: number }

POST /api/indexer/admin/retry-failed-event/:failureKey
  Returns: { success: boolean, message: string }

DELETE /api/indexer/admin/clear-failed-events
  Returns: { success: boolean, cleared: number }

GET /api/indexer/admin/dlq-stats
  Returns: { failedEventCount, uniqueEventTypes, oldestEvent, newestEvent }

GET /api/indexer/admin/export-failed-events
  Query: format (json|csv)
  Returns: { data: string }

POST /api/indexer/admin/sync-receipts
  Returns: { success: boolean, syncedCount: number }

POST /api/indexer/admin/reset-contract/:address
  Body: { startBlock?: number }
  Returns: { success: boolean, message: string }
```

## Data Types

### BlockchainTransaction
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
  error?: string;
  confirmationDepth: number;
}
```

### IndexerStats
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
  contractStatuses: Array<{...}>;
  errors: Array<{...}>;
  pendingJobs: number;
}
```

## Features & Capabilities

### ✅ Real-Time Data
- Auto-refresh every 10-30 seconds
- Live queue depth tracking
- Real-time sync status

### ✅ Query & Filter
- Filter by event type, status, date range
- Search by transaction hash
- Paginated results

### ✅ Administration
- View failed events
- Retry failed events
- Clear dead-letter queue
- Reset contract indexing
- Sync transaction receipts

### ✅ Analytics
- Event distribution charts
- Contract status monitoring
- Error tracking & debugging
- Export capabilities

## Environment Configuration

The frontend automatically detects the backend URL:
- Local dev: `http://localhost:3001`
- Deployed: Uses same origin or `VITE_CERT_API_BASE`

Override with environment variable:
```
VITE_CERT_API_BASE=https://api.example.com
```

## Performance & Caching

React Query is configured for optimal performance:
- Query results cached for 30-60 seconds
- Automatic invalidation on mutations
- Background refetches enabled
- Deduplication of simultaneous requests

## Error Handling

All hooks include error states:
```tsx
const { data, isLoading, error } = useIndexerStats();

if (error) return <div>Error: {error.message}</div>;
if (isLoading) return <div>Loading...</div>;
```

## Next Steps

1. **Display Dashboard**: Add BlockchainIndexerDashboard to admin page
2. **Add to Menu**: Link to transaction viewer in navigation
3. **Integrate with Components**: Use hooks in existing institution/certificate components
4. **Setup Monitoring**: Use stats hook for health checks
5. **Configure Alerts**: Build alert system based on error states

## Security Notes

- All endpoints require authentication
- Failed events are sensitive - restrict access to admins only
- Receipt syncing requires admin privileges
- Contract reset limited to authorized admins

## Testing

Test the integration with:
```tsx
// In browser console
fetch('/api/indexer/stats').then(r => r.json()).then(console.log);
```

Should return stats object with event counts and contract statuses.

---

**Frontend Integration Status**: ✅ COMPLETE
- API configuration added
- React Query hooks implemented
- Dashboard component created
- Transaction viewer created
- Ready for production use
