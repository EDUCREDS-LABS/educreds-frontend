import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Download, 
  QrCode, 
  ExternalLink, 
  Calendar,
  Award,
  Building,
  Copy,
  Check
} from 'lucide-react';
import { CertificateShare } from './CertificateShare';

interface CertificateCardProps {
  certificate: {
    id: string;
    studentName: string;
    courseName: string;
    grade: string;
    institutionName: string;
    issuedAt: string;
    certificateType: string;
    isMinted: boolean;
    issuanceStatus?: string;
    tokenId?: number;
    ipfsHash: string;
  };
  showActions?: boolean;
}

export function CertificateCard({ certificate, showActions = true }: CertificateCardProps) {
  const [showSharing, setShowSharing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = async (text: string, field: string) => {
    const value = String(text ?? '').trim();
    if (!value) return;

    const fallbackCopy = (content: string) => {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const success = fallbackCopy(value);
        if (!success) throw new Error('Clipboard API unavailable');
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      const success = fallbackCopy(value);
      if (success) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        console.error('Failed to copy text to clipboard:', error);
      }
    }
  };

  if (showSharing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Share Certificate</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSharing(false)}
            >
              Back to Certificate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CertificateShare certificateId={certificate.id} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{certificate.courseName || 'Unknown Course'}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              {certificate.institutionName}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={certificate.isMinted ? 'default' : 'secondary'}>
              {certificate.issuanceStatus === 'revoked'
                ? 'Revoked'
                : certificate.isMinted
                  ? 'Minted'
                  : 'Pending Mint'}
            </Badge>
            <Badge variant="outline">
              {certificate.certificateType}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-500" />
            <span><strong>Grade:</strong> {certificate.grade || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <span><strong>Issued:</strong> {formatDate(certificate.issuedAt)}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <strong>Certificate ID:</strong>
              <div className="font-mono text-xs mt-1 break-all">{certificate.id}</div>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => copyToClipboard(certificate.id, 'certificateId')}
              className="ml-2 h-6 w-6 p-0"
              title="Copy Certificate ID"
            >
              {copiedField === 'certificateId' ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <strong>IPFS Hash:</strong>
              <div className="font-mono text-xs mt-1 break-all">{certificate.ipfsHash}</div>
            </div>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => copyToClipboard(certificate.ipfsHash, 'ipfsHash')}
              className="ml-2 h-6 w-6 p-0"
              title="Copy IPFS Hash"
            >
              {copiedField === 'ipfsHash' ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          {certificate.tokenId && (
            <div className="flex items-center justify-between">
              <div>
                <strong>Token ID:</strong>
                <div className="font-mono text-xs mt-1">#{certificate.tokenId}</div>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard(certificate.tokenId.toString(), 'tokenId')}
                className="ml-2 h-6 w-6 p-0"
                title="Copy Token ID"
              >
                {copiedField === 'tokenId' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => setShowSharing(true)}
              className="flex items-center gap-2 flex-1"
            >
              <Share2 className="h-4 w-4" />
              Share Certificate
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://educreds.xyz/verification-portal?certificateId=${certificate.id}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
