import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Search, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { API_CONFIG } from '@/config/api';

interface VerificationResult {
  isValid: boolean;
  certificate?: {
    id: string;
    data: Record<string, string>;
    issuedAt: string;
    certificateHash: string;
    ipfsHash?: string;
  };
  template?: {
    metadata: {
      name: string;
      category: string;
    };
  };
}

export function CertificateVerification() {
  const [certificateId, setCertificateId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: verificationResult, refetch, isLoading } = useQuery<VerificationResult>({
    queryKey: ['verify', certificateId],
    queryFn: async () => {
      if (!certificateId) return null;
      
      const response = await fetch(`${API_CONFIG.CERT}/api/certificates/verify/${encodeURIComponent(certificateId)}`);
      if (!response.ok) {
        if (response.status === 404) {
          return { isValid: false };
        }
        throw new Error('Failed to verify certificate');
      }
      
      const data = await response.json();
      const cert = data?.certificate;
      if (!data || !cert) {
        return { isValid: false };
      }

      const derivedData: Record<string, string> = {
        studentName: cert.studentName || '',
        institutionName: cert.institutionName || '',
        courseName: cert.courseName || '',
        grade: cert.grade || '',
        completionDate: cert.completionDate || '',
        certificateType: cert.certificateType || '',
      };

      return {
        isValid: Boolean(data.valid),
        certificate: {
          id: cert.id,
          data: derivedData,
          issuedAt: cert.issuedAt,
          certificateHash: cert.ipfsHash,
          ipfsHash: cert.ipfsHash,
        },
        template: {
          metadata: {
            name: cert.certificateType || 'Certificate',
            category: 'certificate',
          },
        },
      };
    },
    enabled: false, // Don't run automatically
  });

  const handleVerify = async () => {
    if (!certificateId.trim()) {
      toast.error('Please enter a certificate ID');
      return;
    }
    
    setIsVerifying(true);
    try {
      await refetch();
    } catch (error) {
      toast.error('Failed to verify certificate');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = async () => {
    if (!verificationResult?.certificate) return;
    
    try {
      const ipfsHash = (verificationResult.certificate as any).ipfsHash || verificationResult.certificate.certificateHash;
      if (!ipfsHash) {
        throw new Error('No IPFS hash available for this certificate');
      }
      const url = `https://ipfs.io/ipfs/${ipfsHash}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Certificate Verification</h1>
        <p className="text-gray-600 mt-2">
          Verify the authenticity of any EduCreds certificate using its unique ID
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify Certificate</CardTitle>
          <CardDescription>
            Enter the certificate ID to verify its authenticity and view details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="certificateId">Certificate ID</Label>
              <Input
                id="certificateId"
                placeholder="Enter certificate ID (e.g., CERT-1234567890-abc123)"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <Button 
              onClick={handleVerify}
              disabled={isVerifying || isLoading}
              className="mt-6"
            >
              {isVerifying || isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>

      {verificationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {verificationResult.isValid ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <CardTitle>
                {verificationResult.isValid ? 'Valid Certificate' : 'Invalid Certificate'}
              </CardTitle>
            </div>
            <CardDescription>
              {verificationResult.isValid 
                ? 'This certificate has been verified and is authentic'
                : 'This certificate could not be found or is invalid'
              }
            </CardDescription>
          </CardHeader>
          
          {verificationResult.isValid && verificationResult.certificate && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Certificate Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Template:</span>
                      <span className="font-medium">{verificationResult.template?.metadata.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <Badge variant="outline" className="capitalize">
                        {verificationResult.template?.metadata.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued:</span>
                      <span className="font-medium">
                        {formatDate(verificationResult.certificate.issuedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certificate ID:</span>
                      <span className="font-mono text-sm">{verificationResult.certificate.id}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Certificate Data</h3>
                  <div className="space-y-2">
                    {Object.entries(verificationResult.certificate.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-medium text-right max-w-[200px] truncate">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href={`https://ipfs.io/ipfs/${(verificationResult.certificate as any).ipfsHash || verificationResult.certificate.certificateHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Certificate
                  </a>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
