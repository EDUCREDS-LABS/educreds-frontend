/**
 * Unified API Configuration
 * Centralizes all backend endpoints and environment variables
 */

// Environment variables with fallbacks
const MAIN_API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:3001";
const CERT_API_BASE = import.meta.env.VITE_CERT_API_BASE?.replace(/\/$/, "") || "http://localhost:3001";
const MARKETPLACE_API_BASE = import.meta.env.VITE_MARKETPLACE_API_BASE?.replace(/\/$/, "") || "http://localhost:3001";

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
    TEST: `${MAIN_API_BASE}/api/admin/test`,
    VERIFICATION_REQUESTS: `${MAIN_API_BASE}/api/admin/verification-requests`,
    REVENUE: `${MAIN_API_BASE}/api/admin/revenue`,
    BLOCKCHAIN_SUMMARY: `${MAIN_API_BASE}/api/admin/blockchain-summary`,
    BLOCKCHAIN_STATUS: `${MAIN_API_BASE}/api/admin/blockchain-status`,
    CHANGE_PASSWORD: `${MAIN_API_BASE}/api/admin/change-password`,
    USERS: `${MAIN_API_BASE}/api/admin/users`,
    AUDIT_LOGS: `${MAIN_API_BASE}/api/admin/audit-logs`
  },
  
  // Oracle endpoints (DEPRECATED - replaced by AI Intelligence Layer for PoIC scoring, proposals, and monitoring)
  // ORACLE: {
  //   BASE: `${MAIN_API_BASE}/api/oracle`,
  //   SNAPSHOT_LATEST: `${MAIN_API_BASE}/api/oracle/snapshot/latest`,
  //   SNAPSHOTS: `${MAIN_API_BASE}/api/oracle/snapshots`,
  //   INSTITUTION: (walletAddress: string) => `${MAIN_API_BASE}/api/oracle/institution/${walletAddress}`,
  //   SUBMIT_DOCUMENTS: (walletAddress: string) => `${MAIN_API_BASE}/api/oracle/institution/${walletAddress}/documents`,
  //   INGEST: `${MAIN_API_BASE}/api/oracle/ingest`,
  //   OVERRIDE: (walletAddress: string) => `${MAIN_API_BASE}/api/oracle/institution/${walletAddress}/override`
  // },
  
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
    LOGIN: `${CERT_API_BASE}/api/institutions/login`,
    REGISTER: `${CERT_API_BASE}/api/institutions/register`,
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