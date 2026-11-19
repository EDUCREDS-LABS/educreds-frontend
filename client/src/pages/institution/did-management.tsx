import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, KeyRound, RefreshCw, Clock, Hash, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from "date-fns";

interface DIDProfile {
  did: string;
  walletAddress: string;
  isVerified: boolean;
  blockchainRegistered: boolean;
  blockchainAuthorized: boolean;
  iinTokenId: number | null;
  keyRotatedAt: string | null;
  keyExpiresAt: string | null;
  keyRotationCount: number;
  keyRotationPolicy: string;
  rotationLog: Array<{
    rotatedAt: string;
    rotatedBy: string;
    reason: string;
    rotationCount: number;
  }>;
}

export default function DIDManagementPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DIDProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rotating, setRotating] = useState(false);
  const [rotateSuccess, setRotateSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getInstitutionDIDProfile()
      .then((data: any) => setProfile(data))
      .catch(() => setError('Failed to load DID profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRotateKey = async () => {
    if (!confirm('Are you sure you want to rotate your DID key? This is irreversible.')) return;
    setRotating(true);
    try {
      await api.rotateInstitutionKey({ reason: 'manual' });
      setRotateSuccess(true);
      // Reload profile
      const fresh = await api.getInstitutionDIDProfile();
      setProfile(fresh);
    } catch (e: any) {
      setError(e?.message || 'Key rotation failed. Contact support.');
    } finally {
      setRotating(false);
    }
  };

  const isExpiringSoon = (() => {
    try {
      return profile?.keyExpiresAt
        ? isWithinInterval(new Date(profile.keyExpiresAt), { start: new Date(), end: addDays(new Date(), 30) })
        : false;
    } catch {
      return false;
    }
  })();
  const isExpired = (() => {
    try {
      return profile?.keyExpiresAt ? isPast(new Date(profile.keyExpiresAt)) : false;
    } catch {
      return false;
    }
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] font-black text-neutral-500">Identity Layer</p>
        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
          DID Control Panel
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
          Your institution's decentralized identity, blockchain registration, and key rotation controls.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {rotateSuccess && (
        <Alert className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
          <CheckCircle className="size-4" />
          <AlertDescription>Key rotation successful. Your new key is now active.</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : profile ? (
        <>
          {/* DID Identity Card */}
          <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black">
                <ShieldCheck className="size-5 text-blue-500" /> Your Decentralized Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">DID</p>
                <p className="font-mono text-sm text-neutral-900 dark:text-neutral-100 break-all">
                  {profile.did || `did:educreds:institution:${user?.id}`}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Status</p>
                  <div className="flex gap-2">
                    <Badge className={profile.isVerified ? "bg-green-500/10 text-green-600 border-green-500/30" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"}>
                      {profile.isVerified ? "Verified" : "Pending Verification"}
                    </Badge>
                    <Badge className={profile.blockchainAuthorized ? "bg-blue-500/10 text-blue-600 border-blue-500/30" : "bg-neutral-100 text-neutral-500"}>
                      {profile.blockchainAuthorized ? "On-Chain Authorized" : "Not On-Chain"}
                    </Badge>
                  </div>
                </div>
                {profile.iinTokenId !== null && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">IIN Token ID</p>
                    <a
                      href={`https://sepolia.basescan.org/token/${profile.iinTokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-mono text-blue-500 hover:underline"
                    >
                      #{profile.iinTokenId} <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Wallet Address</p>
                <p className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
                  {profile.walletAddress
                    ? `${profile.walletAddress.slice(0, 10)}…${profile.walletAddress.slice(-8)}`
                    : 'Not connected'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Rotation Status */}
          <Card className={`rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${isExpired ? 'border-red-300 dark:border-red-800' : isExpiringSoon ? 'border-yellow-300 dark:border-yellow-700' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black">
                <KeyRound className="size-5 text-purple-500" /> Key Rotation
                {isExpired && <Badge className="bg-red-500/10 text-red-600 border-red-500/30 ml-auto">Key Expired</Badge>}
                {isExpiringSoon && !isExpired && <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 ml-auto">Expiring Soon</Badge>}
              </CardTitle>
              <CardDescription>Policy: rotate every {profile.keyRotationPolicy || '90d'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Last Rotated</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">
                    {profile.keyRotatedAt
                      ? `${format(new Date(profile.keyRotatedAt), 'MMM d, yyyy')} (${formatDistanceToNow(new Date(profile.keyRotatedAt), { addSuffix: true })})`
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Expires</p>
                  <p className={`text-sm font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-neutral-900 dark:text-neutral-100'}`}>
                    {profile.keyExpiresAt
                      ? `${format(new Date(profile.keyExpiresAt), 'MMM d, yyyy')} (${formatDistanceToNow(new Date(profile.keyExpiresAt), { addSuffix: true })})`
                      : 'No expiry set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Rotation Count</p>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100">{profile.keyRotationCount} rotations</p>
                </div>
              </div>
              <Button
                onClick={handleRotateKey}
                disabled={rotating}
                variant={isExpired || isExpiringSoon ? "default" : "outline"}
                className="rounded-xl font-black text-xs uppercase tracking-wider"
              >
                <RefreshCw className={`size-4 mr-2 ${rotating ? 'animate-spin' : ''}`} />
                {rotating ? 'Rotating Key...' : 'Rotate Key Now'}
              </Button>
            </CardContent>
          </Card>

          {/* Rotation History */}
          {profile.rotationLog && profile.rotationLog.length > 0 && (
            <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-black">
                  <Clock className="size-5 text-neutral-400" /> Rotation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.rotationLog.slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          Rotation #{entry.rotationCount}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {entry.reason} · by {entry.rotatedBy}
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400">
                        {format(new Date(entry.rotatedAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            DID status: Pending infrastructure resolution. Your institution's decentralized identity is being provisioned.
            If this persists, contact support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
