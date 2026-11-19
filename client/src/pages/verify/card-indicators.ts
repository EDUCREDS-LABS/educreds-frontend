/**
 * card-indicators.ts
 *
 * Pure helper functions that derive the three new verification indicators:
 *   1. Verification source  — live institution sync | registry fallback | public registry | unknown
 *   2. On-chain status      — valid on-chain | valid but not on-chain | unknown
 *   3. Issuer credibility   — trust tier / score from response, or 'Not available'
 *
 * Kept pure (no React/DOM) so they can be unit-tested independently.
 */

// ── 1. Verification source ───────────────────────────────────────────────────

export type VerificationSourceType =
  | "live_sync"
  | "registry_fallback"
  | "public_registry"
  | "unknown";

export interface VerificationSourceResult {
  type: VerificationSourceType;
  label: string;
  description: string;
}

export function deriveVerificationSource(data: {
  verificationSource?: string | null;
  fallbackReason?: string | null;
  evfUnavailable?: boolean | null;
  engineUsed?: string | null;
}): VerificationSourceResult {
  // Explicit fallback signals
  if (data.evfUnavailable === true || data.verificationSource === "fallback") {
    return {
      type: "registry_fallback",
      label: "Registry Fallback",
      description: data.fallbackReason
        ? `EVF unavailable — result from credential registry. Reason: ${data.fallbackReason}`
        : "EVF unavailable — result from credential registry (reduced confidence).",
    };
  }

  // Live EVF sync
  if (data.verificationSource === "evf" || data.engineUsed === "evf" || data.engineUsed === "evf_ai") {
    return {
      type: "live_sync",
      label: "Live Institution Sync",
      description: "Credential verified in real-time via the EVF Evidence Verification Framework.",
    };
  }

  // Public registry
  if (data.verificationSource === "public" || data.engineUsed === "public") {
    return {
      type: "public_registry",
      label: "Public Registry",
      description: "Verified from the public credential registry (existence + revocation only).",
    };
  }

  return {
    type: "unknown",
    label: "Source Unknown",
    description: "The verification source could not be determined from this response.",
  };
}

// ── 2. On-chain status ───────────────────────────────────────────────────────

export type OnChainStatusType =
  | "valid_onchain"
  | "valid_not_onchain"
  | "unknown";

export interface OnChainStatusResult {
  status: OnChainStatusType;
  label: string;
  description: string;
}

export function deriveOnChainStatus(data: {
  tokenId?: number | string | null;
  isMinted?: boolean | null;
  ipfsHash?: string | null;
  isValid?: boolean | null;
  valid?: boolean | null;
  status?: string | null;
  issuanceStatus?: string | null;
  verificationStatus?: string | null;
}): OnChainStatusResult {
  const rawToken = data.tokenId;
  const tokenNum = rawToken != null ? Number(rawToken) : NaN;
  const hasPositiveToken = !isNaN(tokenNum) && tokenNum > 0;
  const tokenIsExplicitlyNull = rawToken === null;
  const tokenIsExplicitlyZero = rawToken === 0 || rawToken === "0";

  // isMinted flag (explicit)
  const isMintedTrue = data.isMinted === true;
  const isMintedFalse = data.isMinted === false;

  // Credential is known to exist / be valid
  const validStatuses = new Set(["issued", "verified", "valid", "VALID", "VERIFIED", "ISSUED", "SUCCESS", "AUTHENTIC"]);
  const statusValid = validStatuses.has(String(data.status ?? "").trim()) ||
    validStatuses.has(String(data.issuanceStatus ?? "").trim()) ||
    validStatuses.has(String(data.verificationStatus ?? "").trim());
  const credentialExists = data.isValid === true || data.valid === true || statusValid;

  // On-chain: positive tokenId or isMinted=true
  if (hasPositiveToken || isMintedTrue) {
    return {
      status: "valid_onchain",
      label: "Valid On-chain",
      description: hasPositiveToken
        ? `Credential minted on blockchain — token ID: ${rawToken}.`
        : "Credential is confirmed minted on-chain.",
    };
  }

  // Explicitly not on-chain: null/zero tokenId or isMinted=false, and credential exists
  if ((tokenIsExplicitlyNull || tokenIsExplicitlyZero || isMintedFalse) && credentialExists) {
    return {
      status: "valid_not_onchain",
      label: "Valid, Not On-chain",
      description: "Credential is valid but has not been minted on-chain yet.",
    };
  }

  // Fallback: credential exists but no tokenId info at all (tokenId=undefined)
  if (credentialExists && rawToken === undefined && data.isMinted === undefined) {
    return {
      status: "unknown",
      label: "On-chain Status Unknown",
      description: "Blockchain status was not returned by the verification service.",
    };
  }

  return {
    status: "unknown",
    label: "On-chain Status Unknown",
    description: "Blockchain status could not be determined.",
  };
}

// ── 3. Issuer credibility ────────────────────────────────────────────────────

export type TrustTierValue =
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "unverified"
  | null;

export interface IssuerCredibilityResult {
  available: boolean;
  tier: TrustTierValue;
  score: number | null;
  label: string;
  description: string;
}

export function deriveIssuerCredibility(data: {
  trustTier?: string | null;
  trustScore?: number | null;
  issuer?: { trustTier?: string | null; trustScore?: number | null } | null;
}): IssuerCredibilityResult {
  const tier = (data.trustTier ?? data.issuer?.trustTier ?? null) as TrustTierValue;
  const score =
    data.trustScore != null
      ? data.trustScore
      : data.issuer?.trustScore != null
        ? data.issuer.trustScore
        : null;

  if (tier == null && score == null) {
    return {
      available: false,
      tier: null,
      score: null,
      label: "Not available",
      description: "Issuer credibility data was not included in this verification response.",
    };
  }

  const tierLabels: Record<string, string> = {
    platinum: "Platinum Issuer",
    gold: "Gold Issuer",
    silver: "Silver Issuer",
    bronze: "Registered Issuer",
    unverified: "Pending Verification",
  };

  const resolvedLabel = tier ? (tierLabels[tier] ?? tier) : `Score: ${score}/100`;

  return {
    available: true,
    tier,
    score,
    label: resolvedLabel,
    description:
      score != null
        ? `Trust score: ${score}/100${tier ? ` (${resolvedLabel})` : ""}.`
        : `Issuer is a ${resolvedLabel}.`,
  };
}
