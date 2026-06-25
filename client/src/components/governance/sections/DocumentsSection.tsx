import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileText, ExternalLink, CheckCircle2, AlertCircle, Clock, Eye, Shield, Search } from 'lucide-react';
import { formatTransparencyDate } from '@/lib/transparency-tokens';
import { cn } from '@/lib/utils';
import type { SubmittedDocumentResponse } from '@/lib/governanceApiService';

interface DocumentsSectionProps {
  documents: SubmittedDocumentResponse[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  verified:               { label: 'Verified',            color: 'bg-green-50 text-green-700 border-green-200' },
  partially_verified:     { label: 'Partial',             color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  pending_manual_review:  { label: 'Manual Review',       color: 'bg-orange-50 text-orange-700 border-orange-200' },
  invalid:                { label: 'Invalid',             color: 'bg-red-50 text-red-700 border-red-200' },
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? 'bg-green-500' :
    value >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <Progress value={value} className="h-1.5" indicatorClassName={color} />
    </div>
  );
}

export function DocumentsSection({ documents }: DocumentsSectionProps) {
  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Accreditation Documents
          </CardTitle>
          <CardDescription>Evidence submitted for assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No documents submitted for this proposal.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const docTypeLabels: Record<string, string> = {
    accreditation: 'Accreditation',
    audit_report: 'Audit Report',
    financial: 'Financial Statement',
    other: 'Other Document',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Accreditation Documents
        </CardTitle>
        <CardDescription>
          {documents.length} document{documents.length !== 1 ? 's' : ''} submitted
          {documents.filter(d => d.verified).length > 0 &&
            ` • ${documents.filter(d => d.verified).length} OCR-verified`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.map((doc, index) => {
          const vr = doc.verificationResult;
          const statusCfg = vr ? STATUS_CONFIG[vr.status] ?? STATUS_CONFIG.pending_manual_review : null;

          return (
            <div
              key={index}
              className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
            >
              {/* Document header */}
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between bg-slate-50 dark:bg-neutral-900">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-sm">{doc.label}</span>

                    {/* OCR status badge */}
                    {doc.verified && statusCfg && (
                      <Badge variant="outline" className={cn('gap-1 text-[10px] font-bold uppercase', statusCfg.color)}>
                        <CheckCircle2 className="h-3 w-3" />
                        {statusCfg.label}
                      </Badge>
                    )}
                    {doc.verificationPending && (
                      <Badge variant="outline" className="gap-1 text-[10px] font-bold uppercase bg-neutral-50 text-neutral-500 border-neutral-200">
                        <Clock className="h-3 w-3" />
                        OCR Pending
                      </Badge>
                    )}
                    {!doc.verified && !doc.verificationPending && (
                      <Badge variant="outline" className="gap-1 text-[10px] font-bold uppercase bg-slate-50 text-slate-500">
                        Unverified
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {docTypeLabels[doc.type] || doc.type}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {doc.ipfsHash.slice(0, 10)}…{doc.ipfsHash.slice(-6)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Uploaded: {formatTransparencyDate(doc.uploadedAt)}
                  </p>
                </div>

                <Button asChild variant="outline" size="sm" className="mt-2 sm:mt-0 sm:ml-4 whitespace-nowrap">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    View on IPFS
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>

              {/* OCR verification results panel */}
              {vr && (
                <div className="p-4 space-y-4 border-t border-slate-200 dark:border-neutral-800">
                  {/* Score overview */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Overall', value: vr.authenticityScore.overall, icon: Shield },
                      { label: 'OCR Confidence', value: Math.round(vr.authenticityScore.ocr), icon: Search },
                      { label: 'Security', value: vr.authenticityScore.security, icon: Shield },
                      { label: 'Metadata', value: vr.authenticityScore.metadata, icon: Eye },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">{label}</p>
                        <p className={cn('text-xl font-black',
                          value >= 80 ? 'text-green-600' :
                          value >= 60 ? 'text-yellow-600' : 'text-red-600'
                        )}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Score bars */}
                  <div className="space-y-2">
                    <ScoreBar label="OCR Quality" value={vr.authenticityScore.ocr} />
                    <ScoreBar label="Template Match" value={vr.authenticityScore.template} />
                    <ScoreBar label="Security Features" value={vr.authenticityScore.security} />
                  </div>

                  {/* Extracted fields */}
                  {Object.keys(vr.extractedFields).length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Extracted Fields</p>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {Object.entries(vr.extractedFields).map(([key, value]) => (
                          <div key={key} className="flex gap-2 text-xs bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                            <span className="text-neutral-400 capitalize min-w-[80px] font-semibold">{key.replace(/_/g, ' ')}</span>
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Security features */}
                  {vr.securityFeatures.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Security Features</p>
                      <div className="flex flex-wrap gap-2">
                        {vr.securityFeatures.map((f, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className={cn(
                              'text-[10px] gap-1',
                              f.detected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-50 text-neutral-400 border-neutral-200'
                            )}
                          >
                            {f.detected ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {f.feature.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OCR summary */}
                  {vr.ocrSummary && (
                    <p className="text-[10px] text-muted-foreground">
                      OCR: {vr.ocrSummary.hasText ? `${vr.ocrSummary.wordCount} words detected` : 'No text detected'}
                      {' · '}confidence {Math.round(vr.ocrSummary.confidence * 100)}%
                      {' · '}processed in {vr.processingTimeMs}ms
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* IPFS Info Note */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-900">
            💡 <span className="font-semibold">IPFS Integrity:</span> All documents are stored on the
            InterPlanetary File System (IPFS) for immutable, decentralized access. OCR results are
            computed by the EduCreds Trust Agent upon proposal submission.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
