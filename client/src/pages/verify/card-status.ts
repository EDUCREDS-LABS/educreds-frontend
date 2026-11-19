export interface VerifyStatusLike {
  status?: string | null;
  issuanceStatus?: string | null;
  verificationStatus?: string | null;
  isValid?: boolean | null;
  valid?: boolean | null;
  isRevoked?: boolean | null;
}

export type PublicVerifyStatus = "VALID" | "REVOKED" | "INVALID" | "UNDER REVIEW";

const VALID_STATUSES = new Set([
  "VALID",
  "VERIFIED",
  "ISSUED",
  "SUCCESS",
  "AUTHENTIC",
  "PASSED",
  "COMPLETED",
]);

const REVOKED_STATUSES = new Set([
  "REVOKED",
  "REVOKED_BY_ISSUER",
]);

const INVALID_STATUSES = new Set([
  "INVALID",
  "NOT_FOUND",
  "UNVERIFIABLE",
  "FAILED",
  "ERROR",
  "TAMPERED",
  "EXPIRED",
]);

const REVIEW_STATUSES = new Set([
  "PENDING",
  "UNDER_REVIEW",
  "IN_REVIEW",
  "REVIEW",
  "PROCESSING",
  "PENDING_REVIEW",
  "PENDING_BLOCKCHAIN_MINT",
  "PENDING_WALLET_SIGNATURE",
  "UNKNOWN",
]);

function normalizeStatus(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

export function derivePublicVerifyStatus(result?: VerifyStatusLike | null): PublicVerifyStatus {
  const statuses = [
    normalizeStatus(result?.status),
    normalizeStatus(result?.issuanceStatus),
    normalizeStatus(result?.verificationStatus),
  ].filter(Boolean);

  if (result?.isRevoked === true || statuses.some((status) => REVOKED_STATUSES.has(status))) {
    return "REVOKED";
  }

  if (statuses.some((status) => VALID_STATUSES.has(status))) {
    return "VALID";
  }

  if (statuses.some((status) => INVALID_STATUSES.has(status))) {
    return "INVALID";
  }

  if (statuses.some((status) => REVIEW_STATUSES.has(status))) {
    return "UNDER REVIEW";
  }

  if (result?.isValid === true || result?.valid === true) {
    return "VALID";
  }

  if (result?.isValid === false || result?.valid === false) {
    return "INVALID";
  }

  return "UNDER REVIEW";
}
