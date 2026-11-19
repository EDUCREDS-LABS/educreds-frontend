import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/modern/ErrorBoundary';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { getInstitutionProfile, InstitutionProfile } from '@/services/profile';
import { listApiKeys, ApiKey } from '@/api/api-keys';
import { getInstitutionHealthStatus, InstitutionHealthStatus } from '@/services/health-status';
import { useAuth } from '@/hooks/useAuth';

type Status = 'configured' | 'not configured' | 'healthy' | 'unhealthy' | 'degraded' | 'unknown' | 'n/a';

const StatusChip: React.FC<{ status: Status }> = ({ status }) => {
  let colorClass = '';
  switch (status) {
    case 'configured':
    case 'healthy':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'degraded':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'not configured':
    case 'unhealthy':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'unknown':
    default:
      colorClass = 'bg-gray-100 text-gray-800';
      break;
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {status}
    </span>
  );
};

async function fetchPoICScores() {
  try {
    const res = await fetch('/api/governance/public/analytics/poic-scores?limit=1');
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ── Main component ────────────────────────────────────────────────────────────

const EnterpriseOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const institutionId = user?.id ?? '';

  // Workspace tier guard — enterprise-overview APIs don't apply for workspace tier
  if (user?.deploymentTier === 'workspace') {
    return (
      <div className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold text-gray-900">Enterprise Overview</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Workspace Tier</h3>
          <p className="text-blue-700 mb-4">
            Enterprise governance overview is available on <strong>Enterprise Connector</strong> and <strong>Cloud Connector</strong> tiers.
          </p>
          <p className="text-sm text-blue-600">
            Your institution is on the <strong>Workspace</strong> tier — you have full credential issuance, student management, and analytics available from the main dashboard.
          </p>
          <button
            onClick={() => navigate('/institution/dashboard')}
            className="mt-4 text-sm text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-medium"
          >
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  const results = useQueries({
    queries: [
      {
        queryKey: ['institutionProfile', institutionId],
        queryFn: () => getInstitutionProfile(institutionId),
        enabled: !!institutionId,
      },
      {
        queryKey: ['apiKeys', institutionId],
        queryFn: () => listApiKeys(),
        enabled: !!institutionId,
      },
      {
        queryKey: ['healthStatus', institutionId],
        queryFn: () => getInstitutionHealthStatus(institutionId),
        enabled: !!institutionId,
      },
      {
        queryKey: ['poicScores'],
        queryFn: fetchPoICScores,
        staleTime: 120_000,
      },
    ],
  });

  const isLoading = results.slice(0, 3).some((query) => query.isLoading);
  const error = results.find((query) => query.isError)?.error as Error | null;

  const profileResult = results[0] as { data?: InstitutionProfile };
  const apiKeysResult = results[1] as { data?: ApiKey[] };
  const healthStatusResult = results[2] as { data?: InstitutionHealthStatus };
  const poicScoresResult = results[3] as { data?: any };

  const profile = profileResult.data;
  const apiKeysStatus: Status = apiKeysResult.data && apiKeysResult.data.length > 0 ? 'configured' : 'not configured';
  const healthOverallStatus: Status = healthStatusResult.data?.overall || 'unknown';

  const poicData = poicScoresResult.data;

  // Derive a PoIC score from governance data if profile doesn't have one
  const poicScore = profile?.poicScore
    ?? (Array.isArray(poicData) && poicData.length > 0 ? poicData[0]?.score : null)
    ?? poicData?.score
    ?? null;

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
        <p>No institution profile found. Please ensure you are logged in.</p>
      </div>
    );
  }

  // Tier guard: 'enterprise' is a stale/invalid tier — redirect to enterprise-connector equivalent
  const tier = profile.deploymentTier as string;
  if (tier === 'enterprise') {
    navigate('/compliance/trust-score');
    return null;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Enterprise Overview for {profile.name}</h2>
      <p className="text-gray-700">A quick summary of your EduCreds Enterprise configuration and operational status.</p>

      {/* Deployment Tier */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold mb-3">Deployment Tier</h3>
        <p className="text-lg text-gray-800 capitalize"><strong>{profile.deploymentTier}</strong></p>
        <p className="text-sm text-gray-600 mt-2">
          {profile.deploymentTier === 'workspace'
            ? 'Your institution uses the EduCreds Workspace for full credential issuance and management.'
            : profile.deploymentTier === 'cloud-connector'
            ? 'Your institution integrates via Cloud Connector API. EduCreds reads from your existing SIS.'
            : 'Your institution integrates via Enterprise Connector (mTLS/VPN). Data stays on-premise.'}
        </p>
      </div>

      {/* Core config cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PoIC Score */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-3">PoIC Score</h3>
          <p className="text-lg text-gray-800"><strong>{poicScore ?? 'N/A'}</strong> / 1000</p>
          <StatusChip status={poicScore && poicScore >= 700 ? 'healthy' : poicScore != null ? 'unhealthy' : 'unknown'} />
          <p className="text-sm text-gray-600 mt-2">Proof-of-Institutional-Credibility score, reflecting your institution's trustworthiness.</p>
          <p className="text-xs text-gray-500 mt-1">A score of 700+ qualifies your institution to receive its IIN.</p>
          <button onClick={() => navigate('/compliance/trust-score')} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
            Submit for Verification &rarr;
          </button>
        </div>

        {/* IIN Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-3">Institution Identity (IIN)</h3>
          {profile.iinTokenId ? (
            <>
              <StatusChip status="healthy" />
              <p className="text-sm text-gray-600 mt-2">
                Your institution holds a verified IIN — your on-chain identity token required for credential issuance.
              </p>
              <p className="text-xs font-mono text-gray-400 mt-1">Token #{profile.iinTokenId}</p>
            </>
          ) : (
            <>
              <StatusChip status={profile.poicScore != null ? 'degraded' : 'not configured'} />
              <p className="text-sm text-gray-600 mt-2">
                {profile.poicScore != null
                  ? 'Your PoIC verification is in progress. Your IIN will be issued once the review is complete.'
                  : 'Your institution has not yet completed PoIC verification. Submit your documents to receive your IIN and begin issuing credentials.'}
              </p>
              <button onClick={() => navigate('/compliance/trust-score')} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
                {profile.poicScore != null ? 'View Verification Status →' : 'Start Verification →'}
              </button>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-3">API Keys</h3>
          <StatusChip status={apiKeysStatus} />
          <p className="text-sm text-gray-600 mt-2">Manage programmatic access to EduCreds for your connectors.</p>
          <button onClick={() => navigate('/connect/api-keys')} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">Configure API Keys &rarr;</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-3">Integration Health</h3>
          <StatusChip status={healthOverallStatus} />
          <p className="text-sm text-gray-600 mt-2">Real-time status of your connectors and core platform components.</p>
          <button onClick={() => navigate('/connect/health-dashboard')} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">View Health Dashboard &rarr;</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-3">Data Mapping</h3>
          <StatusChip status={'configured'} />
          <p className="text-sm text-gray-600 mt-2">Define how your source data fields map to EduCreds credential schema.</p>
          <button onClick={() => navigate('/connect/data-mapping')} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">Configure Data Mappings &rarr;</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-3">Governance</h3>
          <StatusChip status="configured" />
          <p className="text-sm text-gray-600 mt-2">Participate in EduCreds network governance — vote on proposals and submit improvement ideas.</p>
          <button onClick={() => navigate('/institution/governance-workspace')} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">Open Governance Workspace &rarr;</button>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg flex flex-wrap gap-3">
        <p className="text-sm font-semibold text-blue-800 w-full mb-1">Quick Actions</p>
        <button
          onClick={() => navigate('/compliance/trust-score')}
          className="text-sm text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-medium"
        >
          Submit for Verification
        </button>
        <button
          onClick={() => navigate('/institution/issue')}
          className="text-sm text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-medium"
        >
          Issue Credentials →
        </button>
        <button
          onClick={() => navigate('/compliance/notification-settings')}
          className="text-sm text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 font-medium"
        >
          Notification Settings
        </button>
      </div>
    </div>
  );
};

export const EnterpriseOverviewPage: React.FC = () => {
  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <EnterpriseOverview />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

export default EnterpriseOverviewPage;
