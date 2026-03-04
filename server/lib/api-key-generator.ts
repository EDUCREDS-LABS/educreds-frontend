import { createHash, randomBytes } from 'crypto';
const KEY_PREFIX = process.env.NODE_ENV === 'production' ? 'sk_live_' : 'sk_test_';

export interface GeneratedKey {
    apiKey: string;
    prefix: string;
}

/**
 * Generates a secure random API key with a standard prefix
 * Format: sk_live_[32 random hex chars] (production)
 *         sk_test_[32 random hex chars] (non-production)
 */
export const generateApiKey = (): GeneratedKey => {
    const randomPart = randomBytes(16).toString('hex');
    const apiKey = `${KEY_PREFIX}${randomPart}`;
    // Prefix is valuable for quickly identifying implied key type and database lookups
    // (though strict lookups should be done via hash or other ID if possible to avoid table scans, 
    // but usually we index the hash or use ID)
    // In our case, we might store the prefix separately to help user identify keys in UI
    // or use the whole key as the secret.

    return {
        apiKey,
        // Display-friendly fingerprint for identifying keys in UI
        prefix: `${apiKey.substring(0, 12)}...${apiKey.slice(-4)}`
    };
};

/**
 * Hashes an API key for secure storage
 */
export const hashApiKey = async (apiKey: string): Promise<string> => {
    return createHash('sha256').update(apiKey).digest('hex');
};

/**
 * Compares a plain text API key with a hash
 */
export const compareApiKey = async (apiKey: string, hash: string): Promise<boolean> => {
    return createHash('sha256').update(apiKey).digest('hex') === hash;
};
