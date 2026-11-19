import { describe, expect, it } from 'vitest';
import { derivePublicVerifyStatus } from './card-status';

describe('derivePublicVerifyStatus', () => {
  it('maps explicit valid statuses to VALID', () => {
    expect(derivePublicVerifyStatus({ status: 'VALID' })).toBe('VALID');
    expect(derivePublicVerifyStatus({ status: 'verified' })).toBe('VALID');
    expect(derivePublicVerifyStatus({ issuanceStatus: 'issued' })).toBe('VALID');
  });

  it('treats revoked flags and statuses as REVOKED', () => {
    expect(derivePublicVerifyStatus({ isRevoked: true })).toBe('REVOKED');
    expect(derivePublicVerifyStatus({ status: 'revoked_by_issuer' })).toBe('REVOKED');
    expect(derivePublicVerifyStatus({ issuanceStatus: 'revoked' })).toBe('REVOKED');
  });

  it('treats boolean-only proxy responses correctly', () => {
    expect(derivePublicVerifyStatus({ isValid: true })).toBe('VALID');
    expect(derivePublicVerifyStatus({ valid: true })).toBe('VALID');
    expect(derivePublicVerifyStatus({ isValid: false })).toBe('INVALID');
    expect(derivePublicVerifyStatus({ valid: false })).toBe('INVALID');
  });

  it('prefers review for pending-like statuses', () => {
    expect(derivePublicVerifyStatus({ status: 'UNDER REVIEW' })).toBe('UNDER REVIEW');
    expect(derivePublicVerifyStatus({ issuanceStatus: 'pending_blockchain_mint' })).toBe('UNDER REVIEW');
    expect(derivePublicVerifyStatus({ verificationStatus: 'processing' })).toBe('UNDER REVIEW');
  });

  it('treats not found / unverifiable responses as INVALID', () => {
    expect(derivePublicVerifyStatus({ status: 'not_found' })).toBe('INVALID');
    expect(derivePublicVerifyStatus({ status: 'unverifiable' })).toBe('INVALID');
    expect(derivePublicVerifyStatus({ verificationStatus: 'failed' })).toBe('INVALID');
  });
});
