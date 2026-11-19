/**
 * Common CSV parser + bulk verification report utilities for EduCreds
 *
 * Handles:
 *  - Header normalization (case-insensitive, trim, snake_case / camelCase aliases)
 *  - Quoted fields (RFC 4180 compliant)
 *  - Row-level mapping for pass/fail tracking
 *  - Column preservation across batch operations
 *  - Response normalization from verification API → structured report data
 *  - Detailed CSV export with verification source, reasons, fields
 *  - Printable HTML report generation (data-room style)
 */

export type CsvRow = Record<string, string>;

export interface ParsedCsv {
  headers: string[];
  rows: CsvRow[];
  /** Maps raw header name → normalized column key */
  headerMap: Record<string, string>;
}

// ── Normalized verification result ────────────────────────────────────────────

export type VerificationStatus = 'verified' | 'failed' | 'review' | 'pending';
export type VerificationSource = 'evf' | 'public' | 'fallback' | 'unknown';

export type FailureReason =
  | 'not_found'
  | 'revoked'
  | 'invalid_signature'
  | 'mismatch'
  | 'missing_disclosure'
  | 'evf_unavailable'
  | 'expired'
  | 'tampered'
  | 'network_error'
  | 'parse_error'
  | 'unknown';

export interface NormalizedVerificationResult {
  /** Overall status */
  status: VerificationStatus;
  /** Human-readable status label */
  statusLabel: string;
  /** Verification source engine */
  verificationSource: VerificationSource;
  /** If fallback was used, why */
  fallbackReason: string | null;
  /** Specific failure reason code */
  failureReason: FailureReason | null;
  /** Human-readable failure explanation */
  failureExplanation: string | null;
  /** Credential fields that were verified and returned */
  verifiedFields: string[];
  /** Credential fields that are hidden / not disclosed */
  hiddenFields: string[];
  /** Raw credential data (for drilldown) */
  credential: {
    studentName?: string;
    courseName?: string;
    institutionName?: string;
    grade?: string;
    issuedAt?: string;
    tokenId?: string | number;
    isRevoked?: boolean;
    trustScore?: number;
    trustTier?: string;
  };
  /** AI scoring (if available) */
  ai?: {
    score: number | null;
    flags: string[];
    recommendation: string | null;
    locked: boolean;
  };
  /** Engine used by the backend */
  engineUsed?: string;
  /** Raw response for debug/drilldown */
  _raw: any;
}

export interface RowResult<T = NormalizedVerificationResult> {
  /** 1-based row index (excluding header) */
  rowIndex: number;
  /** Original parsed row */
  row: CsvRow;
  /** Lookup value used for verification */
  lookupValue: string | null;
  /** Normalized outcome data attached after processing */
  result?: T;
  status: VerificationStatus;
  error?: string;
}

// ── Header aliases ────────────────────────────────────────────────────────────

const HEADER_ALIASES: Record<string, string> = {
  // credential id variants
  credential_id: 'credentialId',
  credentialid: 'credentialId',
  'credential id': 'credentialId',
  cert_id: 'credentialId',
  certid: 'credentialId',
  certificate_id: 'credentialId',
  id: 'credentialId',

  // share link variants
  share_link: 'shareLink',
  sharelink: 'shareLink',
  'share link': 'shareLink',
  link: 'shareLink',
  url: 'shareLink',

  // candidate / student name
  candidate: 'name',
  'candidate name': 'name',
  candidate_name: 'name',
  student: 'name',
  student_name: 'name',
  name: 'name',
  full_name: 'name',

  // email
  email: 'email',
  email_address: 'email',
  candidate_email: 'email',
  student_email: 'email',

  // institution
  institution: 'institution',
  institution_name: 'institution',
  issuer: 'institution',

  // course / credential type
  course: 'course',
  course_name: 'course',
  credential: 'course',
  credential_type: 'course',
  program: 'course',

  // date
  date: 'date',
  issued_date: 'date',
  issued_at: 'date',
  graduation_date: 'date',
};

function normalizeHeader(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return HEADER_ALIASES[key] ?? raw.trim();
}

// ── Quoted-field CSV split ─────────────────────────────────────────────────────

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Parse a raw CSV string into normalized rows.
 * Returns the original raw headers as well as the normalized headerMap.
 */
export function parseCsv(text: string): ParsedCsv {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [], headerMap: {} };

  const rawHeaders = splitCsvLine(lines[0]);
  const headerMap: Record<string, string> = {};
  const normalizedHeaders: string[] = [];

  for (const raw of rawHeaders) {
    const normalized = normalizeHeader(raw);
    headerMap[raw] = normalized;
    normalizedHeaders.push(normalized);
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row: CsvRow = {};
    for (let j = 0; j < rawHeaders.length; j++) {
      const normKey = normalizedHeaders[j];
      const rawKey = rawHeaders[j];
      const val = values[j] ?? '';
      row[normKey] = val;
      if (rawKey !== normKey) row[rawKey] = val;
    }
    rows.push(row);
  }

  return { headers: normalizedHeaders, rows, headerMap };
}

/**
 * Extract the primary lookup value from a row:
 * prefers credentialId, falls back to shareLink, then any non-empty value.
 */
export function extractLookupValue(row: CsvRow): string | null {
  return row['credentialId'] || row['shareLink'] || null;
}

/**
 * Build a row-level result tracker for batch verification.
 * Use `updateRowResult` to attach outcomes as they arrive.
 */
export function buildRowResults(rows: CsvRow[]): RowResult[] {
  return rows.map((row, i) => ({
    rowIndex: i + 1,
    row,
    lookupValue: extractLookupValue(row),
    status: 'pending' as const,
  }));
}

export function updateRowResult<T = NormalizedVerificationResult>(
  results: RowResult<T>[],
  index: number,
  update: Partial<RowResult<T>>,
): RowResult<T>[] {
  return results.map((r) => (r.rowIndex === index ? { ...r, ...update } : r));
}

// ── Response normalization ────────────────────────────────────────────────────

/**
 * All known credential field names that could be returned by EVF/public/fallback.
 * Used to detect which fields are present (verified) vs absent (hidden/not disclosed).
 */
const ALL_CREDENTIAL_FIELDS = [
  'studentName',
  'courseName',
  'institutionName',
  'grade',
  'issuedAt',
  'tokenId',
  'trustScore',
  'trustTier',
] as const;

/** Labels for credential fields in reports */
const FIELD_LABELS: Record<string, string> = {
  studentName: 'Graduate Name',
  courseName: 'Credential/Course',
  institutionName: 'Institution',
  grade: 'Grade',
  issuedAt: 'Issue Date',
  tokenId: 'Blockchain Token ID',
  trustScore: 'Trust Score',
  trustTier: 'Trust Tier',
};

const STATUS_STRINGS_VERIFIED = new Set([
  'valid', 'verified', 'success', 'passed', 'authentic', 'issued',
]);
const STATUS_STRINGS_FAILED = new Set([
  'not_found', 'invalid', 'revoked', 'expired', 'tampered', 'failed', 'unverifiable',
]);

/**
 * Normalize a raw verification API response into a structured `NormalizedVerificationResult`.
 * Handles all backend shapes: EVF, public layer, fallback, and error responses.
 */
export function normalizeVerificationResponse(rawResult: any, error?: string): NormalizedVerificationResult {
  // Handle null/undefined/error cases
  if (!rawResult && error) {
    return {
      status: 'review',
      statusLabel: 'Error',
      verificationSource: 'unknown',
      fallbackReason: null,
      failureReason: classifyError(error),
      failureExplanation: error,
      verifiedFields: [],
      hiddenFields: ALL_CREDENTIAL_FIELDS.slice(),
      credential: {},
      engineUsed: undefined,
      _raw: rawResult,
    };
  }

  if (!rawResult || typeof rawResult !== 'object') {
    return {
      status: 'review',
      statusLabel: 'No Data',
      verificationSource: 'unknown',
      fallbackReason: null,
      failureReason: 'unknown',
      failureExplanation: 'No verification data received',
      verifiedFields: [],
      hiddenFields: ALL_CREDENTIAL_FIELDS.slice(),
      credential: {},
      engineUsed: undefined,
      _raw: rawResult,
    };
  }

  const data = rawResult;
  const legacy = data?.certificate ?? {};

  // Extract credential fields (same logic as VerificationCenter normalizeCredential)
  const isPublicShape = data?.credentialType !== undefined && data?.issuedYear !== undefined;
  const credential: NormalizedVerificationResult['credential'] = {
    studentName: data?.holder?.name ?? legacy.studentName ?? data?.studentName,
    courseName: data?.credential?.courseName ?? legacy.courseName ?? data?.courseName
                ?? data?.course
                ?? (isPublicShape ? data?.credentialType : undefined),
    institutionName: data?.issuer?.name ?? legacy.institutionName ?? data?.institutionName
                     ?? data?.issuedBy,
    grade: data?.credential?.grade ?? legacy.grade ?? data?.grade,
    issuedAt: data?.credential?.issuedAt ?? legacy.issuedAt ?? data?.issuedAt
              ?? (isPublicShape && data?.issuedYear ? `${data.issuedYear}-01-01T00:00:00Z` : undefined),
    tokenId: data?.blockchain?.tokenId ?? legacy.tokenId ?? data?.tokenId,
    isRevoked: data?.isRevoked ?? (data?.status === 'revoked'),
    trustScore: data?.issuer?.trustScore ?? data?.trustScore,
    trustTier: data?.issuer?.trustTier ?? data?.trustTier,
  };

  // Determine verified vs hidden fields
  const verifiedFields: string[] = [];
  const hiddenFields: string[] = [];
  for (const field of ALL_CREDENTIAL_FIELDS) {
    const val = credential[field as keyof typeof credential];
    if (val !== undefined && val !== null && val !== '') {
      verifiedFields.push(field);
    } else {
      hiddenFields.push(field);
    }
  }

  // Derive status
  const status = deriveStatusFromRaw(data, credential);

  // Derive verification source
  const verificationSource: VerificationSource =
    (data?.verificationSource as VerificationSource) ??
    (data?.source === 'registry_fallback' ? 'fallback' :
     data?.source === 'public_layer' ? 'public' :
     data?.engineUsed === 'public' ? 'public' : 'unknown');

  // Derive failure reason
  const { failureReason, failureExplanation } = deriveFailureInfo(status, data, error);

  // Derive fallback reason
  const fallbackReason: string | null = data?.fallbackReason ?? null;

  // AI data
  let ai: NormalizedVerificationResult['ai'] = undefined;
  if (data?.ai || data?.aiScore !== undefined) {
    ai = {
      score: data?.aiScore ?? data?.ai?.score ?? null,
      flags: data?.aiFlags ?? data?.ai?.flags ?? [],
      recommendation: data?.recommendation ?? data?.ai?.recommendation ?? null,
      locked: data?.ai?.locked ?? false,
    };
  }

  // Status label
  const statusLabel = status === 'verified' ? 'Verified'
    : status === 'failed' ? (credential.isRevoked ? 'Revoked' : 'Failed')
    : status === 'review' ? 'Needs Review'
    : 'Pending';

  return {
    status,
    statusLabel,
    verificationSource,
    fallbackReason,
    failureReason,
    failureExplanation,
    verifiedFields,
    hiddenFields,
    credential,
    ai,
    engineUsed: data?.engineUsed,
    _raw: rawResult,
  };
}

function deriveStatusFromRaw(
  data: any,
  credential: NormalizedVerificationResult['credential'],
): VerificationStatus {
  // Revocation always wins
  if (
    credential.isRevoked === true ||
    data?.status === 'revoked' ||
    data?.isRevoked === true
  ) return 'failed';

  const rawStatus = String(data?.status ?? data?.verificationStatus ?? data?.result ?? '').toLowerCase();

  if (STATUS_STRINGS_VERIFIED.has(rawStatus)) return 'verified';
  if (data?.isValid === true || data?.valid === true) return 'verified';
  if (STATUS_STRINGS_FAILED.has(rawStatus)) return 'failed';
  if (data?.isValid === false || data?.valid === false) return 'failed';

  // Presence of structured content implies a found credential
  if (credential.tokenId || credential.courseName || credential.institutionName || data?.credentialType) return 'verified';

  return 'review';
}

function deriveFailureInfo(
  status: VerificationStatus,
  data: any,
  error?: string,
): { failureReason: FailureReason | null; failureExplanation: string | null } {
  if (status === 'verified') return { failureReason: null, failureExplanation: null };

  const rawStatus = String(data?.status ?? data?.verificationStatus ?? '').toLowerCase();
  const rawError = data?.error ?? data?.message ?? error ?? '';

  // Specific failure reasons
  if (rawStatus === 'not_found' || rawStatus === 'invalid' || rawError.includes('not found') || rawError.includes('NOT_FOUND')) {
    return { failureReason: 'not_found', failureExplanation: 'Credential not found in registry. The ID may be incorrect or the credential has not been issued.' };
  }
  if (rawStatus === 'revoked' || data?.isRevoked === true) {
    return { failureReason: 'revoked', failureExplanation: 'This credential has been revoked by the issuing institution.' };
  }
  if (rawError.includes('signature_mismatch') || rawError.includes('signature')) {
    return { failureReason: 'invalid_signature', failureExplanation: 'Cryptographic signature verification failed — the credential may have been tampered with.' };
  }
  if (rawError.includes('mismatch')) {
    return { failureReason: 'mismatch', failureExplanation: 'Credential data does not match the issuer\'s records.' };
  }
  if (rawError.includes('disclosure') || rawError.includes('sharing_link')) {
    return { failureReason: 'missing_disclosure', failureExplanation: 'Missing or invalid sharing link — disclosure requirements not met.' };
  }
  if (data?.evfUnavailable || rawError.includes('ECONNREFUSED') || rawError.includes('unreachable') || rawError.includes('EVF unavailable')) {
    return { failureReason: 'evf_unavailable', failureExplanation: 'EVF verification engine was unavailable. Result derived from registry fallback.' };
  }
  if (rawStatus === 'expired' || rawError.includes('expired')) {
    return { failureReason: 'expired', failureExplanation: 'The credential or sharing link has expired.' };
  }
  if (rawStatus === 'tampered' || rawError.includes('tampered')) {
    return { failureReason: 'tampered', failureExplanation: 'The credential appears to have been tampered with.' };
  }
  if (rawError.includes('ECONNREFUSED') || rawError.includes('network') || rawError.includes('timeout')) {
    return { failureReason: 'network_error', failureExplanation: `Network error during verification: ${rawError}` };
  }

  if (status === 'failed') {
    return { failureReason: 'unknown', failureExplanation: rawError || 'Verification failed for an unknown reason.' };
  }

  // Review status
  return {
    failureReason: rawError ? classifyError(rawError) : null,
    failureExplanation: rawError || null,
  };
}

function classifyError(error: string): FailureReason {
  const e = error.toLowerCase();
  if (e.includes('not found')) return 'not_found';
  if (e.includes('revok')) return 'revoked';
  if (e.includes('signature')) return 'invalid_signature';
  if (e.includes('mismatch')) return 'mismatch';
  if (e.includes('disclosure') || e.includes('sharing')) return 'missing_disclosure';
  if (e.includes('evf') || e.includes('unreachable') || e.includes('econnrefused')) return 'evf_unavailable';
  if (e.includes('expired')) return 'expired';
  if (e.includes('tamper')) return 'tampered';
  if (e.includes('network') || e.includes('timeout')) return 'network_error';
  if (e.includes('parse') || e.includes('csv') || e.includes('column')) return 'parse_error';
  return 'unknown';
}

// ── Report generation ─────────────────────────────────────────────────────────

/**
 * Generate a detailed CSV report:
 *  1. Preserves ALL original columns
 *  2. Appends: verification_status, verification_source, fallback_reason,
 *     failure_reason, failure_explanation, fields_verified, fields_hidden,
 *     institution, credential_type, graduate_name, issued_date, verified_at
 */
export function generateVerificationReport(
  originalHeaders: string[],
  results: RowResult[],
): string {
  const extraHeaders = [
    'verification_status',
    'verification_source',
    'fallback_reason',
    'failure_reason',
    'failure_explanation',
    'fields_verified',
    'fields_hidden',
    'institution_name',
    'credential_type',
    'graduate_name',
    'issued_date',
    'verified_at',
  ];
  const allHeaders = [...originalHeaders, ...extraHeaders];

  const csvLines: string[] = [allHeaders.map(quoteField).join(',')];

  for (const r of results) {
    const values: string[] = originalHeaders.map((h) => r.row[h] ?? '');
    const nr = r.result;
    values.push(
      nr?.statusLabel ?? r.status,
      nr?.verificationSource ?? '',
      nr?.fallbackReason ?? '',
      nr?.failureReason ?? '',
      nr?.failureExplanation ?? r.error ?? '',
      nr?.verifiedFields?.map(f => FIELD_LABELS[f] ?? f).join('; ') ?? '',
      nr?.hiddenFields?.map(f => FIELD_LABELS[f] ?? f).join('; ') ?? '',
      nr?.credential?.institutionName ?? '',
      nr?.credential?.courseName ?? '',
      nr?.credential?.studentName ?? '',
      nr?.credential?.issuedAt ? formatDate(nr.credential.issuedAt) : '',
      r.status !== 'pending' ? new Date().toISOString() : '',
    );
    csvLines.push(values.map(quoteField).join(','));
  }

  return csvLines.join('\n');
}

/**
 * Generate a printable HTML verification report (data-room style).
 * Returns a complete HTML document string that can be opened in a new tab and printed.
 */
export function generateHtmlReport(
  results: RowResult[],
  meta?: { batchName?: string; verifierName?: string; generatedAt?: string },
): string {
  const now = meta?.generatedAt ?? new Date().toISOString();
  const batchName = meta?.batchName ?? 'Bulk Verification Report';
  const verifierName = meta?.verifierName ?? 'Authenticated Verifier';

  const summary = summarizeResults(results);
  const passRate = summary.total > 0 ? Math.round((summary.verified / summary.total) * 100) : 0;

  const statusBadge = (status: VerificationStatus) => {
    const colors: Record<string, string> = {
      verified: 'background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0',
      failed: 'background:#fef2f2;color:#991b1b;border:1px solid #fecaca',
      review: 'background:#fffbeb;color:#92400e;border:1px solid #fde68a',
      pending: 'background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb',
    };
    const labels: Record<string, string> = {
      verified: 'Verified', failed: 'Failed', review: 'Review', pending: 'Pending',
    };
    return `<span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:700;${colors[status] ?? colors.pending}">${labels[status] ?? status}</span>`;
  };

  const sourceBadge = (source: VerificationSource) => {
    const colors: Record<string, string> = {
      evf: 'background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe',
      public: 'background:#f3f4f6;color:#374151;border:1px solid #d1d5db',
      fallback: 'background:#fffbeb;color:#92400e;border:1px solid #fde68a',
      unknown: 'background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb',
    };
    const labels: Record<string, string> = {
      evf: 'EVF', public: 'Public', fallback: 'Fallback', unknown: '—',
    };
    return `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;letter-spacing:0.05em;${colors[source] ?? colors.unknown}">${labels[source] ?? source}</span>`;
  };

  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const rows = results.map((r, i) => {
    const nr = r.result;
    const cred = nr?.credential ?? {};
    return `
      <tr style="${i % 2 === 0 ? '' : 'background:#fafafa;'}">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;font-variant-numeric:tabular-nums;">${r.rowIndex}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;font-weight:600;font-family:monospace;word-break:break-all;">${escapeHtml(r.lookupValue ?? '—')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${statusBadge(r.status)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${sourceBadge(nr?.verificationSource ?? 'unknown')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${escapeHtml(nr?.failureExplanation ?? r.error ?? '—')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${escapeHtml(cred.institutionName ?? '—')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${escapeHtml(cred.courseName ?? '—')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${escapeHtml(cred.studentName ?? '—')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">
          ${nr?.verifiedFields?.length ? `<span style="color:#065f46;font-weight:600;">${nr.verifiedFields.length} verified</span>` : ''}
          ${nr?.hiddenFields?.length ? `<br/><span style="color:#92400e;">${nr.hiddenFields.length} hidden</span>` : ''}
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(batchName)} — EduCreds</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#111827; background:#fff; }
    @media print {
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .no-print { display:none !important; }
      table { page-break-inside:auto; }
      tr { page-break-inside:avoid; page-break-after:auto; }
    }
    .container { max-width:1100px; margin:0 auto; padding:32px 24px; }
    .header { display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #111827; padding-bottom:20px; margin-bottom:28px; }
    .logo { font-size:22px; font-weight:900; letter-spacing:-0.03em; color:#111827; }
    .logo span { color:#2563eb; }
    .meta { text-align:right; font-size:12px; color:#6b7280; line-height:1.6; }
    .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
    .summary-card { padding:16px 20px; border-radius:12px; border:1px solid #e5e7eb; }
    .summary-card .value { font-size:28px; font-weight:900; line-height:1; }
    .summary-card .label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-top:4px; }
    table { width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; }
    thead th { background:#f9fafb; padding:10px 12px; text-align:left; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280; border-bottom:2px solid #e5e7eb; }
    .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:11px; color:#9ca3af; text-align:center; }
    .print-btn { position:fixed; bottom:20px; right:20px; background:#2563eb; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.15); }
    .print-btn:hover { background:#1d4ed8; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨 Print Report</button>
  <div class="container">
    <div class="header">
      <div>
        <div class="logo">Edu<span>Creds</span></div>
        <div style="font-size:16px;font-weight:700;margin-top:4px;">${escapeHtml(batchName)}</div>
      </div>
      <div class="meta">
        <div>Generated: ${escapeHtml(formatDate(now))}</div>
        <div>Verifier: ${escapeHtml(verifierName)}</div>
        <div>Total Credentials: ${summary.total}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card" style="border-left:4px solid #10b981;">
        <div class="value" style="color:#065f46;">${summary.verified}</div>
        <div class="label">Verified</div>
      </div>
      <div class="summary-card" style="border-left:4px solid #ef4444;">
        <div class="value" style="color:#991b1b;">${summary.failed}</div>
        <div class="label">Failed</div>
      </div>
      <div class="summary-card" style="border-left:4px solid #f59e0b;">
        <div class="value" style="color:#92400e;">${summary.review}</div>
        <div class="label">Needs Review</div>
      </div>
      <div class="summary-card" style="border-left:4px solid #2563eb;">
        <div class="value" style="color:#1e40af;">${passRate}%</div>
        <div class="label">Pass Rate</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th style="width:180px;">Credential ID</th>
          <th style="width:90px;">Status</th>
          <th style="width:80px;">Source</th>
          <th>Reason / Notes</th>
          <th>Institution</th>
          <th>Credential</th>
          <th>Graduate</th>
          <th style="width:80px;">Fields</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="footer">
      <p>This report was generated by the EduCreds Evidence Verification Framework (EVF).</p>
      <p>Verification results are based on real-time checks against the credential registry and issuer infrastructure at the time of generation.</p>
      <p style="margin-top:4px;">Report ID: ${crypto_id()} · ${escapeHtml(formatDate(now))}</p>
    </div>
  </div>
</body>
</html>`;
}

/** Generate a pseudo-random report ID (browser-safe). */
function crypto_id(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().split('-')[0];
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Summary stats from a completed batch.
 */
export function summarizeResults(results: RowResult[]) {
  return {
    total: results.length,
    verified: results.filter((r) => r.status === 'verified').length,
    failed: results.filter((r) => r.status === 'failed').length,
    review: results.filter((r) => r.status === 'review').length,
    pending: results.filter((r) => r.status === 'pending').length,
  };
}

function quoteField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatDate(isoOrDate: string | Date): string {
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(isoOrDate);
  }
}

/** Field label lookup (exported for UI use) */
export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** Export failure reason to human-readable label */
export function getFailureReasonLabel(reason: FailureReason | null): string {
  if (!reason) return '—';
  const labels: Record<FailureReason, string> = {
    not_found: 'Not Found',
    revoked: 'Revoked',
    invalid_signature: 'Invalid Signature',
    mismatch: 'Data Mismatch',
    missing_disclosure: 'Missing Disclosure',
    evf_unavailable: 'EVF Unavailable',
    expired: 'Expired',
    tampered: 'Tampered',
    network_error: 'Network Error',
    parse_error: 'Parse Error',
    unknown: 'Unknown',
  };
  return labels[reason] ?? reason;
}
