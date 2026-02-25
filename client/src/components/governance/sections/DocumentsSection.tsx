import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatTransparencyDate } from '@/lib/transparency-tokens';
import type { SubmittedDocumentResponse } from '@/lib/governanceApiService';

interface DocumentsSectionProps {
  documents: SubmittedDocumentResponse[];
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
          {documents.length} document{documents.length !== 1 ? 's' : ''} submitted and verified
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{doc.label}</span>
                    {doc.verified && (
                      <Badge variant="outline" className="gap-1 bg-green-50">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {docTypeLabels[doc.type] || doc.type}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {doc.ipfsHash.slice(0, 12)}...{doc.ipfsHash.slice(-8)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Uploaded: {formatTransparencyDate(doc.uploadedAt)}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-2 sm:mt-0 sm:ml-4 whitespace-nowrap"
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    View on IPFS
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* IPFS Info Note */}
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-900">
            💡 <span className="font-semibold">IPFS Integrity:</span> All documents are stored on the
            InterPlanetary File System (IPFS) for immutable, decentralized access. Links may take a
            few moments to load depending on gateway availability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
