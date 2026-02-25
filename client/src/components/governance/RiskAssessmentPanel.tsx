import { useRiskAssessment } from '@/hooks/useGovernance';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, ChevronDown, TrendingDown } from 'lucide-react';
import { getRiskLevelColors, formatNumber } from '@/lib/transparency-tokens';
import type { RiskAssessmentResponse } from '@/lib/governanceApiService';

interface RiskAssessmentPanelProps {
  proposalId: string;
}

export function RiskAssessmentPanel({ proposalId }: RiskAssessmentPanelProps) {
  const { data, isLoading, error } = useRiskAssessment(proposalId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load risk assessment data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No risk assessment data available for this proposal.</AlertDescription>
      </Alert>
    );
  }

  const colors = getRiskLevelColors(data.riskLevel);
  const borderColor = colors.border.replace('border-l-4 ', '');

  // Calculate risk score gauge gradient
  const riskScoreDegrees = (data.overallRiskScore / 100) * 360;
  const gaugeStyle = {
    background: `conic-gradient(${colors.hex} 0deg ${riskScoreDegrees}deg, #e5e7eb ${riskScoreDegrees}deg)`,
  };

  return (
    <div className="space-y-6">
      {/* Risk Score Summary */}
      <Card className={colors.border}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
          <CardDescription>
            Overall risk evaluation for {data.institutionName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Risk Score Gauge */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-32 w-32 items-center justify-center rounded-full"
                style={gaugeStyle}
              >
                <div className="flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-3xl font-bold">{data.overallRiskScore}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Risk Level</p>
                <Badge className={`${colors.badge} mt-1 text-base`}>
                  {data.riskLevel.toUpperCase()}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Recommended Action
                </p>
                <p className="mt-1 text-sm font-medium">{data.recommendedAction}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors by Category */}
      {data.riskFactors && data.riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Factors by Category</CardTitle>
            <CardDescription>
              {data.riskFactors.length} risk categor{data.riskFactors.length !== 1 ? 'ies' : 'y'} identified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.riskFactors.map((factor, categoryIdx) => (
              <Collapsible key={categoryIdx} defaultOpen={categoryIdx === 0}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-slate-50">
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold capitalize">
                      {factor.category.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {factor.risks.length} risk{factor.risks.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform" />
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-3 border-t p-4">
                  {factor.risks.map((risk, riskIdx) => {
                    const riskColors = getRiskLevelColors(
                      risk.severity as 'critical' | 'high' | 'medium' | 'low'
                    );

                    return (
                      <div
                        key={riskIdx}
                        className={`space-y-3 rounded-lg border-l-4 p-4 ${riskColors.bg} ${riskColors.border}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="flex-1 font-semibold">{risk.description}</h5>
                          <Badge variant="outline" className={riskColors.badge}>
                            {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                          </Badge>
                        </div>

                        {/* Mitigations */}
                        {risk.mitigations && risk.mitigations.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              Mitigations:
                            </p>
                            <ul className="mt-2 space-y-1">
                              {risk.mitigations.map((mitigation, mIdx) => (
                                <li key={mIdx} className="flex gap-2 text-sm">
                                  <span className="text-muted-foreground">•</span>
                                  <span>{mitigation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended Limits */}
                        {risk.recommendedLimits && (
                          <div className="space-y-2 rounded-md bg-white/50 p-3">
                            <p className="text-xs font-semibold text-muted-foreground">
                              Recommended Limits:
                            </p>
                            <div className="grid gap-2">
                              {risk.recommendedLimits.dailyIssuanceLimit !== undefined && (
                                <div className="text-xs">
                                  <span className="font-medium">Daily Issuance Limit:</span>
                                  <span className="ml-1 text-muted-foreground">
                                    {formatNumber(risk.recommendedLimits.dailyIssuanceLimit)}
                                  </span>
                                </div>
                              )}
                              {risk.recommendedLimits.monthlyIssuanceLimit !== undefined && (
                                <div className="text-xs">
                                  <span className="font-medium">Monthly Issuance Limit:</span>
                                  <span className="ml-1 text-muted-foreground">
                                    {formatNumber(risk.recommendedLimits.monthlyIssuanceLimit)}
                                  </span>
                                </div>
                              )}
                              {risk.recommendedLimits.approvalDuration && (
                                <div className="text-xs">
                                  <span className="font-medium">Approval Duration:</span>
                                  <span className="ml-1 text-muted-foreground">
                                    {risk.recommendedLimits.approvalDuration}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risk Summary Note */}
      <div className={`rounded-lg border-l-4 p-4 ${colors.bg}`}>
        <p className="text-sm font-medium">
          💡 This risk assessment is based on comprehensive analysis of institutional credibility,
          compliance history, and governance behavior. The recommended action should inform voting
          decisions but should not be the sole basis for governance votes.
        </p>
      </div>
    </div>
  );
}
