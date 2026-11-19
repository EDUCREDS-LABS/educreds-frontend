import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeaders } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, XCircle, Search, Loader2 } from "lucide-react";
import { API_CONFIG } from "@/config/api";

interface InstitutionProfile {
  id?: string;
  name?: string;
  domain?: string;
  verificationStatus?: string;
  isVerified?: boolean;
  did?: string;
  poicScore?: number;
  deploymentTier?: string;
}

interface PoicStatus {
  masterScore?: number;
  issuanceCapacity?: {
    tier: string;
    maxIssuances: number;
    description: string;
  };
  governanceAction?: {
    recommendation: string;
    rationale: string;
    restrictions: string[];
  };
}

function StatusBadge({ status }: { status: string | undefined }) {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  const s = status.toLowerCase();
  if (s === 'approved' || s === 'verified')
    return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
  if (s === 'pending')
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
  if (s === 'suspended')
    return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle className="h-3 w-3" /> Suspended</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

export default function InstitutionVerificationPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<InstitutionProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [poic, setPoic] = useState<PoicStatus | null>(null);
  const [poicError, setPoicError] = useState<string | null>(null);
  const [poicLoading, setPoicLoading] = useState(true);

  // Inline credential verification
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    // Load institution profile
    fetch(API_CONFIG.INSTITUTIONS.PROFILE, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: any) => setProfile(data?.institution ?? data ?? null))
      .catch(() => setProfileError('Institution profile unavailable. Please try again later.'))
      .finally(() => setProfileLoading(false));

    // Load PoIC status (may not be available — degrade gracefully)
    const institutionId = (user as any)?.institutionId;
    if (institutionId) {
      fetch(`${API_CONFIG.INSTITUTIONS.BASE}/${institutionId}/poic-status`, { headers: getAuthHeaders() })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then((data: any) => setPoic(data ?? null))
        .catch(() => setPoicError('PoIC assessment data is not yet available for your institution.'))
        .finally(() => setPoicLoading(false));
    } else {
      setPoicError('PoIC data requires institution authentication.');
      setPoicLoading(false);
    }
  }, [user]);

  const handleVerify = async () => {
    if (!verifyInput.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const res = await fetch(`${API_CONFIG.CERT}/api/v1/verify/${encodeURIComponent(verifyInput.trim())}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 404) {
          setVerifyResult({ isValid: false, notFound: true });
        } else {
          setVerifyError(`Verification request failed (${res.status})`);
        }
        return;
      }
      const data = await res.json();
      setVerifyResult(data);
    } catch (e: any) {
      setVerifyError(e?.message ?? 'Verification failed. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] font-black text-neutral-500">Verification</p>
        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
          Institution Verification Status
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
          Your institution's verification state, PoIC score, and governance standing.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
            Verification Overview
          </CardTitle>
          <CardDescription>Your current verification status with EduCreds</CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-1/4" />
            </div>
          ) : profileError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{profileError}</AlertDescription>
            </Alert>
          ) : !profile ? (
            <p className="text-slate-400 text-sm">No profile data found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Institution</p>
                <p className="font-semibold text-slate-800 mt-0.5">{profile.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Domain</p>
                <p className="font-mono text-sm text-slate-700 mt-0.5">{profile.domain ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Verification Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={profile.verificationStatus} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Tier</p>
                <p className="text-sm text-slate-700 mt-0.5 capitalize">{profile.deploymentTier ?? 'workspace'}</p>
              </div>
              {profile.did && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">DID</p>
                  <p className="font-mono text-xs text-slate-700 mt-0.5 break-all">{profile.did}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PoIC Score Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            PoIC Score &amp; Governance Standing
          </CardTitle>
          <CardDescription>Proof of Institutional Credibility assessment</CardDescription>
        </CardHeader>
        <CardContent>
          {poicLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : poicError ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-amber-700">{poicError}</AlertDescription>
            </Alert>
          ) : !poic ? (
            <p className="text-slate-400 text-sm">PoIC data not yet computed for your institution.</p>
          ) : (
            <div className="space-y-4">
              {poic.masterScore !== undefined && (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Master Score</p>
                    <p className="text-3xl font-black text-slate-900 mt-0.5">{poic.masterScore.toFixed(1)}<span className="text-lg font-medium text-slate-400">/100</span></p>
                  </div>
                  {poic.issuanceCapacity && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Issuance Tier</p>
                      <p className="font-semibold text-slate-700 mt-0.5">{poic.issuanceCapacity.tier}</p>
                      <p className="text-xs text-slate-500">{poic.issuanceCapacity.description}</p>
                    </div>
                  )}
                </div>
              )}
              {poic.governanceAction && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Governance Recommendation</p>
                  <p className="text-sm font-medium text-slate-700">{poic.governanceAction.recommendation}</p>
                  {poic.governanceAction.rationale && (
                    <p className="text-sm text-slate-500 mt-1">{poic.governanceAction.rationale}</p>
                  )}
                  {poic.governanceAction.restrictions?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Active Restrictions</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {poic.governanceAction.restrictions.map((r, i) => (
                          <li key={i} className="text-sm text-red-600">{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inline Credential Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-5 w-5 text-indigo-500" />
            Verify a Credential
          </CardTitle>
          <CardDescription>Paste a credential ID or hash to check its validity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter certificate ID or hash…"
              value={verifyInput}
              onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult(null); setVerifyError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="flex-1"
            />
            <Button onClick={handleVerify} disabled={verifyLoading || !verifyInput.trim()} className="gap-2 shrink-0">
              {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Verify
            </Button>
          </div>

          {verifyError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{verifyError}</AlertDescription>
            </Alert>
          )}

          {verifyResult && (
            <div className={`rounded-lg p-4 border ${verifyResult.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {verifyResult.isValid
                  ? <CheckCircle className="h-5 w-5 text-emerald-600" />
                  : <XCircle className="h-5 w-5 text-red-500" />}
                <span className={`font-semibold text-sm ${verifyResult.isValid ? 'text-emerald-700' : 'text-red-600'}`}>
                  {verifyResult.notFound
                    ? 'Credential not found'
                    : verifyResult.isValid
                    ? 'Valid credential'
                    : 'Invalid or revoked credential'}
                </span>
              </div>
              {verifyResult.isValid && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                  {verifyResult.recipientName && <><dt className="text-slate-400">Recipient</dt><dd className="font-medium">{verifyResult.recipientName}</dd></>}
                  {verifyResult.courseName && <><dt className="text-slate-400">Course</dt><dd className="font-medium">{verifyResult.courseName}</dd></>}
                  {verifyResult.issuedBy && <><dt className="text-slate-400">Issued by</dt><dd className="font-medium">{verifyResult.issuedBy}</dd></>}
                  {verifyResult.issuedAt && <><dt className="text-slate-400">Issued at</dt><dd className="font-medium">{new Date(verifyResult.issuedAt).toLocaleDateString()}</dd></>}
                </dl>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Screening — Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-slate-400" />
            Bulk Credential Screening
          </CardTitle>
          <CardDescription>Verify multiple credentials at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-neutral-200">
            <span className="text-sm font-medium text-neutral-500">Bulk Screening</span>
            <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
            <p className="text-xs text-neutral-400 mt-2 text-center">Available on Enterprise tier</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
