import React, { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from '@/components/modern/ErrorBoundary';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const IntelligenceDashboard: React.FC = () => {
  const { user } = useAuth();
  const institutionId = (user as any)?.sub || (user as any)?.id;

  const [poic, setPoic] = useState<any>(null);
  const [poicLoading, setPoicLoading] = useState(true);
  const [poicError, setPoicError] = useState<string | null>(null);
  const [assistantOnline, setAssistantOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPoicLoading(true);
    setPoicError(null);
    const load = async () => {
      try {
        const data = institutionId ? await api.getPoICScore(institutionId) : null;
        if (!cancelled) setPoic(data);
      } catch (err: any) {
        if (!cancelled) setPoicError(err?.message || 'Unable to load trust score');
      } finally {
        if (!cancelled) setPoicLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [institutionId]);

  useEffect(() => {
    let cancelled = false;
    api.trustAgentHealth().then(() => !cancelled && setAssistantOnline(true)).catch(() => !cancelled && setAssistantOnline(false));
    return () => { cancelled = true; };
  }, []);

  const score = poic?.score ?? poic?.poicScore ?? poic?.trustScore;
  const level = poic?.level ?? poic?.trustLevel;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">AI Intelligence Dashboard</h2>
        <p className="text-sm text-neutral-500 mt-1">Live trust signals from the PoIC engine and the governance assistant. AI explains — it never decides validity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ErrorBoundary>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">PoIC Trust Score</CardTitle>
            </CardHeader>
            <CardContent>
              {poicLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : poicError ? (
                <p className="text-sm text-red-600 dark:text-red-400">{poicError}</p>
              ) : score != null ? (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-neutral-900 dark:text-neutral-100">{score}</span>
                    {level && <Badge variant="outline">{level}</Badge>}
                  </div>
                  <p className="text-sm text-neutral-500">Real-time institution trust scoring from the PoIC engine.</p>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No trust score available yet. Complete institution verification to compute a PoIC score.</p>
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Governance Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              {assistantOnline === false ? (
                <div className="space-y-2">
                  <Badge variant="secondary">Offline</Badge>
                  <p className="text-sm text-neutral-500">The governance assistant (trust-agent) is currently unreachable. This is a backend dependency — no recommendations are fabricated.</p>
                </div>
              ) : assistantOnline === true ? (
                <p className="text-sm text-neutral-500">AI-driven recommendations for governance and proposal drafting are available. Open the assistant from any page to ask questions.</p>
              ) : (
                <Skeleton className="h-20 w-full" />
              )}
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export const IntelligencePage: React.FC = () => (
  <>
    <IntelligenceDashboard />
  </>
);

export default IntelligencePage;
