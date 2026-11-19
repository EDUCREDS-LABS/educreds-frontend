/**
 * VerifyCardPage — /verify/:certificateId
 *
 * Public verification card. Opened when a verifier clicks a sharing link.
 * Reads sharing-link attributes from DB (tamper-proof) via ?sl=<sharingLinkId>,
 * calls the verify proxy, and displays a formatted credential card.
 */

import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  ShieldCheck, ShieldX, ShieldAlert, Award, Building2,
  Calendar, User, GraduationCap, Star, Loader2, ExternalLink,
  Radio, Link2Off, HelpCircle, Blocks, AlertTriangle, FileCheck2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { API_CONFIG } from "@/config/api";
import { api } from "@/lib/api";
import { derivePublicVerifyStatus } from "./card-status";
import {
  deriveVerificationSource,
  deriveOnChainStatus,
  deriveIssuerCredibility,
} from "./card-indicators";
import { TrustTierBadge } from "@/components/trust/TrustTierBadge";
import {
  VerificationCredentialFields,
  VerificationLayersSection,
  VerificationStatusBanner,
  hasVerificationLayers,
} from "@/components/verification/VerificationStack";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SharingLinkData {
  attributes: string[];
  audience: string | null;
  purpose: string | null;
  expiresAt: string | null;
  viewCount: number;
}

interface VerifyResult {
  status?: string;
  issuanceStatus?: string;
  verificationStatus?: string;
  issuedBy?: string;
  course?: string;
  issuedAt?: string;
  isMinted?: boolean;
  isValid?: boolean;
  valid?: boolean;
  isRevoked?: boolean;
  tokenId?: number | null;
  confidence?: number;
  source?: string;
  message?: string;
  // Source transparency
  verificationSource?: string;
  fallbackReason?: string;
  evfUnavailable?: boolean;
  engineUsed?: string;
  // Issuer trust
  badgeIpfsCid?: string | null;
  signatureVerified?: boolean;
  documentIntegrityVerified?: boolean;
  onChainConfirmed?: boolean;
  trustTier?: string;
  trustScore?: number;
  issuer?: { trustTier?: string; trustScore?: number; name?: string };
}

interface SharePackage {
  w3cCredential?: {
    credentialSubject?: {
      // W3C standard fields
      name?: string;
      course?: string;
      grade?: string;
      completionDate?: string;
      certificateType?: string;
      // EduCreds backend fields (certificates.service.ts → w3c-credential.service.ts)
      studentName?: string;
      fullName?: string;
      courseName?: string;
      programName?: string;
      institutionName?: string;
      degree?: string;
      graduationDate?: string;
      institution?: string;
    };
    issuer?: { name?: string; id?: string };
    issuanceDate?: string;
    type?: string[];
  };
  badgeIpfsCid?: string | null;
  qrCode?: string;
  ipfsHash?: string;
  tokenId?: number | null;
}

// ── Attribute display names ──────────────────────────────────────────────────

const ATTR_LABELS: Record<string, string> = {
  // EduCreds backend field names
  studentName:      "Graduate Name",
  courseName:       "Programme",
  completionDate:   "Completion Date",
  institutionName:  "Issuing Institution",
  grade:            "Grade / Classification",
  certificateType:  "Credential Type",
  // Sharing wizard key names (CredentialSharingWizard.tsx)
  name:             "Graduate Name",
  degree:           "Degree / Award",
  institution:      "Issuing Institution",
  graduationDate:   "Graduation Date",
  // Additional aliases
  fullName:         "Graduate Name",
  programName:      "Programme",
};

const ALL_ATTRIBUTES     = [...new Set([
  "studentName", "courseName", "completionDate", "institutionName", "grade", "certificateType",
  "name", "degree", "institution", "graduationDate",
])];

// ── Purpose formatting ────────────────────────────────────────────────────────

function formatPurpose(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Indicator: Verification source ───────────────────────────────────────────

function VerificationSourceIndicator({ verifyResult }: { verifyResult: VerifyResult | null }) {
  if (!verifyResult) return null;
  const src = deriveVerificationSource({
    verificationSource: verifyResult.verificationSource,
    fallbackReason:     verifyResult.fallbackReason,
    evfUnavailable:     verifyResult.evfUnavailable,
    engineUsed:         verifyResult.engineUsed,
  });

  const styles = {
    live_sync:        { badge: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: <Radio className="size-3" /> },
    registry_fallback:{ badge: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: <Link2Off className="size-3" /> },
    public_registry:  { badge: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700", icon: <ShieldCheck className="size-3" /> },
    unknown:          { badge: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-500 border-neutral-200 dark:border-neutral-700", icon: <HelpCircle className="size-3" /> },
  }[src.type];

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
      <div className="mt-0.5 text-neutral-400 shrink-0">
        <Radio className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Verification Source</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[9px] font-black px-2 py-0.5 border rounded-full flex items-center gap-1 ${styles.badge}`}
          >
            {styles.icon}
            {src.label}
          </Badge>
          {src.type === "registry_fallback" && (
            <AlertTriangle className="size-3 text-amber-500" />
          )}
        </div>
        {src.type === "registry_fallback" && (
          <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-0.5 leading-relaxed">
            {src.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Indicator: On-chain status ────────────────────────────────────────────────

function OnChainStatusIndicator({
  verifyResult,
  sharePackage,
}: {
  verifyResult: VerifyResult | null;
  sharePackage: SharePackage | null;
}) {
  const tokenId = sharePackage?.tokenId ?? verifyResult?.tokenId;
  const onchain = deriveOnChainStatus({
    tokenId,
    isMinted:             verifyResult?.isMinted,
    ipfsHash:             sharePackage?.ipfsHash,
    isValid:              verifyResult?.isValid,
    valid:                verifyResult?.valid,
    status:               verifyResult?.status,
    issuanceStatus:       verifyResult?.issuanceStatus,
    verificationStatus:   verifyResult?.verificationStatus,
  });

  const styles = {
    valid_onchain:     { badge: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",     icon: <Blocks className="size-3" /> },
    valid_not_onchain: { badge: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700", icon: <Blocks className="size-3 opacity-40" /> },
    unknown:           { badge: "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-500 border-neutral-200 dark:border-neutral-700", icon: <HelpCircle className="size-3" /> },
  }[onchain.status];

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
      <div className="mt-0.5 text-neutral-400 shrink-0">
        <Blocks className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">On-chain Status</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[9px] font-black px-2 py-0.5 border rounded-full flex items-center gap-1 ${styles.badge}`}
          >
            {styles.icon}
            {onchain.label}
          </Badge>
          {onchain.status === "valid_onchain" && typeof tokenId === "number" && tokenId > 0 && (
            <span className="text-[9px] font-mono text-neutral-400">#{tokenId}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Indicator: Issuer credibility ─────────────────────────────────────────────

function IssuerCredibilityIndicator({ verifyResult }: { verifyResult: VerifyResult | null }) {
  const cred = deriveIssuerCredibility({
    trustTier:  verifyResult?.trustTier,
    trustScore: verifyResult?.trustScore,
    issuer:     verifyResult?.issuer,
  });

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
      <div className="mt-0.5 text-neutral-400 shrink-0">
        <ShieldCheck className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Issuer Credibility</p>
        <div className="mt-0.5">
          {cred.available ? (
            <TrustTierBadge
              tier={cred.tier as any}
              score={cred.score}
              showScore={cred.score != null}
              size="sm"
            />
          ) : (
            <span className="text-[10px] text-neutral-400 font-medium">Not available</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const derived = derivePublicVerifyStatus({ status });
  if (derived === "VALID") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-black text-sm">
        <ShieldCheck className="size-4" /> VERIFIED
      </div>
    );
  }
  if (derived === "REVOKED") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-black text-sm">
        <ShieldX className="size-4" /> REVOKED
      </div>
    );
  }
  if (derived === "INVALID") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-black text-sm">
        <ShieldX className="size-4" /> INVALID
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-black text-sm">
      <ShieldAlert className="size-4" /> UNDER REVIEW
    </div>
  );
}

// ── Attr icon ─────────────────────────────────────────────────────────────────

function AttrIcon({ attr }: { attr: string }) {
  const icons: Record<string, React.ReactNode> = {
    studentName:     <User className="size-4" />,
    name:            <User className="size-4" />,
    fullName:        <User className="size-4" />,
    courseName:      <GraduationCap className="size-4" />,
    degree:          <GraduationCap className="size-4" />,
    programName:     <GraduationCap className="size-4" />,
    completionDate:  <Calendar className="size-4" />,
    graduationDate:  <Calendar className="size-4" />,
    institutionName: <Building2 className="size-4" />,
    institution:     <Building2 className="size-4" />,
    grade:           <Star className="size-4" />,
    certificateType: <Award className="size-4" />,
  };
  return <>{icons[attr] ?? <Award className="size-4" />}</>;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VerifyCardPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [searchParams] = useSearchParams();

  const slId       = searchParams.get("sl");
  const audience   = searchParams.get("audience") ?? "public";
  const purposeRaw = searchParams.get("purpose") ?? "";

  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [slData, setSlData]                 = useState<SharingLinkData | null>(null);
  const [verifyResult, setVerifyResult]     = useState<VerifyResult | null>(null);
  const [sharePackage, setSharePackage]     = useState<SharePackage | null>(null);

  useEffect(() => {
    if (!certificateId) {
      setError("No certificate ID provided.");
      setLoading(false);
      return;
    }
    // v2 policy: sharing-link driven verification only
    if (!slId) {
      setError("This verification requires a valid EduCreds sharing link (missing sl=...). Please ask the credential owner to share a link.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function load() {
      try {
        // 1. Load sharing link metadata (disclosure attributes from DB)
        let resolvedSlData: SharingLinkData | null = null;
        if (slId) {
          try {
            const slRes = await fetch(
              `${API_CONFIG.CERT}/api/sharing-links/${encodeURIComponent(slId)}`,
            );
            if (slRes.ok) resolvedSlData = await slRes.json();
          } catch { /* non-fatal — disclose no attributes if lookup fails */ }
        }

        // 2. Load share package (full W3C only when a valid sharing-link id is supplied)
        let pkg: SharePackage | null = null;
        try {
          const shareQs = slId ? `?sl=${encodeURIComponent(slId)}` : '';
          const pkgRes = await fetch(
            `${API_CONFIG.CERT}/api/certificates/${encodeURIComponent(certificateId!)}/share${shareQs}`,
          );
          if (pkgRes.ok) pkg = await pkgRes.json();
        } catch { /* non-fatal */ }

        // 3. Run verification (also logs analytics with purpose + sharingLinkId)
        const verify: VerifyResult = await api.verifyCertificate(certificateId!, {
          mode: "public",
          sharingLinkId: slId ?? undefined,
          purpose: resolvedSlData?.purpose ?? purposeRaw ?? undefined,
          audience: resolvedSlData?.audience ?? audience ?? undefined,
        });

        if (!isMounted) return;
        setSlData(resolvedSlData);
        setSharePackage(pkg);
        setVerifyResult(verify);
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? "Verification failed.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [certificateId, slId, purposeRaw]);

  // ── Determine which attributes to show ────────────────────────────────────
  // v2 policy: attributes MUST come from the sharing-link record (DB).
  // Never infer disclosure permission from URL parameters or a failed link lookup.
  const displayAttrs = slData?.attributes?.filter((attr) => ALL_ATTRIBUTES.includes(attr)) ?? [];
  const purpose = slData?.purpose;

  // ── Build credential field values ─────────────────────────────────────────
  const vc = sharePackage?.w3cCredential;
  const subject = vc?.credentialSubject ?? {};

  // Resolve a date field to a readable string
  const fmtDate = (v: string | null | undefined) =>
    v ? new Date(v).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : "—";

  const resolvedName    = subject.studentName ?? subject.fullName ?? subject.name ?? "—";
  const resolvedCourse  = subject.courseName ?? subject.programName ?? subject.course ?? subject.degree ?? verifyResult?.course ?? "—";
  const resolvedDate    = subject.completionDate ?? subject.graduationDate ?? verifyResult?.issuedAt ?? null;
  const resolvedInst    = subject.institutionName ?? subject.institution ?? vc?.issuer?.name ?? verifyResult?.issuedBy ?? "—";

  const fieldValues: Record<string, string> = {
    // Backend field names
    studentName:     resolvedName,
    courseName:      resolvedCourse,
    completionDate:  fmtDate(resolvedDate),
    institutionName: resolvedInst,
    grade:           subject.grade ?? "—",
    certificateType: subject.certificateType ?? (vc?.type?.find((t: string) => t !== "VerifiableCredential") ?? "—"),
    // Sharing wizard key names — mapped to the same resolved values
    name:            resolvedName,
    degree:          resolvedCourse,
    graduationDate:  fmtDate(resolvedDate),
    institution:     resolvedInst,
    fullName:        resolvedName,
    programName:     resolvedCourse,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-medium">Verifying credential…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
        <Card className="max-w-md w-full rounded-3xl shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <ShieldX className="size-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-black text-neutral-800 dark:text-neutral-100 mb-2">
              Verification Failed
            </h1>
            <p className="text-sm text-neutral-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verifyStatus = derivePublicVerifyStatus(verifyResult);
  const badgeCid = sharePackage?.badgeIpfsCid ?? verifyResult?.badgeIpfsCid;
  // CID must be a single safe path segment; do not render arbitrary URLs supplied by a credential.
  const badgeUrl = badgeCid && /^[a-zA-Z0-9]+$/.test(badgeCid)
    ? `https://gateway.pinata.cloud/ipfs/${badgeCid}` : null;
  const isValid = verifyStatus === "VALID";
  const checkItems = [
    { label: "Issuer signature", value: verifyResult?.signatureVerified, detail: "Cryptographic signature result" },
    { label: "Document integrity", value: verifyResult?.documentIntegrityVerified, detail: "Document/hash comparison result" },
    { label: "On-chain confirmation", value: verifyResult?.onChainConfirmed, detail: "Confirmed transaction result" },
    { label: "Revocation status", value: verifyStatus === "REVOKED" ? false : isValid ? true : undefined, detail: "Based on the public verification response" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50/30 dark:from-neutral-950 dark:to-blue-950/10 px-4 py-10">
      <div className="w-full max-w-3xl mx-auto space-y-5">
        <header className="text-center space-y-4">
          <div className="size-40 md:size-56 mx-auto rounded-3xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-900">
            {badgeUrl ? <img src={badgeUrl} alt="Credential badge" className="w-full h-full object-contain" />
              : <Award className="size-20 text-blue-500" aria-hidden="true" />}
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Credential verification</h1>
          <VerificationStatusBanner
            result={verifyResult as any}
            className="text-left"
            badge={<div className="flex justify-center sm:justify-end"><StatusBadge status={verifyStatus} /></div>}
          />
        </header>

        {/* Main verification card */}
        <Card className="rounded-3xl shadow-xl border-0 overflow-hidden">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-8 pb-10 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-white/80" />
                <span className="text-white/80 text-xs font-black uppercase tracking-widest">
                  EduCreds public verification
                </span>
              </div>
              {sharePackage?.qrCode && (
                <img
                  src={sharePackage.qrCode}
                  alt="QR Code"
                  className="size-12 rounded-lg bg-white p-0.5"
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <Award className="size-14 text-white/20 absolute bottom-0 right-6 translate-y-1/2" />
            </div>
          </div>

          {/* Card body */}
          <CardContent className="p-6 pt-4 space-y-5">
            <h2 className="font-black text-lg text-neutral-900 dark:text-neutral-100">Credential details</h2>

            {/* Purpose tag */}
            {purpose && (
              <div className="text-center">
                <Badge variant="secondary" className="text-xs font-bold px-3 py-1">
                  Shared for: {formatPurpose(purpose)}
                </Badge>
              </div>
            )}

            {/* Verification indicators */}
            <div className="space-y-2">
              <VerificationSourceIndicator verifyResult={verifyResult} />
              <OnChainStatusIndicator verifyResult={verifyResult} sharePackage={sharePackage} />
              <IssuerCredibilityIndicator verifyResult={verifyResult} />
            </div>

            {/* Credential attributes */}
            {hasVerificationLayers(verifyResult as any) ? (
              <VerificationCredentialFields result={verifyResult as any} />
            ) : (
              <div className="space-y-3">
                {displayAttrs.length === 0 && <p className="text-sm text-neutral-500">Credential holder details are not available for disclosure. The holder controls what is shared.</p>}
                {displayAttrs.map((attr) => (
                  <div
                    key={attr}
                    className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50"
                  >
                    <div className="mt-0.5 text-blue-500 shrink-0">
                      <AttrIcon attr={attr} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                        {ATTR_LABELS[attr] ?? attr}
                      </p>
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100 break-words">
                        {fieldValues[attr] ?? "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Certificate ID (truncated) */}
            {certificateId && (
              <p className="text-[10px] text-neutral-400 text-center font-mono tracking-wider truncate">
                ID: {certificateId}
              </p>
            )}

            {/* Watermark */}
            <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <ShieldCheck className="size-3.5 text-blue-500" />
              <span className="text-[10px] text-neutral-400 font-bold">
                Powered by EduCreds Verification Network
              </span>
            </div>
          </CardContent>
        </Card>

        {hasVerificationLayers(verifyResult as any) ? (
          <VerificationLayersSection result={verifyResult as any} />
        ) : (
          <Card className="rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <CardContent className="p-5">
              <details>
                <summary className="cursor-pointer font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2"><FileCheck2 className="size-5 text-blue-600" /> Verification checks</summary>
                <p className="text-xs text-neutral-500 mt-2">Only checks explicitly reported by the verification service are marked as passed. An IPFS reference or token ID alone is not proof of integrity or blockchain confirmation.</p>
                <div className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                  {checkItems.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span><span className="font-semibold">{item.label}</span><span className="block text-xs text-neutral-500">{item.detail}</span></span>
                    <span className={item.value === true ? "text-emerald-700 dark:text-emerald-400" : item.value === false ? "text-red-700 dark:text-red-400" : "text-neutral-500"}>{item.value === true ? "Passed" : item.value === false ? "Failed" : "Not available"}</span>
                  </div>)}
                </div>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Full verify link */}
        <div className="text-center">
          <Link
            to="/verify"
            className="text-xs text-neutral-400 hover:text-blue-500 transition-colors"
          >
            Verify another credential →
          </Link>
        </div>
      </div>
    </div>
  );
}
