/**
 * Unified API Configuration
 * Centralizes all backend endpoints and environment variables
 */

const resolveDefaultApiBase = () => {
  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  const { protocol, hostname, origin } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  // Local dev expects backend on :3001. In deployed environments, default to same-origin.
  if (isLocalhost && (protocol === "http:" || protocol === "https:")) {
    return "http://localhost:3001";
  }

  return origin;
};

const DEFAULT_API_BASE = resolveDefaultApiBase();

// Environment variables with fallbacks
const MAIN_API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || DEFAULT_API_BASE;
const CERT_API_BASE = import.meta.env.VITE_CERT_API_BASE?.replace(/\/$/, "") || DEFAULT_API_BASE;
const MARKETPLACE_API_BASE = import.meta.env.VITE_MARKETPLACE_API_BASE?.replace(/\/$/, "") || DEFAULT_API_BASE;

export const API_CONFIG = {
  // Main backend (admin, oracle, unified services)
  MAIN: MAIN_API_BASE,
  
  // Certificate backend (certificate issuance, institution management)
  CERT: CERT_API_BASE,
  
  // Marketplace backend (marketplace operations)
  MARKETPLACE: MARKETPLACE_API_BASE,
  
  // Health check endpoints
  HEALTH: {
    MAIN: `${MAIN_API_BASE}/health`,
    CERT: `${CERT_API_BASE}/health`,
    MARKETPLACE: `${MARKETPLACE_API_BASE}/health`
  },
  
  // Admin endpoints (use MAIN backend)
  ADMIN: {
    BASE: `${MAIN_API_BASE}/api/admin`,
    LOGIN: `${MAIN_API_BASE}/api/admin/login`,
    LOGOUT: `${MAIN_API_BASE}/api/admin/logout`,
    SESSION: `${MAIN_API_BASE}/api/admin/session`,
    TEST: `${MAIN_API_BASE}/api/admin/test`,
    VERIFICATION_REQUESTS: `${MAIN_API_BASE}/api/admin/verification-requests`,
    REVENUE: `${MAIN_API_BASE}/api/admin/revenue`,
    BLOCKCHAIN_SUMMARY: `${MAIN_API_BASE}/api/admin/blockchain-summary`,
    BLOCKCHAIN_STATUS: `${MAIN_API_BASE}/api/admin/blockchain-status`,
    CHANGE_PASSWORD: `${MAIN_API_BASE}/api/admin/change-password`,
    USERS: `${MAIN_API_BASE}/api/admin/users`,
    AUDIT_LOGS: `${MAIN_API_BASE}/api/admin/audit-logs`
  },
  
  
  // Certificate endpoints (use CERT backend)
  CERTIFICATES: {
    BASE: `${CERT_API_BASE}/api/certificates`,
    ISSUE: `${CERT_API_BASE}/api/certificates/issue`,
    INSTITUTION: `${CERT_API_BASE}/api/certificates/institution`,
    VERIFY_IPFS: (ipfsHash: string) => `${CERT_API_BASE}/api/certificates/verify/ipfs/${ipfsHash}`,
    VERIFY_TOKEN: (tokenId: number) => `${CERT_API_BASE}/api/certificates/verify/token/${tokenId}`,
    VERIFY: (id: string) => `${CERT_API_BASE}/api/certificates/verify/${id}`,
    WALLET: (walletAddress: string) => `${CERT_API_BASE}/api/certificates/wallet/${walletAddress}`,
    MINT: (certificateId: string) => `${CERT_API_BASE}/api/certificates/${certificateId}/mint`,
    ONCHAIN_MINT: (certificateId: string) => `${CERT_API_BASE}/api/certificates/${certificateId}/onchain-mint`,
    SHARE_PACKAGE: (certificateId: string) => `${CERT_API_BASE}/api/student/share/${certificateId}/package`,
    SHARE_METHODS: (certificateId: string) => `${CERT_API_BASE}/api/student/share/${certificateId}/methods`
  },
  
  // W3C Verifiable Credentials endpoints
  W3C: {
    BASE: `${CERT_API_BASE}/api/w3c-credentials`,
    ISSUE: `${CERT_API_BASE}/api/w3c-credentials/issue`,
    VERIFY: `${CERT_API_BASE}/api/w3c-credentials/verify`,
    HYBRID_VERIFY: `${CERT_API_BASE}/api/hybrid-verification/verify`,
    HYBRID_PROOF: (tokenId: number) => `${CERT_API_BASE}/api/hybrid-verification/proof/${tokenId}`,
    HYBRID_MINT: `${CERT_API_BASE}/api/hybrid-verification/mint`
  },
  
  // Institution endpoints (use CERT backend)
  INSTITUTIONS: {
    BASE: `${CERT_API_BASE}/api/institutions`,
    LOGIN: `${CERT_API_BASE}/auth/institution/login`,
    REGISTER: `${CERT_API_BASE}/auth/institution/register`,
    PROFILE: `${CERT_API_BASE}/api/institutions/profile`,
    VERIFICATION_STATUS: `${CERT_API_BASE}/api/institutions/verification-status`,
    VERIFICATION_DOCUMENTS: `${CERT_API_BASE}/api/institutions/verification-documents`,
    BLOCKCHAIN_STATUS: (institutionId: string) => `${CERT_API_BASE}/api/institutions/${institutionId}/blockchain-status`,
    VARIANTS: (institutionId: string) => `${MAIN_API_BASE}/api/institutions/${institutionId}/variants`
  },

  // Subscription endpoints
  SUBSCRIPTION: {
    BASE: `${CERT_API_BASE}/api/subscription`,
    CURRENT: `${CERT_API_BASE}/api/subscription/current`,
    PLANS: `${CERT_API_BASE}/api/subscription/plans`,
    SUBSCRIBE: `${CERT_API_BASE}/api/subscription/subscribe`,
    CANCEL: `${CERT_API_BASE}/api/subscription/cancel`,
    USAGE: `${CERT_API_BASE}/api/subscription/usage`,
    PAYMENTS: `${CERT_API_BASE}/api/subscription/payments`
  },

  // Payment endpoints
  PAYMENTS: {
    BASE: `${CERT_API_BASE}/api/payments`,
    STRIPE_CREATE_INTENT: `${CERT_API_BASE}/api/payments/stripe/create-intent`,
    STRIPE_CONFIRM: `${CERT_API_BASE}/api/payments/stripe/confirm`,
    PAYPAL_CREATE_ORDER: `${CERT_API_BASE}/api/payments/paypal/create-order`,
    PAYPAL_CAPTURE_ORDER: `${CERT_API_BASE}/api/payments/paypal/capture-order`,
    CRYPTO_CREATE: `${CERT_API_BASE}/api/payments/crypto/create`,
    CRYPTO_CONFIRM: `${CERT_API_BASE}/api/payments/crypto/confirm`
  },

  // Blockchain Indexer endpoints (use CERT backend)
  INDEXER: {
    BASE: `${CERT_API_BASE}/api/indexer`,
    // Query endpoints
    TRANSACTIONS: `${CERT_API_BASE}/api/indexer/transactions`,
    TRANSACTION: (txHash: string) => `${CERT_API_BASE}/api/indexer/transactions/${txHash}`,
    INSTITUTION_HISTORY: (iin: number) => `${CERT_API_BASE}/api/indexer/institutions/${iin}`,
    INSTITUTION_CREDENTIALS: (iin: number) => `${CERT_API_BASE}/api/indexer/institutions/${iin}/credentials`,
    PROPOSAL_STATE: (proposalId: string) => `${CERT_API_BASE}/api/indexer/proposals/${proposalId}`,
    PROPOSAL_VOTES: (proposalId: string) => `${CERT_API_BASE}/api/indexer/proposals/${proposalId}/votes`,
    STATS: `${CERT_API_BASE}/api/indexer/stats`,
    SYNC_STATUS: `${CERT_API_BASE}/api/indexer/sync/status`,
    SYNC_FORCE: `${CERT_API_BASE}/api/indexer/sync/force`,
    // Admin endpoints
    ADMIN: {
      FAILED_EVENTS: `${CERT_API_BASE}/api/indexer/admin/failed-events`,
      RETRY_EVENT: (failureKey: string) => `${CERT_API_BASE}/api/indexer/admin/retry-failed-event/${failureKey}`,
      CLEAR_FAILED: `${CERT_API_BASE}/api/indexer/admin/clear-failed-events`,
      DLQ_STATS: `${CERT_API_BASE}/api/indexer/admin/dlq-stats`,
      EXPORT_FAILED: `${CERT_API_BASE}/api/indexer/admin/export-failed-events`,
      SYNC_RECEIPTS: `${CERT_API_BASE}/api/indexer/admin/sync-receipts`,
      RESET_CONTRACT: (address: string) => `${CERT_API_BASE}/api/indexer/admin/reset-contract/${address}`
    }
  }
} as const;

// Connection test configuration
export const CONNECTION_CONFIG = {
  TIMEOUT: 15000, // 15 seconds for database operations
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// Log configuration for debugging
console.log('API Configuration:', {
  MAIN: API_CONFIG.MAIN,
  CERT: API_CONFIG.CERT,
  MARKETPLACE: API_CONFIG.MARKETPLACE
});
