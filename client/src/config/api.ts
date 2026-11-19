/**
 * Unified API Configuration
 * Centralizes all backend endpoints and environment variables
 */

// Helper function to safely access environment variables
const getEnvVar = (key: string, fallback?: string): string | undefined => {
  const isBrowser = typeof window !== "undefined";

  if (isBrowser && !key.startsWith("VITE_")) {
    return fallback;
  }

  // Check if we're in browser environment (Vite) - import.meta exists
  try {
    if (import.meta?.env) {
      return import.meta.env[key] || fallback;
    }
  } catch {
    // Not in Vite environment, fall through to Node.js check
  }

  // Server environment (Node.js)
  if (!isBrowser && typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
};

const resolveDefaultApiBase = () => {
  if (typeof window === "undefined") {
    // SSR / test environment — dev backend runs on :5050
    return "http://localhost:5050";
  }

  const { protocol, hostname, origin } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  // Local dev: backend on :5050. In deployed environments, default to same-origin.
  if (isLocalhost && (protocol === "http:" || protocol === "https:")) {
    return "http://localhost:5050";
  }

  return origin;
};

const DEFAULT_API_BASE = resolveDefaultApiBase();

// Environment variables with fallbacks
const CERT_API_BASE = getEnvVar('VITE_CERT_API_BASE', DEFAULT_API_BASE)?.replace(/\/$/, "") || DEFAULT_API_BASE;

// IMPORTANT:
// If VITE_API_BASE is not set, we MUST NOT default MAIN to window.location.origin
// in production, because that points to the static frontend host (e.g. https://app.educreds.xyz)
// which will 401/403 on /api/* and trigger the global auth recovery (looks like “instant logout”).
// Safe fallback: use CERT_API_BASE as the primary API base in deployed environments.
const MAIN_API_BASE = (
  getEnvVar('VITE_API_BASE') ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? CERT_API_BASE
    : DEFAULT_API_BASE)
)?.replace(/\/$/, "") || CERT_API_BASE;

const MARKETPLACE_API_BASE = getEnvVar('VITE_MARKETPLACE_API_BASE', DEFAULT_API_BASE)?.replace(/\/$/, "") || DEFAULT_API_BASE;
const TRUST_AGENT_API_BASE = (
  getEnvVar('VITE_TRUST_AGENT_API_BASE') ||
  getEnvVar('VITE_TRUST_AGENT_BASE') ||
  'http://localhost:3000'
).replace(/\/$/, "");

export const API_CONFIG = {
  // Main backend (admin, oracle, unified services)
  MAIN: MAIN_API_BASE,
  
  // Certificate backend (certificate issuance, institution management)
  CERT: CERT_API_BASE,
  
  // Marketplace backend (marketplace operations)
  MARKETPLACE: MARKETPLACE_API_BASE,
  
  // Trust Agent
  TRUST_AGENT: TRUST_AGENT_API_BASE,

  /**
   * Verification surface (BFF). The browser only ever calls cert_backend
   * (same-origin in prod, localhost:5050 in dev). cert_backend proxies to the
   * internal verifier-agent and EVF gateway and injects their secrets
   * server-side, so no upstream secret reaches the client.
   */
  VERIFY_PROXY: {
    BASE: `${CERT_API_BASE}/api/verify-proxy`,
    VERIFY: `${CERT_API_BASE}/api/verify-proxy/verify`,
    VERIFY_BULK: `${CERT_API_BASE}/api/verify-proxy/verify/bulk`,
    RESULT: (jobId: string) => `${CERT_API_BASE}/api/verify-proxy/result/${encodeURIComponent(jobId)}`,
    EVF: `${CERT_API_BASE}/api/verify-proxy/evf`,
    STATUS: `${CERT_API_BASE}/api/verify-proxy/status`,
  },

  // Trust-agent governance proxy (backend holds the trust-agent URL + key)
  TRUST_AGENT_PROXY: {
    BASE: `${MAIN_API_BASE}/api/governance/trust-agent`,
    HEALTH: `${MAIN_API_BASE}/api/governance/trust-agent/health`,
    CHAT: `${MAIN_API_BASE}/api/governance/trust-agent/chat`,
    POIC_COMPUTE: `${MAIN_API_BASE}/api/governance/trust-agent/poic/compute`,
  },

  // Oracle endpoints (use MAIN backend)
  ORACLE: {
    BASE: `${MAIN_API_BASE}/api/oracle`,
    SNAPSHOTS: `${MAIN_API_BASE}/api/oracle/snapshots`,
    SNAPSHOT_LATEST: `${MAIN_API_BASE}/api/oracle/snapshots/latest`,
    INSTITUTION: (walletAddress: string) => `${MAIN_API_BASE}/api/oracle/institution/${walletAddress}`,
    INGEST: `${MAIN_API_BASE}/api/oracle/ingest`,
    OVERRIDE: (walletAddress: string) => `${MAIN_API_BASE}/api/oracle/institution/${walletAddress}/override`
  },
  
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
    AUDIT_LOGS: `${MAIN_API_BASE}/api/admin/audit-logs`,
    PENDING_MINTS: `${MAIN_API_BASE}/api/admin/pending-mints`,
    PENDING_MINT_RECONCILE: (certificateId: string) => `${MAIN_API_BASE}/api/admin/pending-mints/${certificateId}/reconcile`,
    NOTIFICATIONS_SETTINGS: (email: string) => `${MAIN_API_BASE}/api/admin/notifications/settings/${encodeURIComponent(email)}`,
    KEYVAULT_AUDIT: `${MAIN_API_BASE}/api/admin/keyvault/audit`,
  },

  // Institution admin endpoints (use CERT backend)
  INSTITUTIONS_ADMIN: {
    BASE: `${CERT_API_BASE}/api/institutions/admin`,
    DLQ_SNAPSHOT: (institutionId?: string, dryRun?: boolean) => {
      const params = new URLSearchParams();
      if (institutionId) params.set('institutionId', institutionId);
      if (dryRun) params.set('dryRun', 'true');
      const qs = params.toString();
      return `${CERT_API_BASE}/api/institutions/admin/dlq${qs ? `?${qs}` : ''}`;
    },
    DLQ_REPLAY: `${CERT_API_BASE}/api/institutions/admin/dlq/replay`,
    CONNECTOR_ROTATE: (institutionId: string) => `${CERT_API_BASE}/api/institutions/admin/${institutionId}/connector/rotate-secret`,
    CONNECTOR_ROTATION_STATUS: (institutionId: string) => `${CERT_API_BASE}/api/institutions/admin/${institutionId}/connector/rotation-status`,
    CONNECTOR_ROTATION_AUDIT: `${CERT_API_BASE}/api/institutions/admin/connector/rotation-audit`,
    CONNECTOR_SYNC_KEYVAULT: (institutionId: string) => `${CERT_API_BASE}/api/institutions/admin/${institutionId}/connector/sync-keyvault`,
    CONNECTOR_SYNC_ALL_KEYVAULT: `${CERT_API_BASE}/api/institutions/admin/connector/sync-keyvault`,
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
    RETRY_MINT: (certificateId: string) => `${CERT_API_BASE}/api/certificates/${certificateId}/retry-mint`,
    RECONCILE: (certificateId: string) => `${CERT_API_BASE}/api/certificates/${certificateId}/reconcile`,
    WALLET_DIRECT_CONFIRM: `${CERT_API_BASE}/api/certificates/issue/wallet-direct/confirm`,
    SHARE_PACKAGE: (certificateId: string) => `${CERT_API_BASE}/api/student/share/${certificateId}/package`,
    SHARE_METHODS: (certificateId: string) => `${CERT_API_BASE}/api/student/share/${certificateId}/methods`,
    SHARE: (id: string) => `${CERT_API_BASE}/api/certificates/${id}/share`,
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
    PROFILE_LOGO: `${CERT_API_BASE}/api/institutions/profile/logo`,
    API_KEYS: `${CERT_API_BASE}/api/institutions/api-keys`,
    ISSUANCE_JOBS: `${CERT_API_BASE}/api/v1/issue/jobs`,
    PROFILE_SETTINGS: `${CERT_API_BASE}/api/institutions/profile/settings`,
    NOTIFICATION_PREFERENCES: `${CERT_API_BASE}/api/institutions/notification-preferences`,
    VERIFICATION_STATUS: `${CERT_API_BASE}/api/institutions/verification-status`,
    VERIFICATION_DOCUMENTS: `${CERT_API_BASE}/api/institutions/verification-documents`,
    CHANGE_PASSWORD: `${CERT_API_BASE}/auth/institution/change-password`,
    BLOCKCHAIN_STATUS: (institutionId: string) => `${CERT_API_BASE}/api/institutions/${institutionId}/blockchain-status`,
    BATCH_SIGNING: {
      STORE_KEY: (institutionId: string) => `${CERT_API_BASE}/api/institutions/${institutionId}/batch-signing/store-key`,
      REMOVE_KEY: (institutionId: string) => `${CERT_API_BASE}/api/institutions/${institutionId}/batch-signing/remove-key`,
      TEST_KEY: (institutionId: string) => `${CERT_API_BASE}/api/institutions/${institutionId}/batch-signing/test-key`,
      STATUS: (institutionId: string) => `${CERT_API_BASE}/api/institutions/${institutionId}/batch-signing/status`,
    },
    VARIANTS: (institutionId: string) => `${MAIN_API_BASE}/api/institutions/${institutionId}/variants`
  },

  // In-app notifications (institution dashboard)
  NOTIFICATIONS: {
    BASE: `${CERT_API_BASE}/api/notifications`,
    LIST: `${CERT_API_BASE}/api/notifications`,
    UNREAD_COUNT: `${CERT_API_BASE}/api/notifications/unread-count`,
    MARK_READ: (notificationId: string) => `${CERT_API_BASE}/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: `${CERT_API_BASE}/api/notifications/mark-all-read`,
  },

  // Email diagnostics/ops endpoints
  EMAIL: {
    BASE: `${CERT_API_BASE}/api/email`,
    HEALTH: `${CERT_API_BASE}/api/email/health`,
  },
  
  // LMS Import & Sync endpoints (use CERT backend)
  LMS_IMPORT: {
    BASE: `${CERT_API_BASE}/api/lms-import`,
    BATCHES: `${CERT_API_BASE}/api/lms-import/batches`,
    BATCH_STATUS: (batchId: string) => `${CERT_API_BASE}/api/lms-import/batches/${batchId}/status`,
    BATCH_UPLOAD: (batchId: string) => `${CERT_API_BASE}/api/lms-import/batches/${batchId}/upload`,
    BATCH_PREVIEW: (batchId: string) => `${CERT_API_BASE}/api/lms-import/batches/${batchId}/preview`,
    BATCH_LOGS: (batchId: string) => `${CERT_API_BASE}/api/lms-import/batches/${batchId}/logs`,
    BATCH_CANCEL: (batchId: string) => `${CERT_API_BASE}/api/lms-import/batches/${batchId}`,
    SCHEMA: (dataType: string) => `${CERT_API_BASE}/api/lms-import/schemas/csv/${dataType}`
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

  COMMERCIAL: {
    BASE: `${CERT_API_BASE}/api/commercial`,
    PLANS: `${CERT_API_BASE}/api/commercial/plans`,
    SUBSCRIPTION: `${CERT_API_BASE}/api/commercial/subscription`,
    CANCEL: `${CERT_API_BASE}/api/commercial/subscription/cancel`,
    CHECKOUT: `${CERT_API_BASE}/api/commercial/checkout`,
    INVOICES: `${CERT_API_BASE}/api/commercial/invoices`,
    INVOICE: (id: string) => `${CERT_API_BASE}/api/commercial/invoices/${id}`,
    USAGE: `${CERT_API_BASE}/api/commercial/usage`,
    EVENTS: `${CERT_API_BASE}/api/commercial/events`,
    VERIFY_CHAIN: `${CERT_API_BASE}/api/commercial/events/verify-chain`,
    PROVISIONING_JOBS: `${CERT_API_BASE}/api/commercial/admin/provisioning-jobs`,
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

export const API_BASE = API_CONFIG.MAIN;

// Connection test configuration
export const CONNECTION_CONFIG = {
  TIMEOUT: 15000, // 15 seconds for database operations
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

