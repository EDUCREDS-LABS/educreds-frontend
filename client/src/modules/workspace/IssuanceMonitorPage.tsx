import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/modern/ErrorBoundary';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { api } from '@/lib/api';

interface IssuanceEvent {
  id: string;
  studentId: string;
  institutionId: string;
  status: 'pending' | 'minted' | 'failed' | string;
  timestamp: string;
}

const IssuanceMonitorDashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['issuance-monitor-events'],
    queryFn: async () => {
      const result = await api.getCertificates({ limit: 50, sortBy: 'createdAt', sortDir: 'desc' });
      const certs: any[] = result?.certificates ?? [];
      return certs.map((c): IssuanceEvent => ({
        id: c.id,
        studentId: c.studentId ?? c.recipientId ?? c.recipientEmail ?? 'N/A',
        institutionId: c.institutionId ?? '',
        status: c.issuanceStatus ?? c.status ?? 'pending',
        timestamp: c.createdAt ?? c.issuedAt ?? new Date().toISOString(),
      }));
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        <p>Error loading issuance events: {(error as Error).message}</p>
      </div>
    );
  }

  const events: IssuanceEvent[] = data ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Issuance Monitor</h2>
      <ErrorBoundary>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No issuance events found.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.studentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${event.status === 'minted' || event.status === 'issued' ? 'bg-green-100 text-green-800' : event.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export const IssuanceMonitorPage: React.FC = () => (
  <>
    <IssuanceMonitorDashboard />
  </>
);

export default IssuanceMonitorPage;
