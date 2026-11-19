import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  Link2Off,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type VerificationOutcome =
  | "VERIFIED"
  | "REVOKED"
  | "TAMPERED"
  | "NOT_ANCHORED"
  | "NOT_FOUND"
  | "PENDING"
  | "SOURCE_MISMATCH"
  | "UNKNOWN";

export interface VerificationCredentialSummary {
  recipientName?: string;
  programme?: string;
  grade?: string;
  completionDate?: string;
  institution?: string;
}

export interface VerificationLayersShape {
  database?: { status?: string | null; checked?: boolean | null };
  blockchain?: { anchored?: boolean | null; txHash?: string | null; chainId?: number | null; checked?: boolean | null };
  revocation?: {
    revoked?: boolean | null;
    checked?: boolean | null;
    details?: {
      revoker?: string | null;
      timestamp?: number | null;
      reason?: string | null;
      transactionHash?: string | null;
      txHash?: string | null;
      [key: string]: unknown;
    } | null;
  };
  integrity?: { valid?: boolean | null; ipfsAvailable?: boolean | null; checked?: boolean | null; [key: string]: unknown };
  sourceVerification?: { confirmed?: boolean | null; checked?: boolean | null; details?: Record<string, unknown> | null };
}

export interface VerificationResultLike {
  status?: string | null;
  verified?: boolean | null;
  isValid?: boolean | null;
  valid?: boolean | null;
  isRevoked?: boolean | null;
  issuanceStatus?: string | null;
  verificationStatus?: string | null;
  issuedBy?: string | null;
  course?: string | null;
  issuedAt?: string | null;
  revocationReason?: string | null;
  revokedAt?: string | number | null;
  revokedBy?: string | null;
  credential?: Record<string, any> | null;
  certificate?: Record<string, any> | null;
  issuer?: { name?: string | null; trustTier?: string | null; trustScore?: number | null } | null;
  layers?: VerificationLayersShape | null;
  revocation?: Record<string, any> | null;
  [key: string]: any;
}

type LayerState = "pass" | "fail" | "warning" | "unavailable";

interface LayerDetailItem {
  label: string;
  value: string;
  href?: string;
}

interface LayerRow {
  key: string;
  label: string;
  summary: string;
  state: LayerState;
  details?: LayerDetailItem[];
}

function normalizeStatus(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

function humanizeToken(value?: string | null): string {
  const normalized = normalizeStatus(value);
  if (!normalized) return "Unknown";
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value?: string | number | null): string | null {
  if (value === undefined || value === null || value === "") return null;

  const candidate =
    typeof value === "number"
      ? new Date(value > 10_000_000_000 ? value : value * 1000)
      : new Date(value);

  if (Number.isNaN(candidate.getTime())) return typeof value === "string" ? value : null;

  return candidate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateHash(value?: string | null, start = 10, end = 8): string | null {
  if (!value) return null;
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

function getExplorerTxUrl(chainId?: number | null, txHash?: string | null): string | null {
  if (!txHash) return null;

  switch (chainId) {
    case 84532:
      return `https://sepolia.basescan.org/tx/${txHash}`;
    case 8453:
      return `https://basescan.org/tx/${txHash}`;
    case 11155111:
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    case 1:
      return `https://etherscan.io/tx/${txHash}`;
    case 137:
      return `https://polygonscan.com/tx/${txHash}`;
    case 80002:
      return `https://amoy.polygonscan.com/tx/${txHash}`;
    default:
      return null;
  }
}

function getChainLabel(chainId?: number | null): string {
  switch (chainId) {
    case 84532:
      return "Base Sepolia";
    case 8453:
      return "Base";
    case 11155111:
      return "Ethereum Sepolia";
    case 1:
      return "Ethereum";
    case 137:
      return "Polygon";
    case 80002:
      return "Polygon Amoy";
    default:
      return "supported network";
  }
}

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return null;
  return null;
}

function extractPrimitiveDetails(details?: Record<string, unknown> | null): LayerDetailItem[] {
  if (!details) return [];

  return Object.entries(details)
    .filter(([key, value]) => {
      if (value === null || value === undefined || value === "") return false;
      if (["reason", "message", "revoker", "timestamp", "transactionHash", "txHash", "confirmed", "connected", "available", "checked"].includes(key)) {
        return false;
      }
      return true;
    })
    .slice(0, 4)
    .map(([key, value]) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]+/g, " ")
        .replace(/^./, (char) => char.toUpperCase()),
      value: typeof value === "string"
        ? value
        : typeof value === "number"
          ? String(value)
          : typeof value === "boolean"
            ? value ? "Yes" : "No"
            : JSON.stringify(value),
    }));
}

function sourceSystemUnavailable(details?: Record<string, unknown> | null): boolean {
  if (!details) return false;

  const connected = details.connected;
  const available = details.available;
  const status = String(details.status ?? details.message ?? details.reason ?? "").toLowerCase();

  return connected === false
    || available === false
    || status.includes("unavailable")
    || status.includes("offline")
    || status.includes("not connected")
    || status.includes("not available");
}

function getInstitutionName(result?: VerificationResultLike | null): string | undefined {
  return result?.credential?.institution
    ?? result?.credential?.institutionName
    ?? result?.certificate?.institutionName
    ?? result?.issuer?.name
    ?? result?.issuedBy
    ?? undefined;
}

function getSourceConfirmationName(result?: VerificationResultLike | null): string | undefined {
  const details = result?.layers?.sourceVerification?.details;
  if (!details || typeof details !== "object") return getInstitutionName(result);

  const candidates = [
    details.institutionName,
    details.institution,
    details.schoolName,
    details.issuer,
    details.sourceName,
    details.provider,
    details.organization,
  ];

  return candidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)
    ?? getInstitutionName(result);
}

function deriveOutcomeFromLayers(layers?: VerificationLayersShape | null): VerificationOutcome | null {
  if (!layers) return null;

  const dbStatus = normalizeStatus(layers.database?.status);
  if (dbStatus === "NOT_FOUND" || dbStatus === "MISSING") return "NOT_FOUND";
  if (layers.revocation?.revoked === true) return "REVOKED";
  if (layers.integrity?.valid === false) return "TAMPERED";
  if (layers.blockchain?.anchored === false) return "NOT_ANCHORED";
  if (layers.sourceVerification?.confirmed === false && !sourceSystemUnavailable(layers.sourceVerification?.details ?? null)) return "SOURCE_MISMATCH";

  const checkedAny = [
    layers.database?.checked,
    layers.blockchain?.checked,
    layers.revocation?.checked,
    layers.integrity?.checked,
    layers.sourceVerification?.checked,
  ].some(Boolean);

  if (checkedAny && (
    layers.database?.checked === false
    || layers.blockchain?.checked === false
    || layers.revocation?.checked === false
    || layers.integrity?.checked === false
    || layers.sourceVerification?.checked === false
  )) {
    return "PENDING";
  }

  const allPassed =
    layers.database?.checked === true
    && layers.blockchain?.checked === true
    && layers.blockchain?.anchored === true
    && layers.revocation?.checked === true
    && layers.revocation?.revoked === false
    && layers.integrity?.checked === true
    && layers.integrity?.valid === true
    && layers.sourceVerification?.checked === true
    && layers.sourceVerification?.confirmed === true;

  return allPassed ? "VERIFIED" : null;
}

export function deriveVerificationOutcome(result?: VerificationResultLike | null): VerificationOutcome {
  const statuses = [
    normalizeStatus(result?.status),
    normalizeStatus(result?.issuanceStatus),
    normalizeStatus(result?.verificationStatus),
  ].filter(Boolean);

  if (result?.isRevoked === true || statuses.some((status) => status.startsWith("REVOKED"))) {
    return "REVOKED";
  }

  if (statuses.includes("TAMPERED")) return "TAMPERED";
  if (statuses.includes("NOT_ANCHORED")) return "NOT_ANCHORED";
  if (statuses.includes("SOURCE_MISMATCH")) return "SOURCE_MISMATCH";
  if (statuses.includes("NOT_FOUND")) return "NOT_FOUND";
  if (statuses.some((status) => ["PENDING", "UNDER_REVIEW", "PROCESSING", "PENDING_BLOCKCHAIN_MINT", "PENDING_WALLET_SIGNATURE"].includes(status))) {
    return "PENDING";
  }
  if (statuses.some((status) => ["VERIFIED", "VALID", "ISSUED", "AUTHENTIC", "SUCCESS", "COMPLETED", "PASSED"].includes(status))) {
    return "VERIFIED";
  }

  if (result?.verified === true || result?.isValid === true || result?.valid === true) {
    return "VERIFIED";
  }

  if (result?.isValid === false || result?.valid === false) {
    const fromLayers = deriveOutcomeFromLayers(result?.layers);
    return fromLayers ?? "UNKNOWN";
  }

  return deriveOutcomeFromLayers(result?.layers) ?? "UNKNOWN";
}

export function getVerificationStatusPresentation(outcome: VerificationOutcome) {
  switch (outcome) {
    case "VERIFIED":
      return {
        label: "VERIFIED",
        description: "This credential passed all available verification checks.",
        icon: ShieldCheck,
        containerClass: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30",
        iconWrapClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
        textClass: "text-emerald-700 dark:text-emerald-300",
      };
    case "REVOKED":
      return {
        label: "REVOKED",
        description: "This credential was revoked by the issuing institution.",
        icon: XCircle,
        containerClass: "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30",
        iconWrapClass: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
        textClass: "text-red-700 dark:text-red-300",
      };
    case "TAMPERED":
      return {
        label: "TAMPERED",
        description: "The credential document no longer matches the original issued record.",
        icon: AlertTriangle,
        containerClass: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30",
        iconWrapClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
        textClass: "text-amber-700 dark:text-amber-300",
      };
    case "NOT_FOUND":
      return {
        label: "NOT FOUND",
        description: "No matching credential record could be found.",
        icon: Search,
        containerClass: "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/70",
        iconWrapClass: "bg-white text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
        textClass: "text-neutral-700 dark:text-neutral-300",
      };
    case "PENDING":
      return {
        label: "PENDING",
        description: "Verification is still in progress or waiting for one or more checks.",
        icon: Clock3,
        containerClass: "border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30",
        iconWrapClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
        textClass: "text-blue-700 dark:text-blue-300",
      };
    case "NOT_ANCHORED":
      return {
        label: "NOT ANCHORED",
        description: "The credential exists, but its on-chain record has not been confirmed.",
        icon: Link2Off,
        containerClass: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30",
        iconWrapClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
        textClass: "text-amber-700 dark:text-amber-300",
      };
    case "SOURCE_MISMATCH":
      return {
        label: "SOURCE MISMATCH",
        description: "The issuing institution could not confirm this record through its live source system.",
        icon: AlertCircle,
        containerClass: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30",
        iconWrapClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
        textClass: "text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        label: "UNKNOWN",
        description: "The verification service returned an incomplete result.",
        icon: ShieldAlert,
        containerClass: "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/70",
        iconWrapClass: "bg-white text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
        textClass: "text-neutral-700 dark:text-neutral-300",
      };
  }
}

export function extractVerificationCredential(result?: VerificationResultLike | null): VerificationCredentialSummary {
  const credential = result?.credential ?? {};
  const certificate = result?.certificate ?? {};

  return {
    recipientName:
      credential.recipientName
      ?? credential.studentName
      ?? credential.fullName
      ?? credential.name
      ?? certificate.studentName
      ?? result?.studentName
      ?? undefined,
    programme:
      credential.programme
      ?? credential.programName
      ?? credential.courseName
      ?? credential.course
      ?? certificate.courseName
      ?? certificate.certificateType
      ?? result?.course
      ?? undefined,
    grade:
      credential.grade
      ?? certificate.grade
      ?? undefined,
    completionDate:
      credential.completionDate
      ?? credential.graduationDate
      ?? certificate.completionDate
      ?? certificate.issuedAt
      ?? result?.issuedAt
      ?? undefined,
    institution:
      credential.institution
      ?? credential.institutionName
      ?? certificate.institutionName
      ?? result?.issuer?.name
      ?? result?.issuedBy
      ?? undefined,
  };
}

export function hasVerificationLayers(result?: VerificationResultLike | null): boolean {
  return Boolean(result?.layers);
}

function extractRevocationItems(result?: VerificationResultLike | null): LayerDetailItem[] {
  const details = result?.layers?.revocation?.details;
  const items: LayerDetailItem[] = [];

  const reason = details?.reason ?? result?.revocationReason ?? result?.revocation?.reason;
  const revokedBy = details?.revoker ?? result?.revokedBy ?? result?.revocation?.revokedBy;
  const revokedAt = formatDate(details?.timestamp ?? result?.revokedAt ?? result?.revocation?.revokedAt);
  const transactionHash = details?.transactionHash ?? details?.txHash ?? result?.revocation?.transactionHash ?? result?.revocation?.txHash;
  const chainId = result?.layers?.blockchain?.chainId ?? result?.certificate?.anchorChainId;

  if (reason) items.push({ label: "Reason", value: String(reason) });
  if (revokedBy) items.push({ label: "Revoked by", value: String(revokedBy) });
  if (revokedAt) items.push({ label: "Date", value: revokedAt });
  if (transactionHash) {
    items.push({
      label: "Transaction",
      value: String(transactionHash),
      href: getExplorerTxUrl(chainId, String(transactionHash)) ?? undefined,
    });
  }

  return items;
}

export function buildVerificationLayerRows(result?: VerificationResultLike | null): LayerRow[] {
  const layers = result?.layers;
  if (!layers) return [];

  const databaseStatus = normalizeStatus(layers.database?.status);
  const databaseChecked = layers.database?.checked === true;
  let databaseRow: LayerRow;

  if (!databaseChecked) {
    databaseRow = {
      key: "database",
      label: "Database Record",
      summary: "Not checked",
      state: "unavailable",
    };
  } else if (["FOUND", "ACTIVE", "FOUND_AND_ACTIVE", "VALID", "VERIFIED", "ISSUED", "COMPLETED", "MINTED"].includes(databaseStatus)) {
    databaseRow = {
      key: "database",
      label: "Database Record",
      summary: "Found and active",
      state: "pass",
    };
  } else if (["PENDING", "PROCESSING"].includes(databaseStatus)) {
    databaseRow = {
      key: "database",
      label: "Database Record",
      summary: humanizeToken(databaseStatus),
      state: "warning",
    };
  } else {
    databaseRow = {
      key: "database",
      label: "Database Record",
      summary: databaseStatus ? humanizeToken(databaseStatus) : "Not found",
      state: "fail",
      details: databaseStatus ? [{ label: "Status", value: humanizeToken(databaseStatus) }] : undefined,
    };
  }

  const anchored = coerceBoolean(layers.blockchain?.anchored);
  const blockchainChecked = layers.blockchain?.checked === true;
  const txHash = layers.blockchain?.txHash ?? undefined;
  const chainId = layers.blockchain?.chainId ?? undefined;

  let blockchainRow: LayerRow;
  if (!blockchainChecked) {
    blockchainRow = {
      key: "blockchain",
      label: "On-Chain Record",
      summary: "Not checked",
      state: "unavailable",
    };
  } else if (anchored === true) {
    const summary = `Confirmed on ${getChainLabel(chainId)}${txHash ? ` (${truncateHash(txHash)})` : ""}`;
    blockchainRow = {
      key: "blockchain",
      label: "On-Chain Record",
      summary,
      state: "pass",
      details: txHash
        ? [{
            label: "Transaction",
            value: txHash,
            href: getExplorerTxUrl(chainId, txHash) ?? undefined,
          }]
        : undefined,
    };
  } else if (anchored === false) {
    blockchainRow = {
      key: "blockchain",
      label: "On-Chain Record",
      summary: "Not yet confirmed",
      state: deriveVerificationOutcome(result) === "NOT_ANCHORED" ? "warning" : "fail",
      details: txHash
        ? [{
            label: "Latest transaction",
            value: txHash,
            href: getExplorerTxUrl(chainId, txHash) ?? undefined,
          }]
        : [{ label: "Status", value: "No confirmed on-chain record was found for this credential." }],
    };
  } else {
    blockchainRow = {
      key: "blockchain",
      label: "On-Chain Record",
      summary: "Unavailable",
      state: "unavailable",
    };
  }

  const revoked = coerceBoolean(layers.revocation?.revoked);
  const revocationChecked = layers.revocation?.checked === true;

  let revocationRow: LayerRow;
  if (!revocationChecked) {
    revocationRow = {
      key: "revocation",
      label: "Revocation Status",
      summary: "Not checked",
      state: "unavailable",
    };
  } else if (revoked === false) {
    revocationRow = {
      key: "revocation",
      label: "Revocation Status",
      summary: "Not revoked",
      state: "pass",
    };
  } else if (revoked === true) {
    revocationRow = {
      key: "revocation",
      label: "Revocation Status",
      summary: "Revoked",
      state: "fail",
      details: extractRevocationItems(result),
    };
  } else {
    revocationRow = {
      key: "revocation",
      label: "Revocation Status",
      summary: "Unavailable",
      state: "unavailable",
    };
  }

  const integrityChecked = layers.integrity?.checked === true;
  const integrityValid = coerceBoolean(layers.integrity?.valid);
  const ipfsAvailable = coerceBoolean(layers.integrity?.ipfsAvailable);

  let integrityRow: LayerRow;
  if (!integrityChecked) {
    integrityRow = {
      key: "integrity",
      label: "Document Integrity",
      summary: "Not checked",
      state: "unavailable",
    };
  } else if (integrityValid === true) {
    integrityRow = {
      key: "integrity",
      label: "Document Integrity",
      summary: ipfsAvailable === false ? "Document matches the issued record" : "Document matches the issued record",
      state: "pass",
    };
  } else if (integrityValid === false) {
    integrityRow = {
      key: "integrity",
      label: "Document Integrity",
      summary: "Document has been changed",
      state: "fail",
      details: [{
        label: "Issue",
        value: "The credential document no longer matches the original issued record.",
      }],
    };
  } else if (ipfsAvailable === false) {
    integrityRow = {
      key: "integrity",
      label: "Document Integrity",
      summary: "Original file unavailable",
      state: "warning",
      details: [{
        label: "Status",
        value: "The original document file could not be reached for a full integrity check.",
      }],
    };
  } else {
    integrityRow = {
      key: "integrity",
      label: "Document Integrity",
      summary: "Unavailable",
      state: "unavailable",
    };
  }

  const sourceChecked = layers.sourceVerification?.checked === true;
  const sourceConfirmed = coerceBoolean(layers.sourceVerification?.confirmed);
  const sourceDetails = layers.sourceVerification?.details ?? null;
  const sourceUnavailable = sourceSystemUnavailable(sourceDetails);
  const sourceName = getSourceConfirmationName(result);
  const extraSourceDetails = extractPrimitiveDetails(sourceDetails);

  let sourceRow: LayerRow;
  if (!sourceChecked) {
    sourceRow = {
      key: "sourceVerification",
      label: "Institution Confirmation",
      summary: "Not checked",
      state: "unavailable",
    };
  } else if (sourceConfirmed === true) {
    sourceRow = {
      key: "sourceVerification",
      label: "Institution Confirmation",
      summary: sourceName ? `Confirmed by ${sourceName}` : "Confirmed by issuing institution",
      state: "pass",
      details: extraSourceDetails.length > 0 ? extraSourceDetails : undefined,
    };
  } else if (sourceUnavailable) {
    sourceRow = {
      key: "sourceVerification",
      label: "Institution Confirmation",
      summary: "Unavailable",
      state: "unavailable",
      details: [
        {
          label: "Status",
          value: "The institution's system is not connected for live verification.",
        },
        ...extraSourceDetails,
      ],
    };
  } else if (sourceConfirmed === false) {
    sourceRow = {
      key: "sourceVerification",
      label: "Institution Confirmation",
      summary: "Could not be confirmed",
      state: deriveVerificationOutcome(result) === "SOURCE_MISMATCH" ? "warning" : "fail",
      details: [
        {
          label: "Status",
          value: sourceName
            ? `${sourceName} did not confirm this credential in its live source system.`
            : "The issuing institution did not confirm this credential in its live source system.",
        },
        ...extraSourceDetails,
      ],
    };
  } else {
    sourceRow = {
      key: "sourceVerification",
      label: "Institution Confirmation",
      summary: "Unavailable",
      state: "unavailable",
    };
  }

  return [
    databaseRow,
    blockchainRow,
    revocationRow,
    integrityRow,
    sourceRow,
  ];
}

function getLayerStatePresentation(state: LayerState) {
  switch (state) {
    case "pass":
      return {
        icon: CheckCircle2,
        iconClass: "text-emerald-600 dark:text-emerald-400",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
        cardClass: "border-emerald-100/80 dark:border-emerald-900/50",
      };
    case "fail":
      return {
        icon: XCircle,
        iconClass: "text-red-600 dark:text-red-400",
        badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
        cardClass: "border-red-100/80 dark:border-red-900/50",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        iconClass: "text-amber-600 dark:text-amber-400",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
        cardClass: "border-amber-100/80 dark:border-amber-900/50",
      };
    default:
      return {
        icon: Circle,
        iconClass: "text-neutral-400 dark:text-neutral-500",
        badgeClass: "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
        cardClass: "border-neutral-100 dark:border-neutral-800",
      };
  }
}

function LayerRowCard({ row }: { row: LayerRow }) {
  const [open, setOpen] = useState(row.state !== "pass");
  const state = getLayerStatePresentation(row.state);
  const StateIcon = state.icon;
  const hasDetails = Boolean(row.details && row.details.length > 0);

  if (!hasDetails) {
    return (
      <div className={cn("rounded-2xl border bg-white/80 dark:bg-neutral-900/70 p-4", state.cardClass)}>
        <div className="flex items-start gap-3">
          <StateIcon className={cn("size-5 shrink-0 mt-0.5", state.iconClass)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <p className="text-sm font-black text-neutral-900 dark:text-neutral-100">{row.label}</p>
              <Badge variant="outline" className={cn("w-fit text-[10px] font-black uppercase tracking-widest", state.badgeClass)}>
                {row.summary}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn("rounded-2xl border bg-white/80 dark:bg-neutral-900/70", state.cardClass)}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full p-4 text-left hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <StateIcon className={cn("size-5 shrink-0 mt-0.5", state.iconClass)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-neutral-900 dark:text-neutral-100">{row.label}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-0.5">{row.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest", state.badgeClass)}>
                      Details
                    </Badge>
                    <ChevronDown className={cn("size-4 text-neutral-400 transition-transform", open && "rotate-180")} />
                  </div>
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pl-12 space-y-2">
            {row.details?.map((detail) => (
              <div key={`${row.key}-${detail.label}`} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium sm:min-w-[110px]">{detail.label}:</span>
                {detail.href ? (
                  <a
                    href={detail.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 dark:text-blue-400 break-all inline-flex items-center gap-1.5 hover:underline"
                  >
                    {detail.value}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-neutral-700 dark:text-neutral-300 break-words">{detail.value}</span>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function VerificationStatusBanner({
  result,
  badge,
  className,
}: {
  result?: VerificationResultLike | null;
  badge?: React.ReactNode;
  className?: string;
}) {
  const outcome = deriveVerificationOutcome(result);
  const presentation = getVerificationStatusPresentation(outcome);
  const Icon = presentation.icon;
  const revocationItems = outcome === "REVOKED" ? extractRevocationItems(result) : [];

  return (
    <div className={cn("rounded-3xl border p-5 sm:p-6", presentation.containerClass, className)}>
      <div className="flex items-start gap-4">
        <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0", presentation.iconWrapClass)}>
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Overall Status</p>
              <p className={cn("text-xl font-black tracking-tight mt-1", presentation.textClass)}>{presentation.label}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{presentation.description}</p>
            </div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>

          {revocationItems.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {revocationItems.map((item) => (
                <div key={`revocation-${item.label}`} className="rounded-2xl border border-white/60 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 break-all hover:underline"
                    >
                      {item.value}
                      <ExternalLink className="size-3.5 shrink-0" />
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-100 break-words">{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function VerificationLayersSection({
  result,
  title = "Verification Details",
  className,
}: {
  result?: VerificationResultLike | null;
  title?: string;
  className?: string;
}) {
  const rows = buildVerificationLayerRows(result);
  const outcome = deriveVerificationOutcome(result);
  const [open, setOpen] = useState(outcome !== "VERIFIED");

  if (rows.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn("rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40", className)}>
        <CollapsibleTrigger asChild>
          <button type="button" className="w-full px-5 py-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0">
                  <FileCheck2 className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Verification Stack</p>
                  <p className="text-base font-black text-neutral-900 dark:text-neutral-100 truncate">{title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">
                  6 checks
                </Badge>
                <ChevronDown className={cn("size-4 text-neutral-400 transition-transform", open && "rotate-180")} />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-3">
            {rows.map((row) => (
              <LayerRowCard key={row.key} row={row} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function VerificationCredentialFields({
  result,
  className,
}: {
  result?: VerificationResultLike | null;
  className?: string;
}) {
  const credential = extractVerificationCredential(result);

  const fields = [
    { label: "Recipient", value: credential.recipientName, icon: UserCheck },
    { label: "Programme", value: credential.programme, icon: FileCheck2 },
    { label: "Grade", value: credential.grade, icon: ShieldCheck },
    { label: "Completion Date", value: formatDate(credential.completionDate) ?? credential.completionDate, icon: Calendar },
    { label: "Institution", value: credential.institution, icon: ShieldCheck },
  ].filter((field) => field.value);

  if (fields.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {fields.map((field) => {
        const Icon = field.icon;
        return (
          <div key={field.label} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/70 p-4">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <Icon className="size-4 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{field.label}</p>
                <p className="mt-1 text-sm font-bold text-neutral-900 dark:text-neutral-100 break-words">{field.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
