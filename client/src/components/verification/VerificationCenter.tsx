/**
 * VerificationCenter — Phase 2 (Tiered Engine Architecture)
 *
 * Three verification engines, each with distinct value:
 *
 *   PUBLIC LAYER (Basic)
 *     - Anonymous, no login required
 *     - Returns: existence + issuer + type + issued year + revocation status
 *     - Engine badge: gray "Public"
 *
 *   EVF PROFESSIONAL (Starter 30-day trial / Pro)
 *     - Authenticated, full cryptographic evidence chain
 *     - Returns: full credential fields + trust tier + evidence steps
 *     - Engine badge: blue "EVF Verified"
 *     - No silent fallback to Public — explicit downgrade offered
 *
 *   EVF + AI INTELLIGENCE (Enterprise)
 *     - EVF + AI risk scoring + anomaly flags + recommendation
 *     - Returns: all EVF fields + aiScore + aiFlags[] + recommendation
 *     - Engine badge: purple "EVF + AI"
 *     - Starter/Pro: AI panel shown as LOCKED PREVIEW (tease Enterprise)
 */

import { useState, useRef, useCallback, Fragment } from "react";
import {
  parseCsv,
  extractLookupValue,
  buildRowResults,
  updateRowResult,
  generateVerificationReport,
  generateHtmlReport,
  normalizeVerificationResponse,
  summarizeResults,
  getFieldLabel,
  getFailureReasonLabel,
  type RowResult,
  type NormalizedVerificationResult,
  type VerificationStatus as BulkVerificationStatus,
  type VerificationSource as BulkVerificationSource,
} from "@/lib/csvParser";
import {
  Link,
  QrCode,
  Hash,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Download,
  FileText,
  Loader2,
  Building2,
  User,
  GraduationCap,
  Calendar,
  BadgeCheck,
  ExternalLink,
  Lock,
  Zap,
  Brain,
  Globe,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Upload,
  ArrowRight,
  Radio,
  Link2Off,
  HelpCircle,
  Blocks,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Printer,
  Filter,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { TrustTierBadge, type TrustTier } from "@/components/trust/TrustTierBadge";
import { format } from "date-fns";
import {
  deriveVerificationSource,
  deriveOnChainStatus,
  deriveIssuerCredibility,
} from "@/pages/verify/card-indicators";
import {
  VerificationCredentialFields,
  VerificationLayersSection,
  VerificationStatusBanner,
  deriveVerificationOutcome,
  getVerificationStatusPresentation,
  hasVerificationLayers,
} from "@/components/verification/VerificationStack";

// ── Types ──────────────────────────────────────────────────────────────────────

type InputMethod = "link" | "qr" | "id";
type VerificationEngine = "public" | "evf" | "evf_ai";

interface EvidenceStep {
  label: string;
  status: "pending" | "checking" | "pass" | "fail";
}

interface VerifiedCredential {
  studentName?: string;
  courseName?: string;
  grade?: string;
  institutionName?: string;
  issuedAt?: string;
  tokenId?: string | number;
  ipfsHash?: string;
  isValid?: boolean;
  isRevoked?: boolean;
  status?: string;
  trustScore?: number;
  trustTier?: TrustTier;
  // EVF + AI fields
  aiScore?: number;
  aiFlags?: string[];
  recommendation?: "proceed" | "review" | "reject";
  engineUsed?: VerificationEngine;
  // Source transparency fields
  verificationSource?: "evf" | "public" | "fallback";
  fallbackReason?: string;
  evfUnavailable?: boolean;
}

// BulkResult replaced by summarizeResults() from csvParser

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeCredential(data: any): VerifiedCredential {
  const legacy = data?.certificate ?? {};
  const isPublicShape = data?.credentialType !== undefined && data?.issuedYear !== undefined;
  return {
    ...legacy,
    ...data,
    studentName:     data?.holder?.name          ?? legacy.studentName     ?? data?.studentName,
    institutionName: data?.issuer?.name           ?? legacy.institutionName ?? data?.institutionName
                     ?? (isPublicShape ? data?.institutionName : undefined),
    courseName:      data?.credential?.courseName ?? legacy.courseName     ?? data?.courseName
                     ?? (isPublicShape ? data?.credentialType : undefined),
    grade:           data?.credential?.grade      ?? legacy.grade          ?? data?.grade,
    issuedAt:        data?.credential?.issuedAt   ?? legacy.issuedAt       ?? data?.issuedAt
                     ?? (isPublicShape && data?.issuedYear ? `${data.issuedYear}-01-01T00:00:00Z` : undefined),
    isValid:         data?.isValid                ?? (data?.status === "verified" || data?.status === "issued" ? true : undefined),
    isRevoked:       data?.isRevoked              ?? (data?.status === "revoked" ? true : undefined),
    tokenId:         data?.blockchain?.tokenId    ?? legacy.tokenId        ?? data?.tokenId,
    trustScore:      data?.issuer?.trustScore     ?? data?.trustScore,
    trustTier:       data?.issuer?.trustTier      ?? data?.trustTier,
    // Support both flat (aiScore) and nested (ai.score) shapes from the backend.
    // The backend now emits both, but older responses or direct EVF calls may
    // only have the nested shape; always prefer the flat top-level key first.
    aiScore:         data?.aiScore ?? data?.ai?.score,
    aiFlags:         data?.aiFlags ?? data?.ai?.flags,
    recommendation:  data?.recommendation ?? data?.ai?.recommendation,
    engineUsed:      data?.engineUsed,
    // Source transparency — passed through directly from backend
    verificationSource: data?.verificationSource,
    fallbackReason:     data?.fallbackReason,
    evfUnavailable:     data?.evfUnavailable,
  };
}

function deriveStatus(data: any): "verified" | "revoked" | "not_found" | "pending" {
  const vc = normalizeCredential(data);
  // Revocation always wins — check before any isValid / tokenId shortcut
  // to avoid a "verified" display on a revoked credential that also has a tokenId.
  if (
    vc.isRevoked === true ||
    data?.status === "revoked" ||
    data?.isRevoked === true
  ) return "revoked";
  // Explicit valid signals
  if (data?.isValid === true || data?.valid === true) return "verified";
  if (data?.status === "issued" || data?.status === "verified" || data?.status === "VALID") return "verified";
  if (vc.isValid) return "verified";
  // Presence of structured content implies a found credential
  if (vc.tokenId || vc.courseName || vc.institutionName || data?.credentialType) return "verified";
  return "not_found";
}

const STATUS_CONFIG = {
  verified:  { label: "Verified",        icon: CheckCircle,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40",  border: "border-emerald-200 dark:border-emerald-800" },
  revoked:   { label: "Revoked",          icon: XCircle,       color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-950/40",           border: "border-red-200 dark:border-red-800" },
  not_found: { label: "Not found",        icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-950/40",       border: "border-amber-200 dark:border-amber-800" },
  pending:   { label: "Pending issuance", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-950/40",       border: "border-amber-200 dark:border-amber-800" },
};

// Engine config for display
const ENGINE_CONFIG: Record<VerificationEngine, {
  label: string; sublabel: string; badge: string; badgeClass: string; depth: number; depthLabel: string;
}> = {
  public: {
    label: "Public Layer",
    sublabel: "Basic",
    badge: "PUBLIC",
    badgeClass: "bg-neutral-100 text-neutral-500 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400",
    depth: 1,
    depthLabel: "Basic",
  },
  evf: {
    label: "EVF Professional",
    sublabel: "Cryptographic evidence chain",
    badge: "EVF VERIFIED",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400",
    depth: 2,
    depthLabel: "Professional",
  },
  evf_ai: {
    label: "EVF + AI Intelligence",
    sublabel: "Risk scoring + anomaly detection",
    badge: "EVF + AI",
    badgeClass: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400",
    depth: 3,
    depthLabel: "Intelligence",
  },
};

const EVIDENCE_STEPS: EvidenceStep[] = [
  { label: "Credential found",           status: "pending" },
  { label: "Issuer authenticated",       status: "pending" },
  { label: "Cryptographic proof valid",  status: "pending" },
  { label: "Not revoked",                status: "pending" },
  { label: "Institution trust verified", status: "pending" },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

/**
 * FallbackSourceBanner — displayed when the verification fell back to the
 * public registry instead of going through EVF. Informs the user that EVF
 * was unavailable and the result is less authoritative.
 */
function FallbackSourceBanner({
  verificationSource,
  fallbackReason,
  evfUnavailable,
}: {
  verificationSource?: string;
  fallbackReason?: string;
  evfUnavailable?: boolean;
}) {
  if (!evfUnavailable && verificationSource !== "fallback") return null;

  return (
    <div
      role="status"
      aria-label="Verification source notice"
      className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50"
      data-testid="fallback-source-banner"
    >
      <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-amber-900 dark:text-amber-300 mb-0.5">
          EVF unavailable — result from registry fallback
        </p>
        <p className="text-xs text-amber-700/80 dark:text-amber-400/70 leading-relaxed">
          The Evidence Verification Framework could not be reached. This result was retrieved
          from the credential registry and may have reduced confidence compared to a full EVF check.
          {fallbackReason ? ` Reason: ${fallbackReason}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
        Registry Fallback
      </span>
    </div>
  );
}

function EvidenceDisplay({ steps }: { steps: EvidenceStep[] }) {
  return (
    <div className="space-y-2 my-4">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3 py-2 px-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
          {step.status === "checking" && <Loader2 className="size-4 text-blue-500 animate-spin shrink-0" />}
          {step.status === "pass"     && <CheckCircle className="size-4 text-emerald-500 shrink-0" />}
          {step.status === "fail"     && <XCircle className="size-4 text-red-500 shrink-0" />}
          {step.status === "pending"  && <div className="size-4 rounded-full border-2 border-neutral-300 dark:border-neutral-600 shrink-0" />}
          <span className={cn(
            "text-sm font-medium",
            step.status === "pass"     ? "text-emerald-700 dark:text-emerald-300" :
            step.status === "fail"     ? "text-red-700 dark:text-red-300" :
            step.status === "checking" ? "text-blue-700 dark:text-blue-300" :
            "text-neutral-400 dark:text-neutral-500"
          )}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

// Depth meter — shows Basic / Professional / Intelligence breadcrumb
function DepthMeter({ engine }: { engine: VerificationEngine }) {
  const levels: { key: VerificationEngine; label: string }[] = [
    { key: "public",  label: "Basic" },
    { key: "evf",     label: "Professional" },
    { key: "evf_ai",  label: "Intelligence" },
  ];
  const idx = levels.findIndex(l => l.key === engine);
  return (
    <div className="flex items-center gap-1">
      {levels.map((l, i) => (
        <div key={l.key} className="flex items-center gap-1">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
            i <= idx ? "bg-primary/10 text-primary" : "text-neutral-300 dark:text-neutral-600"
          )}>{l.label}</span>
          {i < levels.length - 1 && <span className={cn("text-[10px]", i < idx ? "text-primary/40" : "text-neutral-200 dark:text-neutral-700")}>›</span>}
        </div>
      ))}
    </div>
  );
}

// AI Intelligence panel — shown for evf_ai engine; locked on Starter/Pro
function AIPanel({ data, isEnterprise }: { data: any; isEnterprise: boolean }) {
  const vc = normalizeCredential(data);
  const score = vc.aiScore;
  const flags: string[] = vc.aiFlags ?? [];
  const rec = vc.recommendation;

  // Detect unconfigured AI state: locked=false but status='unconfigured' or score is null
  const aiStatus: string | undefined = data?.ai?.status;
  const isUnconfigured = !data?.ai?.locked && (aiStatus === 'unconfigured' || (score === null || score === undefined));

  const riskColor = score === undefined || score === null ? "text-neutral-400" :
    score >= 70 ? "text-emerald-600" :
    score >= 40 ? "text-amber-600" :
    "text-red-600";

  const recConfig = {
    proceed: { icon: ThumbsUp,    label: "Proceed",       cls: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400" },
    review:  { icon: MinusCircle, label: "Manual Review", cls: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400" },
    reject:  { icon: ThumbsDown,  label: "Reject",        cls: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400" },
  };

  return (
    <div className="relative rounded-2xl border border-purple-200 dark:border-purple-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-900/50">
        <Brain className="size-4 text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-black uppercase tracking-widest text-purple-700 dark:text-purple-400">AI Risk Intelligence</span>
        <Badge className="ml-auto text-[10px] font-black border bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300">Enterprise</Badge>
      </div>

      {isEnterprise ? (
        <div className="p-5 space-y-5">
          {/* AI scoring not configured state */}
          {isUnconfigured ? (
            <div
              role="status"
              aria-label="AI scoring not configured"
              data-testid="ai-unconfigured"
              className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <MinusCircle className="size-5 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-neutral-600 dark:text-neutral-300 mb-0.5">
                  AI scoring not configured
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  The AI risk scoring service is not yet active on this deployment.
                  Cryptographic verification via EVF is still fully operational.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex flex-col items-center justify-center">
                  <span className={cn("text-2xl font-black leading-none", riskColor)}>{score !== undefined && score !== null ? score : "—"}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mt-0.5">/ 100</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">AI Risk Score</p>
                  <p className={cn("text-sm font-bold", riskColor)}>
                    {score === undefined || score === null ? "Unavailable" : score >= 70 ? "Low Risk" : score >= 40 ? "Medium Risk" : "High Risk"}
                  </p>
                </div>
              </div>

              {/* Flags */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Anomaly Flags</p>
                {flags.length === 0 ? (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                    <CheckCircle className="size-4" /> No anomalies detected
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                        <AlertOctagon className="size-4 shrink-0 mt-0.5 text-amber-500" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recommendation */}
              {rec && (() => {
                const cfg = recConfig[rec as keyof typeof recConfig];
                const RecIcon = cfg.icon;
                return (
                  <div className={cn("flex items-center gap-3 p-4 rounded-xl border font-bold text-sm", cfg.cls)}>
                    <RecIcon className="size-5 shrink-0" />
                    Recommendation: <span className="font-black">{cfg.label}</span>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      ) : (
        /* LOCKED PREVIEW for Starter / Pro */
        <div className="p-5 space-y-4">
          {/* Blurred placeholder rows */}
          <div className="space-y-3 select-none pointer-events-none">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center border border-neutral-200 dark:border-neutral-700">
                <span className="text-2xl font-black text-neutral-300 dark:text-neutral-600 blur-sm">87</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-600 mt-0.5">/ 100</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 w-20 rounded-full bg-neutral-200 dark:bg-neutral-700 blur-sm" />
                <div className="h-2 w-14 rounded-full bg-neutral-100 dark:bg-neutral-800 blur-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 w-24 rounded-full bg-neutral-200 dark:bg-neutral-700 blur-sm" />
              <div className="h-3 w-48 rounded-full bg-neutral-100 dark:bg-neutral-800 blur-sm" />
              <div className="h-3 w-40 rounded-full bg-neutral-100 dark:bg-neutral-800 blur-sm" />
            </div>
          </div>

          {/* Lock overlay */}
          <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-950/20 p-4 flex items-start gap-3">
            <div className="size-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center shrink-0">
              <Lock className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-purple-900 dark:text-purple-300 mb-0.5">AI signals locked</p>
              <p className="text-xs text-purple-700/70 dark:text-purple-400/70">
                AI risk scoring, anomaly flags and recommendations are available on the Enterprise plan.
              </p>
            </div>
            <a href="/verifier/billing/plan" className="shrink-0">
              <Button size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
                <Zap className="size-3" /> Upgrade
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Indicator sub-components (parity with public /verify card) ─────────────────

function VerifSourceIndicator({ vc }: { vc: VerifiedCredential }) {
  const src = deriveVerificationSource({
    verificationSource: vc.verificationSource,
    fallbackReason:     vc.fallbackReason,
    evfUnavailable:     vc.evfUnavailable,
    engineUsed:         vc.engineUsed,
  });

  const styles = {
    live_sync:         { cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800", icon: <Radio className="size-3" /> },
    registry_fallback: { cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800", icon: <Link2Off className="size-3" /> },
    public_registry:   { cls: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700", icon: <ShieldCheck className="size-3" /> },
    unknown:           { cls: "bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700", icon: <HelpCircle className="size-3" /> },
  }[src.type];

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50">
      <div className="size-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center shrink-0">
        <Radio className="size-4 text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Verification Source</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge className={cn("text-[9px] font-black px-2 py-0.5 border rounded-full flex items-center gap-1", styles.cls)}>
            {styles.icon}{src.label}
          </Badge>
          {src.type === "registry_fallback" && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{src.description}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function OnChainIndicator({ vc, rawData }: { vc: VerifiedCredential; rawData: any }) {
  const tokenId = vc.tokenId;
  const onchain = deriveOnChainStatus({
    tokenId,
    isMinted:           rawData?.isMinted,
    ipfsHash:           vc.ipfsHash,
    isValid:            vc.isValid,
    status:             rawData?.status,
    issuanceStatus:     rawData?.issuanceStatus,
    verificationStatus: rawData?.verificationStatus,
  });

  const styles = {
    valid_onchain:     { cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",     icon: <Blocks className="size-3" /> },
    valid_not_onchain: { cls: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700", icon: <Blocks className="size-3 opacity-40" /> },
    unknown:           { cls: "bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700", icon: <HelpCircle className="size-3" /> },
  }[onchain.status];

  const tokenNum = tokenId != null ? Number(tokenId) : NaN;
  const hasPositiveToken = !isNaN(tokenNum) && tokenNum > 0;

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50">
      <div className="size-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center shrink-0">
        <Blocks className="size-4 text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">On-chain Status</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge className={cn("text-[9px] font-black px-2 py-0.5 border rounded-full flex items-center gap-1", styles.cls)}>
            {styles.icon}{onchain.label}
          </Badge>
          {hasPositiveToken && (
            <span className="text-[10px] font-mono text-neutral-400">#{tokenId}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function IssuerCredibilityIndicator({ vc }: { vc: VerifiedCredential }) {
  const cred = deriveIssuerCredibility({
    trustTier:  vc.trustTier,
    trustScore: vc.trustScore,
  });

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50">
      <div className="size-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center shrink-0">
        <ShieldCheck className="size-4 text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Issuer Credibility</p>
        <div className="mt-1">
          {cred.available ? (
            <TrustTierBadge
              tier={cred.tier as TrustTier}
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

// ── Credential result card ─────────────────────────────────────────────────────

function CredentialResultCard({
  data,
  engine,
  isEnterprise,
  onDowngrade,
}: {
  data: any;
  engine: VerificationEngine;
  isEnterprise: boolean;
  onDowngrade?: () => void;
}) {
  const vc = normalizeCredential(data);
  const outcome = deriveVerificationOutcome(data);
  const outcomePresentation = getVerificationStatusPresentation(outcome);
  const engCfg = ENGINE_CONFIG[engine];
  const showLayers = hasVerificationLayers(data);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Engine badge + depth meter */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={cn("text-[10px] font-black px-3 py-1", engCfg.badgeClass)}>
          {engCfg.badge}
        </Badge>
        <DepthMeter engine={engine} />
      </div>

      {/* Fallback source transparency banner */}
      <FallbackSourceBanner
        verificationSource={vc.verificationSource}
        fallbackReason={vc.fallbackReason}
        evfUnavailable={vc.evfUnavailable}
      />

      <VerificationStatusBanner
        result={data}
        badge={outcome === "VERIFIED" && (vc.trustScore || vc.trustTier)
          ? <TrustTierBadge tier={vc.trustTier} score={vc.trustScore} size="sm" />
          : undefined}
      />

      <VerificationCredentialFields result={data} />

      {/* Three new indicators (parity with public /verify card) */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Verification Overview</p>
        <VerifSourceIndicator vc={vc} />
        <OnChainIndicator vc={vc} rawData={data} />
        <IssuerCredibilityIndicator vc={vc} />
      </div>

      {showLayers ? (
        <VerificationLayersSection result={data} />
      ) : (engine === "evf" || engine === "evf_ai") ? (
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Verification Evidence</p>
          <div className="space-y-2">
            {[
              { label: "Credential found",           pass: true },
              { label: "Issuer authenticated",       pass: true },
              { label: "Cryptographic proof valid",  pass: outcome !== "NOT_FOUND" },
              { label: "Revocation status checked",  pass: outcome !== "REVOKED", fail: outcome === "REVOKED" },
              { label: "Institution trust verified", pass: outcome === "VERIFIED" },
            ].map((e) => (
              <div key={e.label} className="flex items-center gap-3 py-2 px-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                {e.fail
                  ? <XCircle className="size-4 text-red-500 shrink-0" />
                  : e.pass
                    ? <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                }
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Public-only: CTA to sign in for EVF */}
      {engine === "public" && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
          <ShieldCheck className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-black text-blue-900 dark:text-blue-300 mb-0.5">Are you an employer or agency?</p>
            <p className="text-xs text-blue-700/70 dark:text-blue-400/70">Sign in for EVF cryptographic verification with full evidence chain and trust scoring.</p>
          </div>
          <a href="/verifier/login">
            <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs gap-1.5 shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100">
              Sign in <ArrowRight className="size-3" />
            </Button>
          </a>
        </div>
      )}

      {/* EVF + AI panel (enterprise or locked preview) */}
      {engine === "evf_ai" && (
        <AIPanel data={data} isEnterprise={isEnterprise} />
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2"
          onClick={() => {
            const report = `EduCreds Verification Report\nEngine: ${engCfg.label}\nStatus: ${outcomePresentation.label}\nGraduate: ${vc.studentName ?? "—"}\nCredential: ${vc.courseName ?? "—"}\nInstitution: ${vc.institutionName ?? "—"}\nIssued: ${vc.issuedAt ? format(new Date(vc.issuedAt), "MMM d, yyyy") : "—"}`;
            const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
            const a = document.createElement("a"); a.href = url; a.download = "verification-report.txt"; a.click(); URL.revokeObjectURL(url);
          }}
        >
          <Download className="size-4" /> Download Report
        </Button>
        {vc.ipfsHash && (
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open(`https://ipfs.io/ipfs/${vc.ipfsHash}`, "_blank")}>
            <ExternalLink className="size-4" /> View Document
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Bulk verifier — overhauled with explainable results ────────────────────────

/** Status chip for bulk result rows */
function BulkStatusChip({ status }: { status: BulkVerificationStatus }) {
  const cfg: Record<BulkVerificationStatus, { label: string; cls: string; icon: typeof CheckCircle }> = {
    verified: { label: "Verified",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400", icon: CheckCircle },
    failed:   { label: "Failed",        cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",                     icon: XCircle },
    review:   { label: "Review",        cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",           icon: AlertTriangle },
    pending:  { label: "Pending",       cls: "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400",     icon: Loader2 },
  };
  const c = cfg[status] ?? cfg.pending;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border", c.cls)}>
      <Icon className={cn("size-3", status === "pending" ? "animate-spin" : "")} />
      {c.label}
    </span>
  );
}

/** Source badge for bulk result rows */
function SourceBadge({ source }: { source: BulkVerificationSource }) {
  const cfg: Record<BulkVerificationSource, { label: string; cls: string }> = {
    evf:      { label: "EVF",      cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400" },
    public:   { label: "Public",   cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400" },
    fallback: { label: "Fallback", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400" },
    unknown:  { label: "—",        cls: "bg-neutral-50 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500" },
  };
  const c = cfg[source] ?? cfg.unknown;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border", c.cls)}>
      {c.label}
    </span>
  );
}

/** Row drilldown — expanded detail view for a single bulk row */
function BulkRowDrilldown({ row }: { row: RowResult<NormalizedVerificationResult> }) {
  const nr = row.result;
  if (!nr) return <p className="text-xs text-neutral-400 p-4">No data available</p>;

  return (
    <div className="p-4 space-y-4 bg-neutral-50/80 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-700">
      {/* Failure explanation */}
      {nr.failureExplanation && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50">
          <Info className="size-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-widest">
              {getFailureReasonLabel(nr.failureReason)}
            </p>
            <p className="text-xs text-red-700/80 dark:text-red-400/70 mt-0.5">{nr.failureExplanation}</p>
          </div>
        </div>
      )}

      {/* Fallback notice */}
      {nr.fallbackReason && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-800 dark:text-amber-300">Registry Fallback</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/70 mt-0.5">{nr.fallbackReason}</p>
          </div>
        </div>
      )}

      {/* Credential fields: verified vs hidden */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Eye className="size-3" /> Fields Verified ({nr.verifiedFields.length})
          </p>
          {nr.verifiedFields.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">No fields disclosed</p>
          ) : (
            <div className="space-y-1.5">
              {nr.verifiedFields.map((field) => {
                const val = nr.credential[field as keyof typeof nr.credential];
                return (
                  <div key={field} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
                    <CheckCircle className="size-3 text-emerald-500 shrink-0" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest w-20 shrink-0">{getFieldLabel(field)}</span>
                    <span className="text-xs text-neutral-800 dark:text-neutral-200 truncate">{String(val ?? '—')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <EyeOff className="size-3" /> Fields Hidden ({nr.hiddenFields.length})
          </p>
          {nr.hiddenFields.length === 0 ? (
            <p className="text-xs text-emerald-600 font-medium">All fields disclosed ✓</p>
          ) : (
            <div className="space-y-1.5">
              {nr.hiddenFields.map((field) => (
                <div key={field} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
                  <EyeOff className="size-3 text-neutral-400 shrink-0" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{getFieldLabel(field)}</span>
                  <span className="text-xs text-neutral-400 italic ml-auto">Not disclosed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verification source detail */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700">
        <Radio className="size-4 text-blue-500 shrink-0" />
        <div>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Verification Source</p>
          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">
            {nr.verificationSource === 'evf' ? 'Evidence Verification Framework (EVF) — cryptographic proof' :
             nr.verificationSource === 'public' ? 'Public registry — existence check only' :
             nr.verificationSource === 'fallback' ? 'Database fallback — EVF was unavailable' :
             'Unknown source'}
            {nr.engineUsed && nr.engineUsed !== nr.verificationSource && ` (engine: ${nr.engineUsed})`}
          </p>
        </div>
      </div>
    </div>
  );
}

function BulkVerifier() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [rowResults, setRowResults] = useState<RowResult<NormalizedVerificationResult>[]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<BulkVerificationStatus | "all">("all");

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) return;
    setFile(f);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  };

  const run = async () => {
    if (!file) return;
    setLoading(true); setProgress(0); setDone(false); setExpandedRow(null); setStatusFilter("all");
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    setParsedHeaders(headers);
    let rowState = buildRowResults(rows);

    for (let i = 0; i < rows.length; i++) {
      const lookupValue = extractLookupValue(rows[i]);
      if (lookupValue) {
        try {
          let res: any;
          let verifyError: string | undefined;
          try {
            res = await api.verifyCertificate(lookupValue, { mode: "api" });
            if (res?.error?.includes("unreachable") || res?.error?.includes("ECONNREFUSED")) throw new Error(res.error);
          } catch (evfErr: any) {
            // EVF path failed — try public fallback
            verifyError = evfErr?.message;
            try {
              res = await api.verifyPublicCertificate(lookupValue);
            } catch (pubErr: any) {
              // Both failed
              const normalized = normalizeVerificationResponse(null, pubErr?.message ?? verifyError ?? "Verification failed");
              rowState = updateRowResult(rowState, i + 1, { status: normalized.status, result: normalized, error: normalized.failureExplanation ?? undefined });
              setRowResults([...rowState]);
              setProgress(Math.round(((i + 1) / rows.length) * 100));
              continue;
            }
          }
          const normalized = normalizeVerificationResponse(res, verifyError);
          rowState = updateRowResult(rowState, i + 1, { status: normalized.status, result: normalized });
        } catch (err: any) {
          const normalized = normalizeVerificationResponse(null, err?.message ?? "Unknown error");
          rowState = updateRowResult(rowState, i + 1, { status: normalized.status, result: normalized, error: err?.message ?? "Unknown error" });
        }
      } else {
        const normalized = normalizeVerificationResponse(null, "No credential ID or share link found in row");
        rowState = updateRowResult(rowState, i + 1, { status: 'review', result: normalized, error: "No credential ID or share link found in row" });
      }
      setRowResults([...rowState]);
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }
    setRowResults(rowState);
    setDone(true);
    setLoading(false);
  };

  const downloadCsv = () => {
    if (rowResults.length === 0) return;
    const csv = generateVerificationReport(parsedHeaders, rowResults);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `educreds-bulk-verification-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const downloadHtml = () => {
    if (rowResults.length === 0) return;
    const html = generateHtmlReport(rowResults, { batchName: file?.name ?? 'Bulk Verification Report' });
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a"); a.href = url; a.download = `educreds-bulk-verification-${new Date().toISOString().slice(0, 10)}.html`; a.click(); URL.revokeObjectURL(url);
  };

  const openPrintableReport = () => {
    if (rowResults.length === 0) return;
    const html = generateHtmlReport(rowResults, { batchName: file?.name ?? 'Bulk Verification Report' });
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const summary = summarizeResults(rowResults);
  const filteredRows = statusFilter === "all" ? rowResults : rowResults.filter(r => r.status === statusFilter);
  const passRate = summary.total > 0 ? Math.round((summary.verified / summary.total) * 100) : 0;

  // Results view (after at least 1 row processed)
  if (done || rowResults.some(r => r.status !== 'pending')) {
    return (
      <div className="space-y-6 animate-in fade-in" data-testid="bulk-results">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Verified",     value: summary.verified, color: "text-emerald-600", border: "border-l-emerald-500" },
            { label: "Failed",       value: summary.failed,   color: "text-red-600",     border: "border-l-red-500" },
            { label: "Review",       value: summary.review,   color: "text-amber-600",   border: "border-l-amber-500" },
            { label: "Pass Rate",    value: `${passRate}%`,   color: "text-blue-600",    border: "border-l-blue-500" },
          ].map((s) => (
            <Card key={s.label} className={cn("rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 border-l-4", s.border)}>
              <CardContent className="p-4 text-center">
                <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-neutral-500 text-center">
          {summary.total} total candidates · {done ? "Complete" : `${progress}% processed`}
          {loading && <Loader2 className="inline-block size-3 animate-spin ml-2" />}
        </p>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-neutral-400" />
          {(["all", "verified", "failed", "review"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                statusFilter === f
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400"
              )}
            >
              {f === "all" ? `All (${summary.total})` :
               f === "verified" ? `Verified (${summary.verified})` :
               f === "failed" ? `Failed (${summary.failed})` :
               `Review (${summary.review})`}
            </button>
          ))}
        </div>

        {/* Results table */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/80">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-10">#</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 min-w-[160px]">Credential ID</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-24">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-20">Source</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">Reason</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">Institution</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-16">Fields</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const nr = row.result;
                  const isExpanded = expandedRow === row.rowIndex;
                  return (
                    <Fragment key={row.rowIndex}>
                      <tr
                        className={cn(
                          "border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 cursor-pointer transition-colors",
                          isExpanded && "bg-neutral-50/80 dark:bg-neutral-800/40"
                        )}
                        onClick={() => setExpandedRow(isExpanded ? null : row.rowIndex)}
                      >
                        <td className="px-4 py-3 text-xs text-neutral-400 tabular-nums">{row.rowIndex}</td>
                        <td className="px-4 py-3 text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]" title={row.lookupValue ?? '—'}>
                          {row.lookupValue ?? <span className="text-neutral-400 italic">missing</span>}
                        </td>
                        <td className="px-4 py-3"><BulkStatusChip status={row.status} /></td>
                        <td className="px-4 py-3"><SourceBadge source={nr?.verificationSource ?? 'unknown'} /></td>
                        <td className="px-4 py-3 text-xs text-neutral-500 truncate max-w-[180px]" title={nr?.failureExplanation ?? row.error ?? ''}>
                          {nr?.failureReason ? getFailureReasonLabel(nr.failureReason) : row.error ? row.error.slice(0, 60) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-700 dark:text-neutral-300 truncate max-w-[140px]">
                          {nr?.credential?.institutionName ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          {nr ? (
                            <span className="text-[10px] font-bold text-neutral-500">
                              <span className="text-emerald-600">{nr.verifiedFields.length}</span>
                              /
                              <span className="text-neutral-400">{nr.verifiedFields.length + nr.hiddenFields.length}</span>
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-neutral-400">
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <BulkRowDrilldown row={row} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-400">
                      No results match the selected filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export actions */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button className="rounded-xl gap-2 font-bold" onClick={downloadCsv}>
            <Download className="size-4" /> Download CSV
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 font-bold" onClick={downloadHtml}>
            <FileText className="size-4" /> Download HTML Report
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 font-bold" onClick={openPrintableReport}>
            <Printer className="size-4" /> Print Report
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => { setDone(false); setFile(null); setProgress(0); setRowResults([]); setParsedHeaders([]); setExpandedRow(null); setStatusFilter("all"); }}>
            Verify Another Batch
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        className={cn("border-2 border-dashed rounded-3xl cursor-pointer transition-all",
          dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-neutral-200 dark:border-neutral-700 hover:border-blue-400 bg-neutral-50 dark:bg-neutral-900"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <CardContent className="py-12 text-center space-y-3">
          <div className="size-14 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto">
            <Upload className="size-7 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="font-bold text-neutral-700 dark:text-neutral-200">{file ? file.name : "Drop candidate CSV here"}</p>
          <p className="text-xs text-neutral-400">Required column: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">credential_id</code> or <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">share_link</code></p>
        </CardContent>
      </Card>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-2"><Loader2 className="size-3 animate-spin" />Verifying candidates…</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 rounded-full" />
        </div>
      )}
      <Button className="w-full rounded-xl font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={!file || loading} onClick={run}>
        {loading ? <><Loader2 className="size-4 animate-spin" />Verifying…</> : <><ShieldCheck className="size-4" />Verify Batch</>}
      </Button>
    </div>
  );
}

// ── Engine selector ────────────────────────────────────────────────────────────

function EngineSelector({
  selected,
  plan,
  isAuthenticated,
  onChange,
}: {
  selected: VerificationEngine;
  plan: string;
  isAuthenticated: boolean;
  onChange: (e: VerificationEngine) => void;
}) {
  const isEnterprise = plan === "Enterprise";
  const isAnyPaid = isAuthenticated && plan !== "Free" && plan !== "Starter (30-day trial)";

  const engines: {
    key: VerificationEngine;
    label: string;
    sub: string;
    available: boolean;
    teased?: boolean;
  }[] = [
    {
      key: "public",
      label: "Public Layer",
      sub: "Existence, issuer, type, issued year",
      available: true,
    },
    {
      key: "evf",
      label: "EVF Professional",
      sub: "Full cryptographic evidence chain",
      available: isAuthenticated,
    },
    {
      key: "evf_ai",
      label: "EVF + AI Intelligence",
      sub: isEnterprise ? "Risk scoring + anomaly detection" : "AI signals locked — Enterprise only",
      available: isAuthenticated && (isAnyPaid || isEnterprise || plan === "Starter (30-day trial)"),
      teased: !isEnterprise,
    },
  ];

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">Verification Engine</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {engines.map((e) => {
          const isSelected = selected === e.key;
          const cfg = ENGINE_CONFIG[e.key];
          return (
            <button
              key={e.key}
              disabled={!e.available}
              onClick={() => e.available && onChange(e.key)}
              className={cn(
                "relative flex flex-col items-start gap-1 p-3 rounded-2xl border-2 transition-all text-left",
                isSelected
                  ? e.key === "evf_ai"
                    ? "border-purple-400 bg-purple-50 dark:bg-purple-950/20"
                    : e.key === "evf"
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                      : "border-neutral-400 bg-neutral-50 dark:bg-neutral-800"
                  : e.available
                    ? "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                    : "border-neutral-100 dark:border-neutral-800 opacity-40 cursor-not-allowed"
              )}
            >
              {e.teased && !isEnterprise && (
                <span className="absolute top-2 right-2">
                  <Lock className="size-3 text-purple-400" />
                </span>
              )}
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isSelected
                  ? e.key === "evf_ai" ? "text-purple-700 dark:text-purple-300"
                    : e.key === "evf" ? "text-blue-700 dark:text-blue-300"
                    : "text-neutral-700 dark:text-neutral-300"
                  : "text-neutral-500"
              )}>{e.label}</span>
              <span className="text-[10px] text-neutral-400 leading-tight">{e.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export interface VerificationCenterProps {
  mode?: "single" | "bulk" | "both";
  plan?: string;           // from parent (verifier page already reads subscriptionPlan)
  isAuthenticated?: boolean;
}

export function VerificationCenter({ mode = "both", plan = "Free", isAuthenticated = false }: VerificationCenterProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [engine, setEngine] = useState<VerificationEngine>("evf");
  const [inputMethod, setInputMethod] = useState<InputMethod>("link");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [evidenceSteps, setEvidenceSteps] = useState<EvidenceStep[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [evfFailed, setEvfFailed] = useState(false); // EVF proxy failed — offer explicit downgrade
  const [disclaimer, setDisclaimer] = useState(false);

  const isEnterprise = plan === "Enterprise";

  const INPUT_METHODS: { id: InputMethod; label: string; icon: typeof Link; placeholder: string }[] = [
    { id: "link", label: "Share Link",    icon: Link, placeholder: "https://app.educreds.xyz/verify/..." },
    { id: "id",   label: "Credential ID", icon: Hash, placeholder: "Enter certificate ID (UUID)" },
    { id: "qr",   label: "QR Code",       icon: QrCode, placeholder: "Paste QR code value" },
  ];

  const runVerification = useCallback(async () => {
    if (!value.trim() || !disclaimer) return;
    setLoading(true); setError(null); setResult(null); setEvfFailed(false);

    const steps: EvidenceStep[] = EVIDENCE_STEPS.map((s) => ({ ...s, status: "pending" as const }));
    setEvidenceSteps(steps);

    const tick = async (i: number, status: "pass" | "fail") => {
      await new Promise((r) => setTimeout(r, 400));
      setEvidenceSteps((prev) => prev.map((s, idx) =>
        idx === i ? { ...s, status } : idx === i + 1 ? { ...s, status: "checking" } : s
      ));
    };

    try {
      setEvidenceSteps((prev) => prev.map((s, i) => i === 0 ? { ...s, status: "checking" } : s));
      const trimmed = value.trim();
      const lastSegment = (trimmed.replace(/\/+$/, "").split("/").pop() ?? trimmed).split("?")[0].split("#")[0];

      let data: any;

      if (engine === "public") {
        // Public layer — always use anonymous endpoint
        data = await api.verifyPublicCertificate(lastSegment);
      } else {
        // EVF or EVF+AI — primary path through verify proxy
        const modeFlag = engine === "evf_ai" ? "evf_ai" : "api";
        try {
          data = await api.verifyCertificate(lastSegment, { mode: modeFlag });
          if (data?.error && (
            data.error.includes("unreachable") ||
            data.error.includes("ECONNREFUSED") ||
            data.error.includes("signature_mismatch") ||
            data.error.includes("unauthorized")
          )) {
            throw new Error(data.error);
          }
        } catch (evfErr: any) {
          // EVF path failed — do NOT silently fall back; surface the failure
          setEvfFailed(true);
          setEvidenceSteps((prev) => prev.map((s) => s.status === "checking" ? { ...s, status: "fail" } : s));
          setError(`EVF verification unavailable: ${evfErr?.message ?? "proxy unreachable"}`);
          setLoading(false);
          return;
        }
      }

      await tick(0, "pass");
      await tick(1, "pass");
      await tick(2, "pass");
      const s = deriveStatus(data);
      await tick(3, s === "revoked" ? "fail" : "pass");
      await tick(4, s === "verified" ? "pass" : "fail");

      if (s === "not_found") {
        setError("Credential not found. Please check the ID and try again.");
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setEvidenceSteps((prev) => prev.map((s) => s.status === "checking" ? { ...s, status: "fail" } : s));
      setError(e.message ?? "Verification failed. Please check the credential ID and try again.");
    } finally {
      setLoading(false);
    }
  }, [value, disclaimer, engine]);

  const handleExplicitDowngrade = useCallback(async () => {
    setEvfFailed(false);
    setError(null);
    setEngine("public");
    // Immediately re-run with public engine
    if (!value.trim()) return;
    setLoading(true);
    try {
      const trimmed = value.trim();
      const lastSegment = (trimmed.replace(/\/+$/, "").split("/").pop() ?? trimmed).split("?")[0].split("#")[0];
      const data = await api.verifyPublicCertificate(lastSegment);
      const s = deriveStatus(data);
      if (s === "not_found") {
        setError("Credential not found. Please check the ID and try again.");
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message ?? "Public verification also failed.");
    } finally {
      setLoading(false);
    }
  }, [value]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto">
          <ShieldCheck className="size-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Verification Center</h2>
        <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">
          Public verifies existence · EVF verifies authenticity · EVF+AI predicts risk
        </p>
      </div>

      {/* Tab toggle (single / bulk) */}
      {mode === "both" && (
        <div className="flex rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1">
          {(["single", "bulk"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === t
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              {t === "single" ? "Single Credential" : "Bulk Screening"}
            </button>
          ))}
        </div>
      )}

      {/* ── Single verification ── */}
      {(mode === "single" || (mode === "both" && activeTab === "single")) && (
        <div className="space-y-6 animate-in fade-in">
          {/* Engine selector */}
          <EngineSelector
            selected={engine}
            plan={plan}
            isAuthenticated={isAuthenticated}
            onChange={(e) => { setEngine(e); setResult(null); setError(null); setEvfFailed(false); setEvidenceSteps([]); }}
          />

          {/* Input method */}
          <div className="grid grid-cols-3 gap-2">
            {INPUT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => { setInputMethod(m.id); setValue(""); setResult(null); setError(null); setEvfFailed(false); setEvidenceSteps([]); }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center",
                    inputMethod === m.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 hover:border-neutral-300"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input + Search */}
          <div className="flex gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={INPUT_METHODS.find((m) => m.id === inputMethod)?.placeholder}
              className="rounded-xl border-neutral-200 dark:border-neutral-700 font-medium"
              onKeyDown={(e) => e.key === "Enter" && runVerification()}
              disabled={loading}
            />
            <Button
              className="shrink-0 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading || !value.trim() || !disclaimer}
              onClick={runVerification}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </Button>
          </div>

          {/* Disclaimer */}
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={disclaimer}
              onChange={(e) => setDisclaimer(e.target.checked)}
              className="mt-0.5 size-4 rounded accent-blue-600"
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <strong className="text-neutral-800 dark:text-neutral-200">GDPR & Verification Notice:</strong>{" "}
              I confirm I am authorized to verify this credential and this check complies with applicable data protection requirements.
            </span>
          </label>

          {/* Evidence animation */}
          {loading && evidenceSteps.length > 0 && (
            <Card className="rounded-2xl border-none shadow-md bg-white dark:bg-neutral-900">
              <CardContent className="p-6">
                <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">Verifying…</p>
                <EvidenceDisplay steps={evidenceSteps} />
              </CardContent>
            </Card>
          )}

          {/* EVF failure — explicit downgrade offer */}
          {evfFailed && !loading && (
            <Alert className="rounded-2xl border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <AlertTriangle className="size-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-300 space-y-3">
                <p>{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl font-bold gap-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={handleExplicitDowngrade}
                >
                  Run Public Verification instead
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Generic error */}
          {error && !evfFailed && (
            <Alert className="rounded-2xl border-red-200 bg-red-50 dark:bg-red-950/30">
              <XCircle className="size-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Result */}
          {result && !loading && (
            <Card className="rounded-2xl border-none shadow-lg bg-white dark:bg-neutral-900">
              <CardContent className="p-6">
                <CredentialResultCard
                  data={result}
                  engine={engine}
                  isEnterprise={isEnterprise}
                  onDowngrade={() => { setEngine("public"); setResult(null); }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Bulk verification ── */}
      {(mode === "bulk" || (mode === "both" && activeTab === "bulk")) && (
        <Card className="rounded-2xl border-none shadow-lg bg-white dark:bg-neutral-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                <FileText className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-bold text-neutral-900 dark:text-neutral-100">Bulk Candidate Screening</p>
                <p className="text-xs text-neutral-400">Upload a CSV with credential IDs to verify all at once</p>
              </div>
            </div>
            <BulkVerifier />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
