import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Upload, Search, FileDown, Printer, Zap } from 'lucide-react';

export function CertificateVerification() {
  const [verificationMethod, setVerificationMethod] = useState<'w3c' | 'legacy'>('w3c');
  const [w3cCredential, setW3cCredential] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [autoRan, setAutoRan] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const certificateIdParam = params.get('certificateId') || params.get('certId');
    const ipfsParam = params.get('ipfs') || params.get('ipfsHash');
    const tokenParam = params.get('tokenId') || params.get('token');
    const quickParam = params.get('mode') === 'quick';

    if (certificateIdParam || ipfsParam || tokenParam) {
      setVerificationMethod('legacy');
      if (certificateIdParam) {
        setCertificateId(certificateIdParam);
      } else if (ipfsParam) {
        setIpfsHash(ipfsParam);
      } else if (tokenParam) {
        setTokenId(tokenParam);
      }
    }
    if (quickParam) {
      setQuickMode(true);
    }
  }, []);

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

  useEffect(() => {
    if (autoRan) return;
    if (!disclaimerChecked) return;
    const hasLegacy = certificateId || ipfsHash || tokenId;
    const hasW3C = Boolean(w3cCredential && w3cCredential.trim().length > 0);
    if (!hasLegacy && !hasW3C) return;

    setAutoRan(true);
    if (verificationMethod === 'w3c' && hasW3C) {
      verifyW3CCredential();
    } else if (verificationMethod === 'legacy' && hasLegacy) {
      verifyLegacyCredential();
    }
  }, [autoRan, disclaimerChecked, verificationMethod, certificateId, ipfsHash, tokenId, w3cCredential]);

  const buildVerificationReport = () => {
    return {
      generatedAt: new Date().toISOString(),
      method: verificationMethod,
      inputs: {
        certificateId: certificateId || null,
        ipfsHash: ipfsHash || null,
        tokenId: tokenId || null,
      },
      result,
    };
  };

  const downloadReport = () => {
    const payload = buildVerificationReport();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const payload = buildVerificationReport();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap;">${JSON.stringify(payload, null, 2)}</pre>`);
    win.document.close();
    win.focus();
    win.print();
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
    <div className="verification-shell min-h-screen" style={{ fontFamily: 'var(--vp-sans)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .verification-shell {
          --vp-bg: #0f172a;
          --vp-accent: #f59e0b;
          --vp-ink: #0f172a;
          --vp-surface: #ffffff;
          --vp-mute: #94a3b8;
          --vp-border: rgba(15, 23, 42, 0.08);
          --vp-display: 'Space Grotesk', sans-serif;
          --vp-sans: 'IBM Plex Sans', sans-serif;
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 55%),
            radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.15), transparent 50%),
            linear-gradient(120deg, #0f172a 0%, #111827 45%, #0b1120 100%);
          color: #e2e8f0;
        }
        .vp-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
          color: #e2e8f0;
        }
        .vp-card-light {
          background: #ffffff;
          border: 1px solid var(--vp-border);
          border-radius: 20px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
          color: #0f172a;
        }
        .vp-title {
          font-family: var(--vp-display);
          letter-spacing: -0.02em;
        }
        .vp-animate {
          animation: vpRise 500ms ease-out forwards;
        }
        @keyframes vpRise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vp-tab {
          border: 1px solid rgba(255,255,255,0.12);
          color: #e2e8f0;
        }
        .vp-tab.active {
          background: rgba(245, 158, 11, 0.18);
          border-color: rgba(245, 158, 11, 0.5);
          color: #fff7ed;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className={`grid grid-cols-1 ${quickMode ? '' : 'lg:grid-cols-[1.1fr_1.4fr]'} gap-8`}>
          {!quickMode && (
          <div className="space-y-6 vp-animate">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80">
              Enterprise Verification Suite
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <h1 className="vp-title text-4xl lg:text-5xl font-semibold">
              Credential Verification Portal
            </h1>
            <p className="text-slate-200 text-base lg:text-lg max-w-xl">
              Validate W3C credentials, IPFS proofs, and blockchain records with a single workflow.
              Designed for compliance teams, admissions offices, and enterprise verifiers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="vp-card p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Integrity</p>
                <p className="text-lg font-semibold mt-2 text-white">Tamper-evident audit trail</p>
                <p className="text-sm text-slate-300 mt-2">
                  Signatures, IPFS immutability, and optional on-chain checks.
                </p>
              </div>
              <div className="vp-card p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Compliance</p>
                <p className="text-lg font-semibold mt-2 text-white">GDPR-aware verification</p>
                <p className="text-sm text-slate-300 mt-2">
                  Verification only, no sensitive data stored in the portal.
                </p>
              </div>
            </div>

            <div className="vp-card p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Workflow</p>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">1</span>
                  Provide a W3C JSON or legacy identifier.
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">2</span>
                  Run cryptographic and on-chain checks.
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">3</span>
                  Export the verification result for audit.
                </div>
              </div>
            </div>
          </div>
          )}

          <div className="space-y-6 vp-animate">
            <div className="flex flex-wrap gap-3">
              <button
                className={`vp-tab px-4 py-2 rounded-full text-sm ${quickMode ? 'active' : ''}`}
                onClick={() => setQuickMode(!quickMode)}
              >
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Quick Scan
                </span>
              </button>
              <button
                className={`vp-tab px-4 py-2 rounded-full text-sm ${verificationMethod === 'w3c' ? 'active' : ''}`}
                onClick={() => {
                  setVerificationMethod('w3c');
                  clearResult();
                }}
              >
                W3C JSON
              </button>
              <button
                className={`vp-tab px-4 py-2 rounded-full text-sm ${verificationMethod === 'legacy' ? 'active' : ''}`}
                onClick={() => {
                  setVerificationMethod('legacy');
                  clearResult();
                }}
              >
                Certificate ID / IPFS / Token
              </button>
            </div>

            <Card className="vp-card-light overflow-hidden">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="vp-title text-2xl">
                  {verificationMethod === 'w3c'
                    ? 'Verify W3C Credential'
                    : 'Verify by Identifier'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {verificationMethod === 'w3c' && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Upload or Paste W3C Credential JSON
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
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
                        <label className="text-sm font-medium">Paste credential JSON</label>
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
                        placeholder="e.g., 12345 (optional cross-check)"
                        value={tokenId}
                        onChange={(e) => {
                          setTokenId(e.target.value);
                          clearResult();
                        }}
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        If provided, we compare the W3C credential against the on-chain record.
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
                  </>
                )}

                {verificationMethod === 'legacy' && (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>

            {result && (
              <Card className="vp-card-light">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 vp-title">
                    {result.valid ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    )}
                    Verification Outcome
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.valid ? (
                    <div className="space-y-4">
                      <Badge variant="default" className="bg-emerald-500">
                        ✓ Credential Verified
                      </Badge>

                      {result.checks && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                <div className="flex items-center gap-2 text-sm">
                                  {w3cSignatureOk ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-rose-500" />
                                  )}
                                  <span>W3C Signature</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {onChainMatchOk ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-rose-500" />
                                  )}
                                  <span>Blockchain Match</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {institutionAuthorizedOk ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-rose-500" />
                                  )}
                                  <span>Institution Authorized</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {result.certificate && (
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <h4 className="font-medium mb-2">Credential Summary</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div><strong>Student:</strong> {result.certificate.studentName}</div>
                            <div><strong>Course:</strong> {result.certificate.courseName}</div>
                            <div><strong>Grade:</strong> {result.certificate.grade}</div>
                            <div><strong>Institution:</strong> {result.certificate.institutionName}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button variant="outline" onClick={downloadReport}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                        <Button variant="outline" onClick={printReport}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print Report
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Badge variant="destructive">
                        ✗ Verification Failed
                      </Badge>
                      {Array.isArray(result.reasons) && result.reasons.length > 0 && (
                        <div className="text-sm text-rose-600 space-y-1">
                          {result.reasons.map((reason: string, index: number) => (
                            <div key={`${reason}-${index}`}>{reason}</div>
                          ))}
                        </div>
                      )}
                      {result.error && (
                        <p className="text-sm text-rose-600">{result.error}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="vp-card p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="disclaimer"
                  checked={disclaimerChecked}
                  onChange={(e) => {
                    setDisclaimerChecked(e.target.checked);
                    clearResult();
                  }}
                  className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded"
                />
                <label htmlFor="disclaimer" className="text-sm text-slate-200">
                  <strong>GDPR & Verification Disclaimer:</strong> I confirm I am authorized to verify this credential.
                  EduCreds provides the verification infrastructure and does not control underlying data accuracy.
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
