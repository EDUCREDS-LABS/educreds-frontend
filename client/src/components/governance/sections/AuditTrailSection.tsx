import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle2, XCircle, AlertCircle as AlertIcon } from 'lucide-react';
import { formatTransparencyDate, getStatusColors } from '@/lib/transparency-tokens';
import type { AuditTrailEventResponse } from '@/lib/governanceApiService';

interface AuditTrailSectionProps {
  auditTrail: AuditTrailEventResponse[];
}

export function AuditTrailSection({ auditTrail }: AuditTrailSectionProps) {
  if (!auditTrail || auditTrail.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Assessment Timeline
          </CardTitle>
          <CardDescription>Historical record of assessment events</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertIcon className="h-4 w-4" />
            <AlertDescription>No audit trail events available for this proposal.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Assessment Timeline
        </CardTitle>
        <CardDescription>
          {auditTrail.length} event{auditTrail.length !== 1 ? 's' : ''} recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline vertical line */}
          <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200" />

          {auditTrail.map((event, idx) => {
            const colors = getStatusColors(event.status as 'success' | 'failed' | 'pending');
            const isLast = idx === auditTrail.length - 1;

            return (
              <div key={idx} className="relative pl-12">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-white">
                  {getStatusIcon(event.status)}
                </div>

                {/* Event card */}
                <div className={`space-y-2 rounded-lg border p-4 ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold">{event.action}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatTransparencyDate(event.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Actor information */}
                  {event.actor && (
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground">By:</span> {event.actor}
                    </p>
                  )}

                  {/* Event details */}
                  {event.details && Object.keys(event.details).length > 0 && (
                    <div className="rounded-md bg-white/50 p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Details:</p>
                      <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
