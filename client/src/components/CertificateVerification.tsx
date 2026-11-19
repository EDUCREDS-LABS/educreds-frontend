import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Upload, 
  Search, 
  Download, 
  Printer, 
  Zap, 
  ShieldCheck, 
  ShieldAlert,
  FileText,
  Database,
  Globe,
  RefreshCw,
  ArrowRight,
  Fingerprint,
  Link2,
  Lock,
  Cpu,
  Clock
} from 'lucide-react';
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function CertificateVerification() {
  const [verificationMethod, setVerificationMethod] = useState<'w3c' | 'legacy'>('legacy');
  const [w3cCredential, setW3cCredential] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingProof, setDownloadingProof] = useState(false);
  const [onChainProof, setOnChainProof] = useState<any>(null);
  const [loadingOnChainProof, setLoadingOnChainProof] = useState(false);
  const [onChainProofError, setOnChainProofError] = useState<string | null>(null);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const parseTokenId = (input: string): number | null => {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    const parsed = parseInt(trimmed.replace(/^#/, ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const certId = params.get('certificateId') || params.get('certId');
    const ipfs = params.get('ipfs') || params.get('ipfsHash');
    const token = params.get('tokenId') || params.get('token');

    if (certId || ipfs || token) {
      setVerificationMethod('legacy');
      if (certId) setCertificateId(certId);
      else if (ipfs) setIpfsHash(ipfs);
      else if (token) setTokenId(token);
    }
  }, []);

  const clearResult = () => {
    setResult(null);
    setOnChainProof(null);
    setOnChainProofError(null);
    setW3cCredential('');
    setTokenId('');
    setIpfsHash('');
    setCertificateId('');
  };

  useEffect(() => {
    const tokenIdNumber = result?.certificate?.tokenId ? Number(result.certificate.tokenId) : null;
    if (!tokenIdNumber || Number.isNaN(tokenIdNumber)) {
      setOnChainProof(null);
      setOnChainProofError(null);
      return;
    }

    let cancelled = false;
    const loadProof = async () => {
      setLoadingOnChainProof(true);
      setOnChainProofError(null);
      try {
        const proof = await api.getHybridCredentialProof(tokenIdNumber);
        if (!cancelled) setOnChainProof(proof);
      } catch (error) {
        if (!cancelled) {
          setOnChainProof(null);
          setOnChainProofError(error instanceof Error ? error.message : 'Unable to load on-chain proof details');
        }
      } finally {
        if (!cancelled) setLoadingOnChainProof(false);
      }
    };

    loadProof();
    return () => {
      cancelled = true;
    };
  }, [result?.certificate?.tokenId]);

  const downloadVerificationProof = async () => {
    if (!result) return;
    setDownloadingProof(true);
    try {
      const tokenIdNumber = result?.certificate?.tokenId ? Number(result.certificate.tokenId) : null;
      const onChainProof = tokenIdNumber ? await api.getHybridCredentialProof(tokenIdNumber) : null;
      const payload = {
        generatedAt: new Date().toISOString(),
        verificationResult: result,
        onChainProof: onChainProof ?? (tokenIdNumber ? await api.getHybridCredentialProof(tokenIdNumber) : null),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `educreds-verification-proof-${tokenIdNumber ?? 'credential'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setResult({
        ...result,
        proofError: error instanceof Error ? error.message : 'Failed to generate verification proof',
      });
    } finally {
      setDownloadingProof(false);
    }
  };

  const handleVerify = async () => {
    if (!disclaimerChecked) {
      alert("Please acknowledge the protocol verification terms.");
      return;
    }
    setLoading(true);
    try {
      // PUBLIC LAYER ONLY — anonymous verification. The backend returns the
      // minimal PublicVerificationView (existence + issuer + type + issued year
      // + revoked). Advanced, attribute-disclosing verification (EVF) requires
      // an authenticated verifier and lives at /employer/verify.
      let res;
      if (verificationMethod === 'w3c') {
        const credential = JSON.parse(w3cCredential);
        res = await api.verifyHybridCredential({
          w3cCredential: credential,
          tokenId: parseTokenId(tokenId) ?? undefined
        });
      } else {
        if (ipfsHash) res = await api.verifyPublicCertificate(ipfsHash);
        else if (tokenId) res = await api.verifyPublicCertificate(parseTokenId(tokenId)!.toString());
        else if (certificateId) res = await api.verifyPublicCertificate(certificateId);
        else throw new Error('Specify at least one network identifier');
      }
      setResult(res);
    } catch (error) {
      setResult({ valid: false, error: error instanceof Error ? error.message : 'Consensus failed' });
    } finally {
      setLoading(false);
    }
  };

  // A credential can be in one of four states. The backend returns `valid:false`
  // for credentials that exist and are not revoked but have not yet been confirmed
  // on-chain (issuanceStatus === 'pending_blockchain_mint'). Showing "Audit Failed"
  // for those is misleading, so we surface a distinct "pending" state and still
  // render the certificate data we received.
  const cert = result?.certificate;
  const checks = result?.checks;
  const checksArray: string[] = Array.isArray(checks) ? checks : [];
  const liveInstitutionCheck = checksArray.find((entry) => entry.startsWith('live_institution_confirmation:'));
  const liveInstitutionSource = liveInstitutionCheck ? liveInstitutionCheck.split(':')[1] : null;
  const hasLiveInstitutionConfirmation = Boolean(liveInstitutionSource);
  const revokedBy = cert?.revokedBy || result?.revokedBy || result?.revocation?.revokedBy || null;
  const revokedAt = cert?.revokedAt || result?.revokedAt || result?.revocation?.revokedAt || null;
  const revocationReason = cert?.revocationReason || result?.revocationReason || result?.revocation?.reason || null;

  // Public Layer response normalization (Privacy Architecture).
  // The backend's anonymous verify routes now return only the minimal
  // PublicVerificationView (existence + issuer + type + issued year + revoked).
  // Legacy full responses (from authenticated/EVF callers) still carry PII and
  // use the full shape; this block tolerates both.
  const isPublicView = result && !('certificate' in result) && 'isValid' in result;
  const publicView = isPublicView ? result : undefined;
  const isRevoked = publicView
    ? publicView.isRevoked === true
    : result?.issuanceStatus === 'revoked' || result?.checks?.notRevoked === false;
  const isPendingMint = result?.issuanceStatus === 'pending_blockchain_mint'
    || result?.issuanceStatus === 'pending_wallet_signature';
  const resultStatus: 'authentic' | 'pending' | 'revoked' | 'failed' = publicView
    ? publicView.isValid
      ? 'authentic'
      : isRevoked
        ? 'revoked'
        : 'failed'
    : result?.valid
      ? 'authentic'
      : isRevoked
        ? 'revoked'
        : isPendingMint && Boolean(cert)
          ? 'pending'
          : 'failed';

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-12 px-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="size-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary mx-auto shadow-2xl shadow-primary/20">
          <ShieldCheck className="size-10" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">
          Public Layer
        </div>
        <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
          Public <span className="text-primary">Verification</span>.
        </h1>
        <p className="text-neutral-500 font-medium max-w-xl mx-auto text-lg">
          Confirm a credential's existence, issuer, type, issued year and revocation status — no personal data disclosed. For full attribute verification (grade, holder, evidence), sign in and use the advanced verifier.
        </p>
        <a
          href="/employer/verify"
          className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
        >
          Advanced Employer Verification
          <ArrowRight className="size-4" />
        </a>
      </div>

      {!result ? (
        <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
          <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight">Audit Parameters</CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Credential Entry Point</CardDescription>
              </div>
              <div className="flex p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
                <button 
                  onClick={() => setVerificationMethod('w3c')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    verificationMethod === 'w3c' ? "bg-white dark:bg-neutral-900 text-primary shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                  )}
                >
                  W3C Payload
                </button>
                <button 
                  onClick={() => setVerificationMethod('legacy')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    verificationMethod === 'legacy' ? "bg-white dark:bg-neutral-900 text-primary shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                  )}
                >
                  Network ID
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            {verificationMethod === 'w3c' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">W3C Credential (JSON Payload)</label>
                  <div className="relative group">
                    <Textarea 
                      rows={8}
                      placeholder='{ "type": ["VerifiableCredential", "UniversityDegree"], ... }'
                      value={w3cCredential}
                      onChange={(e) => setW3cCredential(e.target.value)}
                      className="rounded-[32px] bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner p-8 font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                    <div className="absolute top-8 right-8 size-12 bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-300 group-focus-within:text-primary transition-colors">
                      <Cpu className="size-6" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Token ID (Optional)</label>
                  <Input 
                    placeholder="#12485" 
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner pl-6 font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">IPFS CID Hash</label>
                    <Input 
                      placeholder="Qm..." 
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner pl-6 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">On-Chain Token ID</label>
                    <Input 
                      placeholder="e.g. 5" 
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner pl-6 font-bold"
                    />
                  </div>
                </div>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-100 dark:border-neutral-800" /></div>
                  <div className="relative flex justify-center"><span className="bg-white dark:bg-neutral-900 px-4 text-[10px] font-black text-neutral-300 uppercase tracking-[0.3em]">OR</span></div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">EduCreds Global ID</label>
                  <Input 
                    placeholder="CERT-XXXX-XXXX" 
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner pl-6 font-black tracking-widest"
                  />
                </div>
              </div>
            )}

            <div className="space-y-6">
                <div className="flex items-center space-x-3 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                  <input
                    type="checkbox"
                    id="disclaimer"
                    className="rounded-lg size-5 text-primary focus:ring-primary/20 border-neutral-200"
                    checked={disclaimerChecked}
                    onChange={(e) => setDisclaimerChecked(e.target.checked)}
                  />
                  <label htmlFor="disclaimer" className="text-xs font-bold text-neutral-500 uppercase tracking-tight">
                    I acknowledge that this audit is processed by the EduCreds decentralized consensus engine.
                  </label>
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full h-16 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {loading ? <RefreshCw className="size-5 mr-2 animate-spin" /> : <Zap className="size-5 mr-2" />}
                  Verify Credential
                </Button>
              </div>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <Card className={cn(
              "border-none shadow-2xl rounded-[40px] overflow-hidden",
              resultStatus === 'authentic' && "bg-white dark:bg-neutral-900",
              resultStatus === 'pending' && "bg-amber-50 dark:bg-amber-950/20",
              (resultStatus === 'revoked' || resultStatus === 'failed') && "bg-red-50 dark:bg-red-950/20"
            )}>
              <div className={cn(
                "p-12 flex flex-col md:flex-row items-center gap-10 text-white",
                resultStatus === 'authentic' && "bg-emerald-500",
                resultStatus === 'pending' && "bg-amber-500",
                (resultStatus === 'revoked' || resultStatus === 'failed') && "bg-red-600"
              )}>
                <div className="size-24 rounded-[32px] bg-white/20 flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
                  {resultStatus === 'authentic' && <ShieldCheck className="size-12" />}
                  {resultStatus === 'pending' && <Clock className="size-12" />}
                  {(resultStatus === 'revoked' || resultStatus === 'failed') && <ShieldAlert className="size-12" />}
                </div>
                <div className="text-center md:text-left space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Protocol Verification Status</p>
                  <h2 className="text-5xl font-black tracking-tighter leading-none italic uppercase">
                    {resultStatus === 'authentic' && "Authentic."}
                    {resultStatus === 'pending' && "Pending Confirmation."}
                    {resultStatus === 'revoked' && "Revoked."}
                    {resultStatus === 'failed' && "Not Verified."}
                  </h2>
                  <p className="text-white/80 font-bold uppercase tracking-widest text-xs">
                    {resultStatus === 'authentic' && "Cryptographically signed & verified on-chain"}
                    {resultStatus === 'pending' && "Credential record found — awaiting on-chain finality"}
                    {resultStatus === 'revoked' && "This credential has been revoked by the issuer"}
                    {resultStatus === 'failed' && (result.error || "Integrity check returned invalid signatures")}
                  </p>
                </div>
              </div>

              {(resultStatus === 'authentic' || resultStatus === 'pending') && (
                <CardContent className="p-12 space-y-12">
                   {resultStatus === 'pending' && (
                     <div className="p-6 bg-amber-500/10 rounded-[28px] border border-amber-500/20 flex items-start gap-4">
                        <Clock className="size-6 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-amber-700 dark:text-amber-400 font-medium text-sm leading-relaxed">
                          This credential exists in the EduCreds registry and has not been revoked, but it has not yet been confirmed on the blockchain. The data below is authentic registry data; on-chain finality will appear here once the issuance transaction is mined.
                        </p>
                     </div>
                   )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-8">
                         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                            <div className="size-1.5 rounded-full bg-primary" />
                            Credential Summary
                         </h3>
                         <div className="space-y-6">
                           <ResultItem label="Credential" value={displayValue(publicView?.credentialType ?? result.certificate?.courseName, "Unknown Credential")} icon={FileText} />
                           <ResultItem label="Issuing Authority" value={displayValue(publicView?.institutionName ?? result.certificate?.institutionName, "Unknown Institution")} icon={Globe} />
                           <ResultItem label="Issued" value={displayValue(publicView?.issuedYear ?? formatIssuedYear(result.certificate), "Unknown")} icon={Clock} />
                         </div>
                       </div>
                       <div className="space-y-8">
                         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                            <div className="size-1.5 rounded-full bg-primary" />
                            Blockchain Record
                         </h3>
                         <div className="space-y-6">
                            <ResultItem label="Blockchain ID" value={result.certificate?.tokenId ? `Token #${result.certificate.tokenId}` : "Not yet minted"} icon={Database} mono />
                            <ResultItem label="On-Chain Status" value={resultStatus === 'authentic' ? "Verified on-chain" : "Pending confirmation"} icon={Zap} />
                            <ResultItem label="Status" value={displayValue(publicView?.status ?? result.issuanceStatus ?? result.status, "Unknown")} icon={CheckCircle2} />
                         </div>
                       </div>
                    </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 bg-neutral-50 dark:bg-neutral-900">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Institution Confirmation</p>
                       {hasLiveInstitutionConfirmation ? (
                         <>
                           <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Confirmed by Institution Connector</p>
                           <p className="text-sm text-neutral-500 mt-1">
                             Source: <span className="font-semibold capitalize">{liveInstitutionSource?.replace('-', ' ')}</span>
                           </p>
                         </>
                       ) : (
                         <>
                           <p className="text-lg font-black text-amber-600 dark:text-amber-400">No live connector confirmation</p>
                           <p className="text-sm text-neutral-500 mt-1">This verification is backed by registry/on-chain checks only.</p>
                         </>
                       )}
                     </div>
                     <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 bg-neutral-50 dark:bg-neutral-900">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Verification Method</p>
                       <p className="text-lg font-black text-neutral-900 dark:text-neutral-100 capitalize">{displayValue(result?.verificationMethod, 'full')}</p>
                       <p className="text-sm text-neutral-500 mt-1">Evidence trace includes cryptographic signature, revocation checks, and blockchain integrity validation.</p>
                     </div>
                   </div>

                   <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 bg-neutral-50 dark:bg-neutral-900">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">On-chain Proof Details</p>
                     {loadingOnChainProof ? (
                       <div className="space-y-3">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-4/5" />
                         <Skeleton className="h-4 w-3/5" />
                       </div>
                     ) : onChainProof ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <ResultItem label="Credential ID" value={displayValue(onChainProof.credentialId, 'Unavailable')} icon={Fingerprint} />
                         <ResultItem label="Issuer" value={displayValue(onChainProof.issuer, 'Unavailable')} icon={Globe} mono />
                         <ResultItem label="Metadata Hash" value={displayValue(onChainProof.metadataHash, 'Unavailable')} icon={Lock} mono />
                         <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-950">
                           <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Transaction Hash</p>
                           <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all">
                             {displayValue(onChainProof.transactionHash, 'Unavailable')}
                           </p>
                           {onChainProof.transactionHash && (
                             <a
                               href={`https://sepolia.basescan.org/tx/${onChainProof.transactionHash}`}
                               target="_blank"
                               rel="noreferrer"
                               className="inline-flex items-center gap-2 mt-3 text-xs font-bold text-primary hover:underline"
                             >
                               View Transaction <ArrowRight className="size-3" />
                             </a>
                           )}
                         </div>
                       </div>
                     ) : (
                       <p className="text-sm text-neutral-500">
                         {onChainProofError ?? 'On-chain proof details are unavailable for this credential.'}
                       </p>
                     )}
                   </div>

                   <div className="pt-10 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-4">
                      <Button onClick={clearResult} variant="outline" className="h-14 px-8 rounded-2xl border-neutral-200 font-black text-xs uppercase tracking-widest">Verify Another</Button>
                      {resultStatus === 'authentic' && (
                        <Button
                          className="h-14 px-10 rounded-2xl bg-neutral-900 dark:bg-neutral-900 text-white dark:text-white font-black text-xs uppercase tracking-widest shadow-xl"
                          onClick={downloadVerificationProof}
                          disabled={downloadingProof}
                        >
                          {downloadingProof ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Download className="size-4 mr-2" />}
                          Download Official Report
                        </Button>
                      )}
                   </div>
                   {result?.proofError && (
                     <p className="text-sm text-red-600 dark:text-red-400 font-medium">{result.proofError}</p>
                   )}
                </CardContent>
              )}
              {(resultStatus === 'revoked' || resultStatus === 'failed') && (
                 <CardContent className="p-12">
                    <div className="p-8 bg-red-500/10 rounded-[32px] border border-red-500/20 space-y-4">
                       <p className="text-red-600 font-black uppercase tracking-widest text-xs">Why verification failed</p>
                       <p className="text-red-500/80 font-medium text-lg leading-relaxed">
                         {resultStatus === 'revoked'
                           ? "This credential has been revoked by the issuing institution and is no longer valid."
                           : result.error || "The provided payload did not match any cryptographically signed records on the EduCreds network. This credential may be fraudulent or have been revoked."}
                       </p>
                       {resultStatus === 'revoked' && (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                           <RevocationMeta label="Revoked By" value={revokedBy || 'Not disclosed'} />
                           <RevocationMeta label="Revoked At" value={revokedAt ? new Date(revokedAt).toLocaleString() : 'Not disclosed'} />
                           <RevocationMeta label="Reason" value={revocationReason || 'Not disclosed'} />
                         </div>
                       )}
                       <Button onClick={clearResult} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold mt-4">Verify Another</Button>
                    </div>
                 </CardContent>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function displayValue(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const normalized = trimmed.toLowerCase();
  if (
    normalized === 'student' ||
    normalized === 'unknown' ||
    normalized === 'unknown student' ||
    normalized === 'n/a' ||
    normalized === 'na'
  ) {
    return fallback;
  }
  return trimmed;
}

function formatIssuedDate(cert: any): string {
  const raw = cert?.issueDate || cert?.issuedAt || cert?.completionDate || cert?.createdAt;
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatIssuedYear(cert: any): string {
  const raw = cert?.issueDate || cert?.issuedAt || cert?.completionDate || cert?.createdAt;
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "—" : String(d.getUTCFullYear());
}

function ResultItem({ label, value, icon: Icon, mono }: any) {
  return (
    <div className="flex items-center gap-5 group">
      <div className="size-12 rounded-2xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-primary transition-colors">
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={cn(
          "text-lg font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-none",
          mono && "font-mono text-sm"
        )}>{value}</p>
      </div>
    </div>
  );
}

function RevocationMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-red-700/70 mb-1">{label}</p>
      <p className="text-sm font-bold text-red-700">{value}</p>
    </div>
  );
}

const Users = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
