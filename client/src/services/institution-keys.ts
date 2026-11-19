/**
 * institution-keys.ts
 *
 * DEPRECATED: Private key endpoints have been removed from the backend API.
 * Delegated signing key management is now admin-only via direct database updates.
 *
 * This file is retained for backward compatibility but all exports throw errors.
 */

export interface KeyStatus {
  hasPrivateKey: boolean;
  message?: string;
}

const notImplementedError = () =>
  new Error(
    'Delegated signing key management is not exposed through the API. ' +
    'Contact your EduCreds administrator to configure signing keys.'
  );

export const storeInstitutionPrivateKey = async (
  institutionId: string,
  privateKey: string
): Promise<{ message: string; hasPrivateKey: boolean }> => {
  throw notImplementedError();
};

export const removeInstitutionPrivateKey = async (
  institutionId: string
): Promise<{ message: string; hasPrivateKey: boolean }> => {
  throw notImplementedError();
};

export const testInstitutionPrivateKey = async (
  institutionId: string
): Promise<{ message: string; valid: boolean }> => {
  throw notImplementedError();
};
