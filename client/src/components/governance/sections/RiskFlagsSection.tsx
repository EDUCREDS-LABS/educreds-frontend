import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getSeverityColors, formatSeverity } from '@/lib/transparency-tokens';
import type { RiskFlagResponse } from '@/lib/governanceApiService';

interface RiskFlagsSectionProps {
  riskFlags: RiskFlagResponse[];
}

export function RiskFlagsSection({ riskFlags }: RiskFlagsSectionProps) {
  if (!riskFlags || riskFlags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
          <CardDescription>Identified risks and mitigation strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No significant risks identified for this proposal.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Group flags by severity for better visualization
  const groupedFlags = riskFlags.reduce(
    (acc, flag) => {
      const severity = formatSeverity(flag.severity);
      if (!acc[severity]) acc[severity] = [];
      acc[severity].push(flag);
      return acc;
    },
    {} as Record<string, RiskFlagResponse[]>
  );

  const severityOrder = ['critical', 'high', 'medium', 'low'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Risk Assessment
        </CardTitle>
        <CardDescription>
          {riskFlags.length} risk flag{riskFlags.length !== 1 ? 's' : ''} identified
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {severityOrder.map((severity) => {
          const flags = groupedFlags[severity as keyof typeof groupedFlags];
          if (!flags || flags.length === 0) return null;

          const colors = getSeverityColors(severity as 'critical' | 'high' | 'medium' | 'low');

          return (
            <div key={severity} className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <span className={`h-3 w-3 rounded-full ${colors.dot}`} />
                {severity} ({flags.length})
              </h4>
              <div className="space-y-2">
                {flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border-l-4 p-4 ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h5 className={`font-semibold ${colors.text}`}>{flag.flag}</h5>
                        <p className="mt-1 text-sm text-muted-foreground">{flag.description}</p>
                      </div>
                      <Badge variant="outline" className={colors.badge}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Badge>
                    </div>

                    {/* Evidence */}
                    {flag.evidence && (
                      <div className="mt-3 rounded-md bg-white/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Evidence:</p>
                        <p className="mt-1 text-xs text-muted-foreground">{flag.evidence}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
