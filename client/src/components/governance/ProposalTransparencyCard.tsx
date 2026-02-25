import { useMemo } from 'react';
import { useAssessmentTransparency } from '@/hooks/useGovernance';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileText, Shield, BarChart3, Clock } from 'lucide-react';
import {
  formatTransparencyDate,
  formatPercentage,
  SEVERITY_COLORS,
} from '@/lib/transparency-tokens';
import { PoICScoreSection } from './sections/PoICScoreSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { RiskFlagsSection } from './sections/RiskFlagsSection';
import { AuditTrailSection } from './sections/AuditTrailSection';
import { VotingContextSection } from './sections/VotingContextSection';

interface ProposalTransparencyCardProps {
  proposalId: string;
}

export function ProposalTransparencyCard({
  proposalId,
}: ProposalTransparencyCardProps) {
  const { data, isLoading, error } = useAssessmentTransparency(proposalId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load proposal transparency data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No transparency data available for this proposal.</AlertDescription>
      </Alert>
    );
  }

  const aiAnalysis = data.aiAnalysis;

  return (
    <div className="space-y-6">
      {/* Header with Institution Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{data.institution.name}</CardTitle>
              <CardDescription className="mt-1">
                {data.institution.type}
                {data.institution.country && ` • ${data.institution.country}`}
              </CardDescription>
              {data.institution.domain && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {data.institution.domain}
                </p>
              )}
            </div>
            <Badge
              variant="secondary"
              className="ml-4 whitespace-nowrap text-xs"
            >
              {data.institution.walletAddress.slice(0, 8)}...
              {data.institution.walletAddress.slice(-6)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* AI Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assessment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                LEGITIMACY SCORE
              </p>
              <p className="mt-1 text-2xl font-bold">
                {aiAnalysis.legitimacyScore}/100
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                CONFIDENCE
              </p>
              <Badge variant="outline" className="mt-1">
                {aiAnalysis.confidence.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                RECOMMENDATION
              </p>
              <Badge
                variant={
                  aiAnalysis.recommendedAction === 'approve'
                    ? 'default'
                    : aiAnalysis.recommendedAction === 'approve_with_limits'
                    ? 'secondary'
                    : 'destructive'
                }
                className="mt-1"
              >
                {aiAnalysis.recommendedAction.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Analysis Summary Text */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold">Analysis Summary</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {aiAnalysis.summary}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Evidence Review</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {aiAnalysis.evidenceReview}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transparency Data in Tabs */}
      <Tabs defaultValue="poic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="poic" className="text-xs sm:text-sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">PoIC Score</span>
            <span className="sm:hidden">Score</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="risks" className="text-xs sm:text-sm">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Risks</span>
            <span className="sm:hidden">Risks</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">
            <Clock className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
            <span className="sm:hidden">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="voting" className="text-xs sm:text-sm">
            <Shield className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Voting</span>
            <span className="sm:hidden">Vote</span>
          </TabsTrigger>
        </TabsList>

        {/* PoIC Score Tab */}
        <TabsContent value="poic" className="space-y-4">
          <PoICScoreSection poicScore={data.poicScore} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <DocumentsSection documents={data.institution.submittedDocuments} />
        </TabsContent>

        {/* Risk Flags Tab */}
        <TabsContent value="risks" className="space-y-4">
          <RiskFlagsSection riskFlags={aiAnalysis.riskFlags} />
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <AuditTrailSection auditTrail={data.auditTrail} />
        </TabsContent>

        {/* Voting Context Tab */}
        <TabsContent value="voting" className="space-y-4">
          <VotingContextSection votingContext={data.votingContext} />
        </TabsContent>
      </Tabs>

      {/* Data Quality Notice */}
      <div className="text-xs text-muted-foreground border-t pt-4">
        <p>
          ℹ️ This assessment was last updated on{' '}
          {formatTransparencyDate(data.poicScore.calculatedAt)}. All data
          provided is for governance decision-making support only.
        </p>
      </div>
    </div>
  );
}
