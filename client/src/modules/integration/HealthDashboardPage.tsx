// educreds-frontend/src/modules/integration/HealthDashboardPage.tsx
import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/modern/ErrorBoundary';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { getInstitutionHealthStatus, InstitutionHealthStatus, SystemComponentHealth } from '@/services/health-status';
import { useAuth } from '@/hooks/useAuth';

const HealthIndicator: React.FC<{ status: SystemComponentHealth['status']; label: string; message?: string }> = ({ status, label, message }) => {
  let colorClass = '';
  let icon = '';
  switch (status) {
    case 'healthy':
      colorClass = 'bg-green-100 text-green-800';
      icon = '✅';
      break;
    case 'degraded':
      colorClass = 'bg-yellow-100 text-yellow-800';
      icon = '⚠️';
      break;
    case 'unhealthy':
      colorClass = 'bg-red-100 text-red-800';
      icon = '❌';
      break;
    case 'n/a': // Specific for connector when not configured
    default:
      colorClass = 'bg-gray-100 text-gray-800';
      icon = '⚪';
  }

  return (
    <div className={`p-4 rounded-lg flex items-center space-x-3 ${colorClass}`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="text-lg font-semibold">{label}: <span className="capitalize">{status}</span></h3>
        {message && <p className="text-sm opacity-90">{message}</p>}
      </div>
    </div>
  );
};

const HealthDashboard: React.FC = () => {
  const { user } = useAuth();
  const institutionId = user?.id || '';
  const { data: healthStatus, isLoading, isError, error, isFetching, refetch } = useQuery<InstitutionHealthStatus, Error>({
    queryKey: ['healthStatus', institutionId],
    queryFn: () => getInstitutionHealthStatus(institutionId),
    enabled: Boolean(institutionId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Health Dashboard</h2>
      <p className="text-gray-700">Monitor the operational status of your EduCreds integration and platform components. Status auto-refreshes every 30 seconds.</p>

      {isError && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">
          <p>Error fetching health status: {error.message}</p>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : healthStatus ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Overall Status: <span className="capitalize">{healthStatus.overall}</span></h3>
            <HealthIndicator status={healthStatus.overall} label="Overall Platform Health" />
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">System Components</h3>
              <div className="space-y-3">
                <HealthIndicator 
                  status={healthStatus.systemComponents.database.status} 
                  label="Database" 
                  message={healthStatus.systemComponents.database.message} 
                />
                <HealthIndicator 
                  status={healthStatus.systemComponents.trustAgent.status} 
                  label="Trust Agent" 
                  message={
                    healthStatus.systemComponents.trustAgent.status === 'healthy' 
                      ? `Model: ${healthStatus.systemComponents.trustAgent.poicModelVersion} (${healthStatus.systemComponents.trustAgent.poicModelHash?.substring(0, 8)}...)`
                      : healthStatus.systemComponents.trustAgent.message
                  } 
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Your Integration Health</h3>
              <div className="space-y-3">
                <HealthIndicator 
                  status={healthStatus.institutionSpecific.connector.status} 
                  label="Connector Status" 
                  message={
                    healthStatus.institutionSpecific.connector.status !== 'n/a'
                      ? `${healthStatus.institutionSpecific.connector.message}${healthStatus.institutionSpecific.connector.lastSyncedAt ? ` — Last sync: ${new Date(healthStatus.institutionSpecific.connector.lastSyncedAt).toLocaleString()}` : ''}${healthStatus.institutionSpecific.connector.latencyMs ? `, Latency: ${healthStatus.institutionSpecific.connector.latencyMs}ms` : ''}`
                      : healthStatus.institutionSpecific.connector.message
                  }
                />
                {healthStatus.institutionSpecific.connector.lastSyncError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    <strong>Last Sync Error:</strong> {healthStatus.institutionSpecific.connector.lastSyncError}
                  </div>
                )}
                <HealthIndicator 
                  status={healthStatus.institutionSpecific.webhook.status} 
                  label="Webhook Delivery" 
                  message={healthStatus.institutionSpecific.webhook.message} 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={() => refetch()} 
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      ) : (
        <p className="text-gray-600">No health status available.</p>
      )}
    </div>
  );
};

export const HealthDashboardPage: React.FC = () => {
  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <HealthDashboard />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

export default HealthDashboardPage;
