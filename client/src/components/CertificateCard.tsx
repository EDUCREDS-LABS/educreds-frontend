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
  Building
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
    tokenId?: number;
    ipfsHash: string;
  };
  showActions?: boolean;
}

export function CertificateCard({ certificate, showActions = true }: CertificateCardProps) {
  const [showSharing, setShowSharing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            <CardTitle className="text-lg">{certificate.courseName}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4" />
              {certificate.institutionName}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={certificate.isMinted ? 'default' : 'secondary'}>
              {certificate.isMinted ? 'Minted' : 'Issued'}
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
            <span><strong>Grade:</strong> {certificate.grade}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            <span><strong>Issued:</strong> {formatDate(certificate.issuedAt)}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
          <div><strong>Certificate ID:</strong> {certificate.id}</div>
          <div><strong>IPFS Hash:</strong> {certificate.ipfsHash}</div>
          {certificate.tokenId && (
            <div><strong>Token ID:</strong> #{certificate.tokenId}</div>
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
              onClick={() => window.open(`https://verify.educreds.xyz/credential/${certificate.id}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}