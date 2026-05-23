import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Upload, 
  Search, 
  FileDown, 
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
  Cpu
} from 'lucide-react';
import { Skeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function CertificateVerification() {
  const [verificationMethod, setVerificationMethod] = useState<'w3c' | 'legacy'>('w3c');
  const [w3cCredential, setW3cCredential] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

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

  const parseTokenId = (value: string): number | null => {
    const normalized = String(value || '').trim().replace(/^#/, '');
    if (!normalized || !/^\d+$/.test(normalized)) return null;
    return Number(normalized);
  };

  const handleVerify = async () => {
    if (!disclaimerChecked) {
      alert("Please acknowledge the protocol verification terms.");
      return;
    }
    setLoading(true);
    try {
      let res;
      if (verificationMethod === 'w3c') {
        const credential = JSON.parse(w3cCredential);
        res = await api.verifyHybridCredential({
          w3cCredential: credential,
          tokenId: parseTokenId(tokenId) ?? undefined
        });
      } else {
        if (ipfsHash) res = await api.verifyCertificateByIPFS(ipfsHash);
        else if (tokenId) res = await api.verifyCertificateByToken(parseTokenId(tokenId)!);
        else if (certificateId) res = await api.verifyCertificate(certificateId);
        else throw new Error('Specify at least one network identifier');
      }
      setResult(res);
    } catch (error) {
      setResult({ valid: false, error: error instanceof Error ? error.message : 'Consensus failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-12 px-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="size-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary mx-auto shadow-2xl shadow-primary/20">
          <ShieldCheck className="size-10" />
        </div>
        <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
          Protocol <span className="text-primary">Verifier</span>.
        </h1>
        <p className="text-neutral-500 font-medium max-w-xl mx-auto text-lg">
          Validate the cryptographic integrity and authenticity of academic credentials across the EduCreds decentralized network.
        </p>
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
              Initiate Consensus Audit
            </Button>
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
              result.valid ? "bg-white dark:bg-neutral-900" : "bg-red-50 dark:bg-red-950/20"
            )}>
              <div className={cn(
                "p-12 flex flex-col md:flex-row items-center gap-10",
                result.valid ? "bg-emerald-500 text-white" : "bg-red-600 text-white"
              )}>
                <div className="size-24 rounded-[32px] bg-white/20 flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl">
                  {result.valid ? <ShieldCheck className="size-12" /> : <ShieldAlert className="size-12" />}
                </div>
                <div className="text-center md:text-left space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Protocol Verification Status</p>
                  <h2 className="text-5xl font-black tracking-tighter leading-none italic uppercase">
                    {result.valid ? "Authentic." : "Audit Failed."}
                  </h2>
                  <p className="text-white/80 font-bold uppercase tracking-widest text-xs">
                    {result.valid ? "Cryptographically signed & verified on-chain" : result.error || "Integrity check returned invalid signatures"}
                  </p>
                </div>
              </div>

              {result.valid && (
                <CardContent className="p-12 space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                           <div className="size-1.5 rounded-full bg-primary" />
                           Identity Metadata
                        </h3>
                        <div className="space-y-6">
                           <ResultItem label="Recipient" value={result.certificate?.studentName || "N/A"} icon={Users} />
                           <ResultItem label="Credential" value={result.certificate?.courseName || "N/A"} icon={FileText} />
                           <ResultItem label="Authority" value={result.certificate?.institutionName || "N/A"} icon={Globe} />
                        </div>
                      </div>
                      <div className="space-y-8">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                           <div className="size-1.5 rounded-full bg-primary" />
                           Network Telemetry
                        </h3>
                        <div className="space-y-6">
                           <ResultItem label="Blockchain ID" value={`Token #${result.certificate?.tokenId || "N/A"}`} icon={Database} mono />
                           <ResultItem label="Consensus Point" value={result.certificate?.isMinted ? "Verified On-Chain" : "Stored Off-Chain"} icon={Zap} />
                           <ResultItem label="Audit Date" value={new Date().toLocaleString()} icon={RefreshCw} />
                        </div>
                      </div>
                   </div>

                   <div className="pt-10 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-4">
                      <Button onClick={clearResult} variant="outline" className="h-14 px-8 rounded-2xl border-neutral-200 font-black text-xs uppercase tracking-widest">Perform New Audit</Button>
                      <Button className="h-14 px-10 rounded-2xl bg-neutral-900 dark:bg-neutral-900 text-white dark:text-white font-black text-xs uppercase tracking-widest shadow-xl">Download Official Report</Button>
                   </div>
                </CardContent>
              )}
              {!result.valid && (
                 <CardContent className="p-12">
                    <div className="p-8 bg-red-500/10 rounded-[32px] border border-red-500/20 space-y-4">
                       <p className="text-red-600 font-black uppercase tracking-widest text-xs">Technical Failure Analysis</p>
                       <p className="text-red-500/80 font-medium text-lg leading-relaxed">
                         {result.error || "The provided payload did not match any cryptographically signed records on the EduCreds network. This credential may be fraudulent or have been revoked."}
                       </p>
                       <Button onClick={clearResult} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold mt-4">Reset Audit</Button>
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
