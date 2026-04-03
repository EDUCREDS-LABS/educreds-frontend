import React, { useState } from 'react';
import { useIndexerStats, useSyncStatus, useFailedEvents, useDLQStats } from '@/hooks/useIndexer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';

/**
 * Blockchain Indexer Dashboard
 * Displays real-time indexer statistics and blockchain event tracking
 */
export const BlockchainIndexerDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useIndexerStats();
  const { data: syncStatus, isLoading: syncLoading } = useSyncStatus();
  const { data: failedEvents } = useFailedEvents({ limit: 5 });
  const { data: dlqStats } = useDLQStats();
  const [showDetails, setShowDetails] = useState(false);

  const isHealthy = stats?.errors?.length === 0 && syncStatus?.status === 'idle';

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blockchain Indexer</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time blockchain event tracking and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isHealthy ? 'default' : 'destructive'}>
            {isHealthy ? 'Healthy' : 'Issues Detected'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetchStats()}
            disabled={statsLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500">
              Last update: {stats?.latestTimestamp ? new Date(stats.latestTimestamp).toLocaleString() : 'Never'}
            </p>
          </CardContent>
        </Card>

        {/* Block Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lastBlockProcessed?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-500">
              Behind: {syncStatus?.estimatedBlocksBehind || 0}
            </p>
          </CardContent>
        </Card>

        {/* Pending Jobs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingJobs || 0}</div>
            <p className="text-xs text-gray-500">In queue</p>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {syncStatus?.status === 'idle' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {syncStatus?.status === 'syncing' && <Clock className="h-5 w-5 text-blue-600 animate-spin" />}
              {syncStatus?.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              <span className="capitalize font-medium">{syncStatus?.status || 'Unknown'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {syncStatus?.lastUpdated ? new Date(syncStatus.lastUpdated).toLocaleString() : 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Counts */}
      {stats?.eventCounts && (
        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
            <CardDescription>Breakdown of indexed events by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">IIN Events</p>
                <p className="text-2xl font-bold">{stats.eventCounts.iinEvents}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Credential</p>
                <p className="text-2xl font-bold">{stats.eventCounts.credentialEvents}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Votes</p>
                <p className="text-2xl font-bold">{stats.eventCounts.voteEvents}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Proposals</p>
                <p className="text-2xl font-bold">{stats.eventCounts.proposalEvents}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">PoIC Scores</p>
                <p className="text-2xl font-bold">{stats.eventCounts.poicEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Status */}
      {stats?.contractStatuses && stats.contractStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Status</CardTitle>
            <CardDescription>Indexing progress per smart contract</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.contractStatuses.map((contract, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-mono text-sm">{contract.contractAddress?.slice(0, 10)}...</p>
                    <p className="text-xs text-gray-600">
                      Block: {contract.lastBlockProcessed} | Events: {contract.totalEventsProcessed}
                    </p>
                  </div>
                  <Badge variant={contract.status === 'idle' ? 'default' : 'secondary'}>
                    {contract.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Events */}
      {dlqStats?.failedEventCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Failed Events (DLQ)</CardTitle>
            <CardDescription>{dlqStats.failedEventCount} events in dead-letter queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Unique Types</p>
                  <p className="text-lg font-bold">{dlqStats.uniqueEventTypes}</p>
                </div>
                <div>
                  <p className="text-gray-600">Oldest Event</p>
                  <p className="text-sm font-mono">
                    {dlqStats.oldestEvent ? new Date(dlqStats.oldestEvent).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Newest Event</p>
                  <p className="text-sm font-mono">
                    {dlqStats.newestEvent ? new Date(dlqStats.newestEvent).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {stats?.errors && stats.errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Errors Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.errors.map((error, idx) => (
                <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="font-mono text-sm mb-1">{error.contractAddress?.slice(0, 12)}...</p>
                  <p className="text-sm text-red-800">{error.error}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(error.lastOccurred).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About the Indexer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            The blockchain indexer captures and indexes all smart contract events in real-time. This data is stored
            in a queryable database for fast retrieval and analysis.
          </p>
          <p>
            The dead-letter queue (DLQ) stores events that fail permanently after retries, allowing manual recovery and
            debugging.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainIndexerDashboard;
