import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const KEY_PREFIX = 'sk_live_';

export interface GeneratedKey {
    apiKey: string;
    prefix: string;
}

/**
 * Generates a secure random API key with a standard prefix
 * Format: sk_live_[32 random hex chars]
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
        prefix: apiKey.substring(0, 8) + '...'
    };
};

/**
 * Hashes an API key for secure storage
 */
export const hashApiKey = async (apiKey: string): Promise<string> => {
    return await bcrypt.hash(apiKey, SALT_ROUNDS);
};

/**
 * Compares a plain text API key with a hash
 */
export const compareApiKey = async (apiKey: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(apiKey, hash);
};
