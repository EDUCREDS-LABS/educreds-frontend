/**
 * Tests: csvParser — response normalization + report building
 *
 * Covers:
 *  1. normalizeVerificationResponse — all backend shapes
 *  2. Failure reason classification
 *  3. Field detection (verified vs hidden)
 *  4. CSV report generation with enriched columns
 *  5. HTML report generation
 *  6. Summary stats
 *  7. Edge cases: null data, empty rows, mixed statuses
 */

import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  extractLookupValue,
  buildRowResults,
  updateRowResult,
  normalizeVerificationResponse,
  generateVerificationReport,
  generateHtmlReport,
  summarizeResults,
  getFieldLabel,
  getFailureReasonLabel,
  type RowResult,
  type NormalizedVerificationResult,
} from '../csvParser';

// ── normalizeVerificationResponse ─────────────────────────────────────────────

describe('normalizeVerificationResponse', () => {
  describe('successful EVF response', () => {
    it('normalizes a valid EVF response with full fields', () => {
      const raw = {
        status: 'VALID',
        certificateId: 'cert-1',
        isValid: true,
        verificationSource: 'evf',
        engineUsed: 'evf',
        holder: { name: 'Jane Doe' },
        issuer: { name: 'MIT', trustScore: 92, trustTier: 'platinum' },
        credential: { courseName: 'BSc CS', grade: 'A', issuedAt: '2024-06-15T00:00:00Z' },
        blockchain: { tokenId: '42' },
      };

      const result = normalizeVerificationResponse(raw);

      expect(result.status).toBe('verified');
      expect(result.statusLabel).toBe('Verified');
      expect(result.verificationSource).toBe('evf');
      expect(result.fallbackReason).toBeNull();
      expect(result.failureReason).toBeNull();
      expect(result.failureExplanation).toBeNull();
      expect(result.credential.studentName).toBe('Jane Doe');
      expect(result.credential.courseName).toBe('BSc CS');
      expect(result.credential.institutionName).toBe('MIT');
      expect(result.credential.grade).toBe('A');
      expect(result.credential.tokenId).toBe('42');
      expect(result.credential.trustScore).toBe(92);
      expect(result.verifiedFields).toContain('studentName');
      expect(result.verifiedFields).toContain('courseName');
      expect(result.verifiedFields).toContain('institutionName');
      expect(result.verifiedFields).toContain('grade');
      expect(result.verifiedFields).toContain('tokenId');
      expect(result.verifiedFields).toContain('trustScore');
      expect(result.verifiedFields).toContain('trustTier');
      expect(result.hiddenFields.length).toBeLessThan(8); // most fields present
    });
  });

  describe('public layer response', () => {
    it('normalizes a public layer response with limited fields', () => {
      const raw = {
        status: 'verified',
        credentialType: 'BSc Computer Science',
        issuedYear: 2024,
        institutionName: 'University of Nairobi',
        isValid: true,
        verificationSource: 'public',
        engineUsed: 'public',
      };

      const result = normalizeVerificationResponse(raw);

      expect(result.status).toBe('verified');
      expect(result.verificationSource).toBe('public');
      expect(result.credential.courseName).toBe('BSc Computer Science');
      expect(result.credential.institutionName).toBe('University of Nairobi');
      // Public layer hides student name and grade
      expect(result.hiddenFields).toContain('studentName');
      expect(result.hiddenFields).toContain('grade');
      expect(result.verifiedFields).toContain('courseName');
      expect(result.verifiedFields).toContain('institutionName');
    });
  });

  describe('fallback response', () => {
    it('normalizes a fallback response with fallbackReason', () => {
      const raw = {
        status: 'VALID',
        certificateId: 'cert-2',
        issuedBy: 'Oxford',
        course: 'MBA',
        verificationSource: 'fallback',
        fallbackReason: 'EVF unavailable: ECONNREFUSED',
        evfUnavailable: true,
        source: 'registry_fallback',
      };

      const result = normalizeVerificationResponse(raw);

      expect(result.status).toBe('verified');
      expect(result.verificationSource).toBe('fallback');
      expect(result.fallbackReason).toBe('EVF unavailable: ECONNREFUSED');
      expect(result.credential.institutionName).toBe('Oxford');
      expect(result.credential.courseName).toBe('MBA');
    });
  });

  describe('revoked credential', () => {
    it('correctly identifies revoked status', () => {
      const raw = {
        status: 'revoked',
        isRevoked: true,
        isValid: false,
        holder: { name: 'John Doe' },
        issuer: { name: 'Harvard' },
        verificationSource: 'evf',
      };

      const result = normalizeVerificationResponse(raw);

      expect(result.status).toBe('failed');
      expect(result.statusLabel).toBe('Revoked');
      expect(result.failureReason).toBe('revoked');
      expect(result.failureExplanation).toMatch(/revoked/i);
    });

    it('revocation wins over isValid=true', () => {
      const raw = { isRevoked: true, isValid: true, tokenId: 42, status: 'revoked' };
      const result = normalizeVerificationResponse(raw);
      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('revoked');
    });
  });

  describe('not found credential', () => {
    it('maps NOT_FOUND status correctly', () => {
      const raw = {
        status: 'NOT_FOUND',
        certificateId: 'missing-cert',
        verificationSource: 'fallback',
        message: 'Certificate not found in registry',
      };

      const result = normalizeVerificationResponse(raw);

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('not_found');
      expect(result.failureExplanation).toMatch(/not found/i);
    });
  });

  describe('error cases', () => {
    it('handles null result with error string', () => {
      const result = normalizeVerificationResponse(null, 'Connection refused: ECONNREFUSED');

      expect(result.status).toBe('review');
      expect(result.failureReason).toBe('evf_unavailable');
      expect(result.failureExplanation).toBe('Connection refused: ECONNREFUSED');
      expect(result.verifiedFields).toEqual([]);
      expect(result.hiddenFields.length).toBe(8);
    });

    it('handles undefined result', () => {
      const result = normalizeVerificationResponse(undefined);

      expect(result.status).toBe('review');
      expect(result.statusLabel).toBe('No Data');
    });

    it('handles signature mismatch error', () => {
      const raw = { error: 'signature_mismatch', status: 'FAILED' };
      const result = normalizeVerificationResponse(raw);

      expect(result.failureReason).toBe('invalid_signature');
    });

    it('handles EVF unavailable error', () => {
      const raw = { evfUnavailable: true, status: 'VALID', verificationSource: 'fallback', fallbackReason: 'EVF down' };
      const result = normalizeVerificationResponse(raw);

      // Still verified (from fallback) but with EVF unavailable context
      expect(result.status).toBe('verified');
      expect(result.verificationSource).toBe('fallback');
      expect(result.fallbackReason).toBe('EVF down');
    });
  });

  describe('AI data', () => {
    it('normalizes flat AI fields', () => {
      const raw = { status: 'VALID', aiScore: 85, aiFlags: ['flag_a'], recommendation: 'proceed' };
      const result = normalizeVerificationResponse(raw);

      expect(result.ai).toBeDefined();
      expect(result.ai!.score).toBe(85);
      expect(result.ai!.flags).toEqual(['flag_a']);
      expect(result.ai!.recommendation).toBe('proceed');
    });

    it('normalizes nested AI fields', () => {
      const raw = { status: 'VALID', ai: { score: 72, flags: ['flag_b'], recommendation: 'review', locked: false } };
      const result = normalizeVerificationResponse(raw);

      expect(result.ai).toBeDefined();
      expect(result.ai!.score).toBe(72);
      expect(result.ai!.locked).toBe(false);
    });
  });

  describe('verification source detection', () => {
    it('detects EVF source from verificationSource field', () => {
      const result = normalizeVerificationResponse({ status: 'VALID', verificationSource: 'evf' });
      expect(result.verificationSource).toBe('evf');
    });

    it('detects fallback from source field', () => {
      const result = normalizeVerificationResponse({ status: 'VALID', source: 'registry_fallback' });
      expect(result.verificationSource).toBe('fallback');
    });

    it('detects public from engineUsed', () => {
      const result = normalizeVerificationResponse({ status: 'VALID', engineUsed: 'public' });
      expect(result.verificationSource).toBe('public');
    });

    it('returns unknown when no source info', () => {
      const result = normalizeVerificationResponse({ status: 'VALID' });
      expect(result.verificationSource).toBe('unknown');
    });
  });
});

// ── CSV parsing ───────────────────────────────────────────────────────────────

describe('parseCsv', () => {
  it('parses basic CSV with normalized headers', () => {
    const csv = 'credential_id,Candidate Name,email\ncert-1,Jane Doe,jane@example.com\ncert-2,John Doe,john@example.com';
    const { headers, rows } = parseCsv(csv);

    expect(headers).toEqual(['credentialId', 'name', 'email']);
    expect(rows).toHaveLength(2);
    expect(rows[0]['credentialId']).toBe('cert-1');
    expect(rows[0]['name']).toBe('Jane Doe');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'id,name\ncert-1,"Doe, Jane"\ncert-2,"Smith, Jr., John"';
    const { rows } = parseCsv(csv);

    expect(rows[0]['name']).toBe('Doe, Jane');
    expect(rows[1]['name']).toBe('Smith, Jr., John');
  });

  it('returns empty for empty input', () => {
    const { headers, rows } = parseCsv('');
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });
});

describe('extractLookupValue', () => {
  it('prefers credentialId over shareLink', () => {
    expect(extractLookupValue({ credentialId: 'cert-1', shareLink: 'https://...' })).toBe('cert-1');
  });

  it('falls back to shareLink', () => {
    expect(extractLookupValue({ shareLink: 'https://...' })).toBe('https://...');
  });

  it('returns null when no lookup value', () => {
    expect(extractLookupValue({ name: 'Jane' })).toBeNull();
  });
});

// ── Row result management ─────────────────────────────────────────────────────

describe('buildRowResults + updateRowResult', () => {
  it('builds row results with lookupValue pre-populated', () => {
    const rows: Record<string, string>[] = [{ credentialId: 'cert-1' }, { shareLink: 'link-2' }, { name: 'Jane' }];
    const results = buildRowResults(rows);

    expect(results).toHaveLength(3);
    expect(results[0].lookupValue).toBe('cert-1');
    expect(results[1].lookupValue).toBe('link-2');
    expect(results[2].lookupValue).toBeNull();
    expect(results[0].status).toBe('pending');
  });

  it('updates a specific row result', () => {
    const rows = [{ credentialId: 'cert-1' }, { credentialId: 'cert-2' }];
    let results = buildRowResults(rows);
    const nr = normalizeVerificationResponse({ status: 'VALID', verificationSource: 'evf' });
    results = updateRowResult(results, 1, { status: 'verified', result: nr });

    expect(results[0].status).toBe('verified');
    expect(results[0].result?.verificationSource).toBe('evf');
    expect(results[1].status).toBe('pending'); // unchanged
  });
});

// ── Report generation ─────────────────────────────────────────────────────────

describe('generateVerificationReport (CSV)', () => {
  it('generates a CSV with enriched columns', () => {
    const headers = ['credentialId', 'name'];
    const nr1 = normalizeVerificationResponse({
      status: 'VALID',
      verificationSource: 'evf',
      issuer: { name: 'MIT' },
      credential: { courseName: 'BSc CS' },
      holder: { name: 'Jane Doe' },
    });
    const nr2 = normalizeVerificationResponse({
      status: 'NOT_FOUND',
      verificationSource: 'fallback',
      fallbackReason: 'EVF down',
    });

    const results: RowResult<NormalizedVerificationResult>[] = [
      { rowIndex: 1, row: { credentialId: 'cert-1', name: 'Jane' }, lookupValue: 'cert-1', status: 'verified', result: nr1 },
      { rowIndex: 2, row: { credentialId: 'cert-2', name: 'John' }, lookupValue: 'cert-2', status: 'failed', result: nr2 },
    ];

    const csv = generateVerificationReport(headers, results);
    const lines = csv.split('\n');

    // Header line should have enriched columns
    expect(lines[0]).toContain('verification_status');
    expect(lines[0]).toContain('verification_source');
    expect(lines[0]).toContain('fallback_reason');
    expect(lines[0]).toContain('failure_reason');
    expect(lines[0]).toContain('failure_explanation');
    expect(lines[0]).toContain('fields_verified');
    expect(lines[0]).toContain('fields_hidden');
    expect(lines[0]).toContain('institution_name');
    expect(lines[0]).toContain('credential_type');
    expect(lines[0]).toContain('graduate_name');

    // Data line for verified row
    expect(lines[1]).toContain('Verified');
    expect(lines[1]).toContain('evf');
    expect(lines[1]).toContain('MIT');

    // Data line for failed row
    expect(lines[2]).toContain('Failed');
    expect(lines[2]).toContain('fallback');
    expect(lines[2]).toContain('EVF down');
    expect(lines[2]).toContain('not_found'); // failure_reason code in CSV
  });
});

describe('generateHtmlReport', () => {
  it('generates valid HTML with summary and table', () => {
    const nr = normalizeVerificationResponse({ status: 'VALID', verificationSource: 'evf', issuer: { name: 'MIT' } });
    const results: RowResult<NormalizedVerificationResult>[] = [
      { rowIndex: 1, row: { credentialId: 'cert-1' }, lookupValue: 'cert-1', status: 'verified', result: nr },
    ];

    const html = generateHtmlReport(results, { batchName: 'Test Batch' });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Test Batch');
    expect(html).toContain('EduCreds');
    expect(html).toContain('Verified');
    expect(html).toContain('cert-1');
    expect(html).toContain('EVF');
    expect(html).toContain('Print Report');
  });

  it('shows summary statistics correctly', () => {
    const verified = normalizeVerificationResponse({ status: 'VALID', verificationSource: 'evf' });
    const failed = normalizeVerificationResponse({ status: 'NOT_FOUND' });
    const results: RowResult<NormalizedVerificationResult>[] = [
      { rowIndex: 1, row: {}, lookupValue: 'c1', status: 'verified', result: verified },
      { rowIndex: 2, row: {}, lookupValue: 'c2', status: 'verified', result: verified },
      { rowIndex: 3, row: {}, lookupValue: 'c3', status: 'failed', result: failed },
    ];

    const html = generateHtmlReport(results);
    // 2 verified, 1 failed, pass rate = 67%
    expect(html).toContain('>2<');
    expect(html).toContain('>1<');
    expect(html).toContain('67%');
  });
});

// ── Summary stats ─────────────────────────────────────────────────────────────

describe('summarizeResults', () => {
  it('counts statuses correctly', () => {
    const results: RowResult<NormalizedVerificationResult>[] = [
      { rowIndex: 1, row: {}, lookupValue: 'c1', status: 'verified' },
      { rowIndex: 2, row: {}, lookupValue: 'c2', status: 'verified' },
      { rowIndex: 3, row: {}, lookupValue: 'c3', status: 'failed' },
      { rowIndex: 4, row: {}, lookupValue: 'c4', status: 'review' },
      { rowIndex: 5, row: {}, lookupValue: 'c5', status: 'pending' },
    ];

    const summary = summarizeResults(results);
    expect(summary.total).toBe(5);
    expect(summary.verified).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.review).toBe(1);
    expect(summary.pending).toBe(1);
  });
});

// ── Utility exports ───────────────────────────────────────────────────────────

describe('getFieldLabel', () => {
  it('returns human label for known fields', () => {
    expect(getFieldLabel('studentName')).toBe('Graduate Name');
    expect(getFieldLabel('courseName')).toBe('Credential/Course');
    expect(getFieldLabel('institutionName')).toBe('Institution');
  });

  it('returns raw field name for unknown fields', () => {
    expect(getFieldLabel('customField')).toBe('customField');
  });
});

describe('getFailureReasonLabel', () => {
  it('returns human labels for all failure reasons', () => {
    expect(getFailureReasonLabel('not_found')).toBe('Not Found');
    expect(getFailureReasonLabel('revoked')).toBe('Revoked');
    expect(getFailureReasonLabel('invalid_signature')).toBe('Invalid Signature');
    expect(getFailureReasonLabel('evf_unavailable')).toBe('EVF Unavailable');
    expect(getFailureReasonLabel(null)).toBe('—');
  });
});
