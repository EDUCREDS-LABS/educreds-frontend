import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Upload, Search } from 'lucide-react';

export function CertificateVerification() {
  const [verificationMethod, setVerificationMethod] = useState<'w3c' | 'legacy'>('w3c');
  const [w3cCredential, setW3cCredential] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const verifyW3CCredential = async () => {
    setLoading(true);
    try {
      const credential = JSON.parse(w3cCredential);
      const tokenIdNum = tokenId ? parseInt(tokenId) : undefined;
      
      const result = await api.verifyHybridCredential({
        w3cCredential: credential,
        tokenId: tokenIdNum
      });
      
      setResult(result);
    } catch (error) {
      setResult({ 
        valid: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyLegacyCredential = async () => {
    setLoading(true);
    try {
      let result;
      
      if (ipfsHash) {
        result = await api.verifyCertificateByIPFS(ipfsHash);
      } else if (tokenId) {
        result = await api.verifyCertificateByToken(parseInt(tokenId));
      } else if (certificateId) {
        result = await api.verifyCertificate(certificateId);
      } else {
        throw new Error('Please provide at least one verification method');
      }
      
      setResult(result);
    } catch (error) {
      setResult({ 
        valid: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setW3cCredential(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Verify Certificate</h2>
        <p className="text-gray-600">Verify the authenticity of educational credentials</p>
      </div>

      {/* Method Selection */}
      <div className="flex gap-4 justify-center">
        <Button
          variant={verificationMethod === 'w3c' ? 'default' : 'outline'}
          onClick={() => setVerificationMethod('w3c')}
        >
          W3C Verifiable Credential
        </Button>
        <Button
          variant={verificationMethod === 'legacy' ? 'default' : 'outline'}
          onClick={() => setVerificationMethod('legacy')}
        >
          Traditional Methods
        </Button>
      </div>

      {/* W3C Verification */}
      {verificationMethod === 'w3c' && (
        <Card>
          <CardHeader>
            <CardTitle>W3C Verifiable Credential Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Upload or Paste W3C Credential JSON
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder="Or paste W3C Verifiable Credential JSON here..."
                value={w3cCredential}
                onChange={(e) => setW3cCredential(e.target.value)}
                rows={8}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Token ID (Optional - for blockchain cross-verification)
              </label>
              <Input
                placeholder="e.g., 12345"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={verifyW3CCredential}
              disabled={!w3cCredential || loading}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Verifying...' : 'Verify W3C Credential'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Legacy Verification */}
      {verificationMethod === 'legacy' && (
        <Card>
          <CardHeader>
            <CardTitle>Traditional Verification Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Certificate ID</label>
              <Input
                placeholder="e.g., CERT-2024-001"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">IPFS Hash</label>
              <Input
                placeholder="e.g., QmX7Y8Z9..."
                value={ipfsHash}
                onChange={(e) => setIpfsHash(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Token ID</label>
              <Input
                placeholder="e.g., 12345"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={verifyLegacyCredential}
              disabled={(!certificateId && !ipfsHash && !tokenId) || loading}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Verifying...' : 'Verify Certificate'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Verification Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.valid ? (
              <div className="space-y-4">
                <Badge variant="default" className="bg-green-500">
                  ✓ Certificate is Valid
                </Badge>
                
                {result.checks && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      {result.checks.w3cSignature ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">W3C Signature</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.checks.onChainMatch ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Blockchain Match</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.checks.institutionAuthorized ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Institution Authorized</span>
                    </div>
                  </div>
                )}
                
                {result.certificate && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Certificate Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Student:</strong> {result.certificate.studentName}</div>
                      <div><strong>Course:</strong> {result.certificate.courseName}</div>
                      <div><strong>Grade:</strong> {result.certificate.grade}</div>
                      <div><strong>Institution:</strong> {result.certificate.institutionName}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="destructive">
                  ✗ Certificate is Invalid
                </Badge>
                {result.error && (
                  <p className="text-sm text-red-600">{result.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}