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
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const clearResult = () => setResult(null);
  const parseTokenId = (value: string): number | null => {
    const normalized = String(value || '').trim().replace(/^#/, '');
    if (!normalized) return null;
    if (!/^\d+$/.test(normalized)) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const verifyW3CCredential = async () => {
    if (!disclaimerChecked) {
      alert("Please agree to the verification disclaimer before proceeding.");
      return;
    }
    setLoading(true);
    try {
      const credential = JSON.parse(w3cCredential);
      const tokenIdNum = parseTokenId(tokenId) ?? undefined;

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
    if (!disclaimerChecked) {
      alert("Please agree to the verification disclaimer before proceeding.");
      return;
    }
    setLoading(true);
    try {
      let result;

      if (ipfsHash) {
        result = await api.verifyCertificateByIPFS(ipfsHash);
      } else if (tokenId) {
        const parsedTokenId = parseTokenId(tokenId);
        if (parsedTokenId === null) {
          throw new Error('Invalid token ID format. Use digits only (e.g., 5)');
        }
        result = await api.verifyCertificateByToken(parsedTokenId);
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
        clearResult();
      };
      reader.readAsText(file);
    }
  };

  const loadSampleW3C = () => {
    const sample = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://educreds.xyz/contexts/v1"
      ],
      "id": "http://educreds.xyz/credentials/3732",
      "type": ["VerifiableCredential", "UniversityDegreeCredential"],
      "issuer": "did:educreds:inst_001",
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": "did:educreds:student_123",
        "degree": {
          "type": "BachelorDegree",
          "name": "Bachelor of Science in Computer Science"
        }
      },
      "proof": {
        "type": "Ed25519Signature2018",
        "created": new Date().toISOString(),
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:educreds:inst_001#key-1",
        "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..truncated"
      }
    };
    setW3cCredential(JSON.stringify(sample, null, 2));
    clearResult();
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
          onClick={() => {
            setVerificationMethod('w3c');
            clearResult();
          }}
        >
          W3C Verifiable Credential
        </Button>
        <Button
          variant={verificationMethod === 'legacy' ? 'default' : 'outline'}
          onClick={() => {
            setVerificationMethod('legacy');
            clearResult();
          }}
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
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Or paste W3C Verifiable Credential JSON here...</label>
                <Button variant="link" size="sm" onClick={loadSampleW3C} className="h-auto p-0">
                  Load Sample JSON
                </Button>
              </div>
              <Textarea
                placeholder='{ "@context": [...], "id": "...", "type": [...], ... }'
                value={w3cCredential}
                onChange={(e) => {
                  setW3cCredential(e.target.value);
                  clearResult();
                }}
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Blockchain Token ID (Optional)
              </label>
              <Input
                placeholder="e.g., 12345 (for cross-chain verification)"
                value={tokenId}
                onChange={(e) => {
                  setTokenId(e.target.value);
                  clearResult();
                }}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                If provided, we will verify the W3C credential against the on-chain record for token ID {tokenId}.
              </p>
            </div>

            <Button
              onClick={verifyW3CCredential}
              disabled={!w3cCredential || loading || !disclaimerChecked}
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
                onChange={(e) => {
                  setCertificateId(e.target.value);
                  clearResult();
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">IPFS Hash</label>
              <Input
                placeholder="e.g., QmX7Y8Z9..."
                value={ipfsHash}
                onChange={(e) => {
                  setIpfsHash(e.target.value);
                  clearResult();
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Token ID</label>
              <Input
                placeholder="e.g., 12345"
                value={tokenId}
                onChange={(e) => {
                  setTokenId(e.target.value);
                  clearResult();
                }}
              />
            </div>

            <Button
              onClick={verifyLegacyCredential}
              disabled={(!certificateId && !ipfsHash && !tokenId) || loading || !disclaimerChecked}
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
                    {(() => {
                      const w3cSignatureOk = Boolean(
                        result.checks.w3cSignature ??
                        result.checks.w3cSignatureValid
                      );
                      const onChainMatchOk = Boolean(
                        result.checks.onChainMatch ??
                        result.checks.onChainMinted
                      );
                      const institutionAuthorizedOk = Boolean(
                        result.checks.institutionAuthorized ??
                        result.checks.notRevoked
                      );

                      return (
                        <>
                    <div className="flex items-center gap-2">
                      {w3cSignatureOk ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">W3C Signature</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {onChainMatchOk ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Blockchain Match</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {institutionAuthorizedOk ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Institution Authorized</span>
                    </div>
                        </>
                      );
                    })()}
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
                {Array.isArray(result.reasons) && result.reasons.length > 0 && (
                  <ul className="text-sm text-red-600 list-disc pl-5 space-y-1">
                    {result.reasons.map((reason: string, index: number) => (
                      <li key={`${reason}-${index}`}>{reason}</li>
                    ))}
                  </ul>
                )}
                {result.error && (
                  <p className="text-sm text-red-600">{result.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-start space-x-2 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <input
          type="checkbox"
          id="disclaimer"
          checked={disclaimerChecked}
          onChange={(e) => {
            setDisclaimerChecked(e.target.checked);
            clearResult();
          }}
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="disclaimer" className="text-sm text-amber-900">
          <strong>GDPR & Verification Disclaimer:</strong> I acknowledge that I am authorized to verify this credential and that this verification is compliant with GDPR standards. I understand that EduCreds provides the infrastructure for verification but is not responsible for the underlying data accuracy.
        </label>
      </div>
    </div>
  );
}
