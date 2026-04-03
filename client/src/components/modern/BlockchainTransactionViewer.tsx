import React, { useState } from 'react';
import { useTransactions, useTransactionByHash } from '@/hooks/useIndexer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Copy, Check } from 'lucide-react';

/**
 * Blockchain Transaction Viewer
 * Displays indexed blockchain transactions with search and filtering
 */
export const BlockchainTransactionViewer: React.FC = () => {
  const [searchHash, setSearchHash] = useState('');
  const [filter, setFilter] = useState<{
    contractAddress?: string;
    eventName?: string;
    status?: string;
    page?: number;
  }>({ page: 1 });
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const { data: transactions, isLoading, error } = useTransactions(filter);
  const { data: singleTx, isLoading: singleLoading } = useTransactionByHash(
    searchHash.length === 66 ? searchHash : null
  );

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    reverted: 'bg-red-100 text-red-800',
  };

  return (
    <div className="w-full space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Blockchain Transactions</h1>
        <p className="text-sm text-gray-500 mt-1">Search and analyze indexed blockchain events</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Transaction</CardTitle>
          <CardDescription>Enter transaction hash to view details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              className="font-mono"
            />
            <Button disabled={searchHash.length !== 66 || singleLoading}>
              {singleLoading ? 'Loading...' : 'Search'}
            </Button>
          </div>

          {singleTx && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm break-all">{singleTx.transaction?.hash}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyHash(singleTx.transaction?.hash)}
                >
                  {copiedHash === singleTx.transaction?.hash ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Status</p>
                  <Badge className={statusColors[singleTx.transaction?.status] || 'default'}>
                    {singleTx.transaction?.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-600">Block</p>
                  <p className="font-mono">{singleTx.transaction?.blockNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Event</p>
                  <p className="font-mono text-xs">{singleTx.transaction?.eventName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="text-xs">
                    {new Date(singleTx.transaction?.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              {singleTx.events && Object.keys(singleTx.events).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-semibold text-sm mb-2">Related Events</p>
                  <div className="space-y-2 text-sm">
                    {Object.entries(singleTx.events).map(([type, events]: [string, any[]]) =>
                      events?.length > 0 ? (
                        <p key={type}>
                          <span className="text-gray-600">{type}:</span> {events.length} events
                        </p>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Event Name</label>
              <Input
                placeholder="e.g., InstitutionMinted"
                value={filter.eventName || ''}
                onChange={(e) => setFilter({ ...filter, eventName: e.target.value || undefined, page: 1 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={filter.status || ''}
                onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined, page: 1 })}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="failed">Failed</option>
                <option value="reverted">Reverted</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">&nbsp;</label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilter({ page: 1 })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Indexed Transactions</CardTitle>
          <CardDescription>
            {transactions?.pagination?.total} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading transactions...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Error loading transactions</div>
          ) : transactions?.data?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transactions found</div>
          ) : (
            <div className="space-y-3">
              {transactions.data.map((tx: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-sm truncate max-w-xs">{tx.hash}</p>
                      <p className="text-xs text-gray-600 mt-1">{tx.eventName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={statusColors[tx.status] || 'default'}>
                        {tx.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyHash(tx.hash)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mt-3">
                    <div>
                      <p className="text-xs">Block</p>
                      <p className="font-mono">{tx.blockNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs">Contract</p>
                      <p className="font-mono text-xs truncate">{tx.contractAddress?.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-xs">Confirmations</p>
                      <p className="font-mono">{tx.confirmationDepth}</p>
                    </div>
                    <div>
                      <p className="text-xs">Time</p>
                      <p className="text-xs">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {transactions?.pagination && transactions.pagination.totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-6">
              <Button
                variant="outline"
                disabled={filter.page === 1}
                onClick={() => setFilter({ ...filter, page: (filter.page || 1) - 1 })}
              >
                Previous
              </Button>
              <div className="px-4 py-2 text-sm">
                Page {filter.page || 1} of {transactions.pagination.totalPages}
              </div>
              <Button
                variant="outline"
                disabled={(filter.page || 1) >= transactions.pagination.totalPages}
                onClick={() => setFilter({ ...filter, page: (filter.page || 1) + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainTransactionViewer;
