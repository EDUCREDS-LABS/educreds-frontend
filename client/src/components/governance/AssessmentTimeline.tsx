import { useAssessmentHistory } from '@/hooks/useGovernance';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Clock } from 'lucide-react';
import { formatTransparencyDate } from '@/lib/transparency-tokens';
import type { AssessmentHistoryEventResponse } from '@/lib/governanceApiService';

interface AssessmentTimelineProps {
  proposalId: string;
}

export function AssessmentTimeline({ proposalId }: AssessmentTimelineProps) {
  const { data, isLoading, error } = useAssessmentHistory(proposalId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load assessment history. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || !data.assessmentTimeline || data.assessmentTimeline.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No assessment history available for this proposal.</AlertDescription>
      </Alert>
    );
  }

  const getEventColor = (event: string): { bg: string; dot: string; icon: string } => {
    switch (event.toLowerCase()) {
      case 'created':
        return { bg: 'bg-blue-50', dot: 'bg-blue-600', icon: '📝' };
      case 'analyzed':
        return { bg: 'bg-cyan-50', dot: 'bg-cyan-600', icon: '🔍' };
      case 'scored':
        return { bg: 'bg-purple-50', dot: 'bg-purple-600', icon: '⭐' };
      case 'flagged':
        return { bg: 'bg-amber-50', dot: 'bg-amber-600', icon: '🚩' };
      case 'revised':
        return { bg: 'bg-green-50', dot: 'bg-green-600', icon: '✏️' };
      default:
        return { bg: 'bg-slate-50', dot: 'bg-slate-600', icon: '•' };
    }
  };

  const eventLabels: Record<string, string> = {
    created: 'Assessment Created',
    analyzed: 'Analysis Completed',
    scored: 'Score Calculated',
    flagged: 'Risk Flagged',
    revised: 'Assessment Revised',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          How Was This Assessment Made?
        </CardTitle>
        <CardDescription>
          Timeline of assessment events and modifications ({data.assessmentTimeline.length} events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline vertical line */}
          <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200" />

          {data.assessmentTimeline.map((item: AssessmentHistoryEventResponse, idx: number) => {
            const colors = getEventColor(item.event);
            const eventLabel = eventLabels[item.event] || item.event;

            return (
              <div key={idx} className="relative pl-12">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full ${colors.bg}`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${colors.dot} text-white`}
                  >
                    <span className="text-xs">{colors.icon}</span>
                  </div>
                </div>

                {/* Event card */}
                <div className={`space-y-2 rounded-lg border p-4 ${colors.bg}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{eventLabel}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatTransparencyDate(item.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {item.event.charAt(0).toUpperCase() + item.event.slice(1)}
                    </Badge>
                  </div>

                  {/* Change details */}
                  {item.changes && (
                    <div className="space-y-2 rounded-md bg-white/50 p-3">
                      {/* Reason for change */}
                      {item.changes.reason && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Reason:</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.changes.reason}
                          </p>
                        </div>
                      )}

                      {/* Previous value */}
                      {item.changes.previousValue !== undefined && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Previous Value:
                          </p>
                          <pre className="mt-1 overflow-auto rounded bg-slate-100 p-2 text-xs">
                            {typeof item.changes.previousValue === 'string'
                              ? item.changes.previousValue
                              : JSON.stringify(item.changes.previousValue, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* New value */}
                      {item.changes.newValue !== undefined && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            New Value:
                          </p>
                          <pre className="mt-1 overflow-auto rounded bg-slate-100 p-2 text-xs">
                            {typeof item.changes.newValue === 'string'
                              ? item.changes.newValue
                              : JSON.stringify(item.changes.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Note */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-900">
            ℹ️ This timeline shows all major events in the assessment lifecycle. Each event represents
            a key decision point or data update that contributed to the final assessment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
