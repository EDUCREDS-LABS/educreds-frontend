import { API_CONFIG } from "@/config/api";
import { auth, getAuthHeaders } from "./auth";
import { AdminAuth } from "./admin-auth";
import { transformDocumentsForBackend } from "@/utils/documentTransform";
import { ethers } from "ethers";

console.log("Using API configuration:", {
  MAIN: API_CONFIG.MAIN,
  CERT: API_CONFIG.CERT,
  MARKETPLACE: API_CONFIG.MARKETPLACE
});

// Helper function to get admin headers
const getAdminHeaders = (): Record<string, string> => {
  const adminEmail = AdminAuth.getAdminEmail();
  if (!adminEmail) {
    throw new Error("Admin not authenticated");
  }
  return { "admin-email": adminEmail };
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    let errorMessage = response.statusText;

    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
    } catch {
      // If response is HTML (like error page), extract meaningful error
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        errorMessage = `Server error (${response.status}): ${response.statusText}`;
      } else {
        errorMessage = text || errorMessage;
      }
    }

    throw new ApiError(response.status, errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CREDENTIAL_ISSUER_ABI = [
  "function issueCredential(uint256 institutionId, address recipient, string credentialURI) external returns (uint256 credentialId)",
];

const isPlaceholderAddress = (address?: string): boolean => {
  if (!address) return true;
  const normalized = address.trim().toLowerCase();
  return (
    normalized === "0x1234567890123456789012345678901234567890" ||
    normalized === "0x0000000000000000000000000000000000000000"
  );
};

async function tryWalletDirectIssuance(formData: FormData, authHeaders: Record<string, string>) {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("No Web3 wallet detected");
  }

  const prepareResponse = await fetch(`${API_CONFIG.CERT}/api/certificates/issue/wallet-direct/prepare`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });
  const prepared = await handleResponse(prepareResponse);

  const contractAddress =
    import.meta.env.VITE_CREDENTIAL_ISSUER_ADDRESS ||
    prepared?.credentialIssuerAddress ||
    import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!contractAddress || isPlaceholderAddress(contractAddress)) {
    throw new Error(
      "Wallet-direct issuance is enabled but CredentialIssuer address is missing/placeholder. Set VITE_CREDENTIAL_ISSUER_ADDRESS to your deployed contract address.",
    );
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, CREDENTIAL_ISSUER_ABI, signer);

  const tx = await contract.issueCredential(
    Number(prepared.institutionTokenId),
    prepared.recipientWallet,
    prepared.credentialURI,
  );
  const receipt = await tx.wait();
  if (!receipt?.hash) {
    throw new Error("Wallet transaction mined but tx hash is missing");
  }

  const confirmResponse = await fetch(`${API_CONFIG.CERT}/api/certificates/issue/wallet-direct/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      issuanceRequestId: prepared.issuanceRequestId,
      txHash: receipt.hash,
    }),
  });
  const confirmed = await handleResponse(confirmResponse);

  return {
    ...confirmed,
    onChainStatus: "minted_wallet_direct",
    issuanceMode: "wallet_direct",
  };
}

export const api = {
  // Health check
  healthCheck: async () => {
    const response = await fetch(API_CONFIG.HEALTH.CERT);
    return handleResponse(response);
  },

  // Test admin endpoint
  testAdmin: async () => {
    const response = await fetch(API_CONFIG.ADMIN.TEST, {
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  // Admin blockchain management
  getBlockchainSummary: async () => {
    const response = await fetch(API_CONFIG.ADMIN.BLOCKCHAIN_SUMMARY, {
      headers: getAdminHeaders(),
    });
    const data = await handleResponse(response);
    return {
      summary: {
        totalInstitutions: data.totalInstitutions ?? 0,
        verifiedInstitutions: data.totalInstitutions ?? 0,
        blockchainRegistered: data.registeredOnChain ?? 0,
        blockchainAuthorized: data.registeredOnChain ?? 0,
        pendingBlockchainRegistration: data.pendingRegistration ?? 0,
        pendingBlockchainAuthorization: 0,
      },
    };
  },

  getBlockchainStatusAll: async () => {
    const response = await fetch(API_CONFIG.ADMIN.BLOCKCHAIN_STATUS, {
      headers: getAdminHeaders(),
    });
    const data = await handleResponse(response);
    const statusReport = (data.institutions || []).map((inst: any) => ({
      id: inst.id,
      name: inst.name,
      email: inst.email,
      walletAddress: inst.walletAddress || '',
      backendVerified: inst.verificationStatus === 'approved',
      blockchainRegistered: inst.blockchainStatus === 'registered' || inst.blockchainStatus === 'authorized',
      blockchainAuthorized: inst.blockchainStatus === 'authorized',
      blockchainStats: null,
      blockchainError: null,
      blockchainTxHash: inst.registrationTxHash,
      blockchainAuthTxHash: inst.authorizationTxHash,
    }));
    return { statusReport };
  },

  registerInstitutionOnBlockchain: async (institutionId: string) => {
    const response = await fetch(`${API_CONFIG.ADMIN.BASE}/institutions/${institutionId}/blockchain-register`, {
      method: "POST",
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  authorizeInstitutionOnBlockchain: async (institutionId: string) => {
    const response = await fetch(`${API_CONFIG.ADMIN.BASE}/institutions/${institutionId}/blockchain-authorize`, {
      method: "POST",
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  bulkRegisterInstitutionsOnBlockchain: async () => {
    const response = await fetch(`${API_CONFIG.ADMIN.BASE}/blockchain-register-all`, {
      method: "POST",
      headers: getAdminHeaders(),
    });
    const data = await handleResponse(response);
    return {
      ...data,
      summary: {
        successful: data.count ?? 0,
      },
    };
  },

  getBlockchainStatus: async (institutionId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(API_CONFIG.INSTITUTIONS.BLOCKCHAIN_STATUS(institutionId), {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  getAdminUsers: async () => {
    const response = await fetch(API_CONFIG.ADMIN.USERS, {
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  createAdminUser: async (userData: { email: string; name: string; role: string; password: string }) => {
    const response = await fetch(API_CONFIG.ADMIN.USERS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  updateAdminUser: async (userId: string, updates: { name?: string; role?: string; isActive?: boolean }) => {
    const response = await fetch(`${API_CONFIG.ADMIN.USERS}/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  deleteAdminUser: async (userId: string) => {
    const response = await fetch(`${API_CONFIG.ADMIN.USERS}/${userId}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  // Auth endpoints - Platform authentication (uses unified API)
  login: async (credentials: { email: string; password: string; otp?: string; otpToken?: string }) => {
    const response = await fetch(API_CONFIG.INSTITUTIONS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies for session
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  register: async (data: any) => {
    // Transform verificationDocuments to URLs for backend
    const transformedData = {
      ...data,
      verificationDocuments: data.verificationDocuments ?
        transformDocumentsForBackend(data.verificationDocuments) : []
    };

    const response = await fetch(API_CONFIG.INSTITUTIONS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies for session
      body: JSON.stringify(transformedData),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_CONFIG.CERT}/auth/logout`, {
      method: "POST",
      credentials: "include", // Include cookies for session
    });
    return handleResponse(response);
  },

  verifySession: async () => {
    const response = await fetch(`${API_CONFIG.CERT}/auth/verify-session`, {
      credentials: "include", // Include cookies for session
    });
    return handleResponse(response);
  },

  // Institution endpoints
  getProfile: async () => {
    const user = auth.getUser();
    const response = await fetch(API_CONFIG.INSTITUTIONS.PROFILE, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionId: user?.sub })
    });
    return handleResponse(response);
  },

  getVerificationStatus: async () => {
    const response = await fetch(API_CONFIG.INSTITUTIONS.VERIFICATION_STATUS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  uploadVerificationDocuments: async (formData: FormData) => {
    const token = localStorage.getItem('institution_token');

    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(API_CONFIG.INSTITUTIONS.VERIFICATION_DOCUMENTS, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    return handleResponse(response);
  },

  // Oracle endpoints - DEPRECATED (replaced by AI Intelligence Layer)
  // These endpoints are kept for backwards compatibility but may be removed in future versions
  getInstitutionOracleStatus: async (walletAddress?: string) => {
    // Feature deprecated - return mock data
    console.warn('Oracle endpoints are deprecated. Please use AI Intelligence Layer instead.');
    return {
      status: 'deprecated',
      message: 'Oracle feature has been replaced by AI Intelligence Layer'
    };
  },

  submitOracleDocuments: async (walletAddress: string, formData: FormData) => {
    // Feature deprecated
    console.warn('Oracle endpoints are deprecated. Please use AI Intelligence Layer instead.');
    throw new Error('Oracle feature has been deprecated');
  },

  getOracleSnapshot: async () => {
    // Feature deprecated
    console.warn('Oracle endpoints are deprecated. Please use AI Intelligence Layer instead.');
    return {
      status: 'deprecated',
      message: 'Oracle feature has been replaced by AI Intelligence Layer'
    };
  },

  // Certificate endpoints
  issueCertificate: async (formData: FormData) => {
    const authHeaders = getAuthHeaders();
    const walletDirectEnabled = String(import.meta.env.VITE_ENABLE_WALLET_DIRECT_ISSUANCE ?? "true").toLowerCase() !== "false";
    let walletDirectFailureReason: string | undefined;

    if (walletDirectEnabled && typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        return await tryWalletDirectIssuance(formData, authHeaders);
      } catch (error) {
        walletDirectFailureReason = error instanceof Error ? error.message : String(error);
        console.warn("[API] Wallet-direct issuance failed, falling back to backend signer mode:", error);
      }
    }

    const response = await fetch(API_CONFIG.CERTIFICATES.ISSUE, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
    const fallback = await handleResponse(response);
    return {
      ...fallback,
      onChainStatus: fallback?.onChainStatus || "minted_backend_fallback",
      issuanceMode: "backend_fallback",
      walletDirectAttempted: walletDirectEnabled && typeof window !== "undefined" && typeof window.ethereum !== "undefined",
      walletDirectFailureReason,
    };
  },

  // Privacy-First Certificate Issuance
  // Backend will:
  // 1. Wrap personal data in DID document
  // 2. Create W3C credential
  // 3. Store both on IPFS
  // 4. Store only DIDs and IPFS hashes in database
  issueCertificatePrivacyFirst: async (formData: FormData) => {
    const authHeaders = getAuthHeaders();
    console.log('[API] issueCertificatePrivacyFirst called');
    console.log('[API] Auth headers present:', Object.keys(authHeaders).length > 0);

    // Use standard issue endpoint with privacy flag
    const url = `${API_CONFIG.CERTIFICATES.ISSUE}?privacy=true`;
    console.log('[API] Fetching from URL:', url);

    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    console.log('[API] Response status:', response.status);
    return handleResponse(response);
  },

  updateCertificateAfterMint: async (certificateId: string, data: { tokenId: number; walletAddress: string }) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.ONCHAIN_MINT(certificateId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getCertificates: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(API_CONFIG.CERTIFICATES.INSTITUTION, {
      headers: authHeaders,
    });
    const data = await handleResponse(response);
    // Normalize response shape
    const list = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.certificates)
        ? (data as any).certificates
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

    const certificates = list.map((c: any) => ({
      id: c.id ?? c._id ?? c.uuid ?? String(c.tokenId ?? c._id ?? Math.random()),
      studentAddress: c.studentAddress,
      studentName: c.studentName,
      courseName: c.courseName,
      grade: c.grade,
      ipfsHash: c.ipfsHash,
      completionDate: c.completionDate,
      certificateType: c.certificateType ?? "Academic",
      issuedBy: c.issuedBy?._id ?? c.issuedBy ?? "",
      institutionName: c.institutionName,
      issuedAt: c.issuedAt ?? c.createdAt ?? c.issueDate,
      isValid: c.isValid ?? true,
      isMinted: c.isMinted ?? Boolean(c.tokenId),
      tokenId: c.tokenId,
      mintedTo: c.mintedTo,
      mintedAt: c.mintedAt,
    }));

    return { certificates } as any;
  },

  updateCertificate: async (id: string, updates: any) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  revokeCertificate: async (id: string, reason: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/${id}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  bulkIssueCertificates: async (data: any) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/bulk/certificates/bulk-issue`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Verification Methods
  verifyCertificate: async (id: string) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.VERIFY(id));
    return handleResponse(response);
  },

  verifyCertificateByIPFS: async (ipfsHash: string) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.VERIFY_IPFS(ipfsHash));
    return handleResponse(response);
  },

  verifyCertificateByToken: async (tokenId: number) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.VERIFY_TOKEN(tokenId));
    return handleResponse(response);
  },

  verifyW3CCredential: async (credential: any) => {
    const response = await fetch(API_CONFIG.W3C.VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    return handleResponse(response);
  },

  verifyHybridCredential: async (data: { w3cCredential: any; tokenId?: number }) => {
    const response = await fetch(API_CONFIG.W3C.HYBRID_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Sharing Methods
  getSharePackage: async (certificateId: string) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.SHARE_PACKAGE(certificateId));
    return handleResponse(response);
  },

  getShareMethods: async (certificateId: string) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.SHARE_METHODS(certificateId));
    return handleResponse(response);
  },

  // Get certificates by wallet address
  getCertificatesByWallet: async (walletAddress: string) => {
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/wallet/${walletAddress}`);
    return handleResponse(response);
  },

  // Get statistics
  getStats: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/stats`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  // Connect wallet
  connectWallet: async (walletAddress: string) => {
    const response = await fetch(`${API_CONFIG.CERT}/api/students/connect-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });
    return handleResponse(response);
  },

  getBulkStatus: async (jobId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/bulk/certificates/bulk-status/${jobId}`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  downloadBulkZip: async (jobId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/bulk/certificates/bulk-download/${jobId}`, {
      headers: authHeaders,
    });
    if (!response.ok) {
      throw new Error("Failed to download bulk certificates");
    }
    return response.blob();
  },

  // New unified issuance methods
  issueFromTemplate: async (data: {
    templateId: string;
    recipientWallet: string;
    recipientName: string;
    completionDate: string;
    certificateType: string;
    courseId?: string;
    grade?: string;
    additionalData?: any;
  }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/issue-from-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  bulkIssueFromTemplate: async (data: {
    templateId: string;
    certificates: Array<{
      studentName: string;
      studentEmail: string;
      walletAddress: string;
      completionDate: string;
      grade?: string;
      courseName?: string;
    }>;
  }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk-issue-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  bulkIssueLegacyPDF: async (formData: FormData) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk-issue-legacy-pdf`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
    return handleResponse(response);
  },

  // Template management methods
  getTemplateSpecs: async (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_CONFIG.CERT}/templates/specs${query}`);
    return handleResponse(response);
  },

  deleteTemplate: async (templateId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/templates/${templateId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  updateTemplateStatus: async (templateId: string, status: 'active' | 'draft' | 'archived') => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  bulkDeleteTemplates: async (templateIds: string[]) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/templates/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ templateIds }),
    });
    return handleResponse(response);
  },

  // Subscription methods
  getCurrentSubscription: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/subscription/current`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  subscribe: async (data: { planId: string; paymentMethod: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/subscription/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  cancelSubscription: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/subscription/cancel`, {
      method: "POST",
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  // Stripe Payment Methods
  createStripePaymentIntent: async (data: { planId: string; amount: number; currency: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/payments/stripe/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  confirmSubscriptionPayment: async (data: { planId: string; paymentIntentId: string; paymentMethod: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/payments/stripe/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // PayPal Payment Methods
  createPayPalOrder: async (data: { planId: string; amount: number; currency: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/payments/paypal/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  capturePayPalOrder: async (data: { orderId: string; planId: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/payments/paypal/capture-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Crypto Payment Methods
  createCryptoPayment: async (data: { planId: string; cryptoCurrency: string; walletAddress: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/payments/crypto/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  confirmCryptoPayment: async (data: { planId: string; transactionHash: string; cryptoCurrency: string; walletAddress: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/payments/crypto/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Marketplace Authentication (Firebase)
  marketplaceLogin: async (email: string, password: string) => {
    return auth.marketplaceLogin(email, password);
  },

  marketplaceRegister: async (email: string, password: string) => {
    return auth.marketplaceRegister(email, password);
  },

  // Dual Auth Methods
  institutionLogin: async (email: string, password: string) => {
    return auth.institutionLogin(email, password);
  },

  institutionRegister: async (data: any) => {
    return auth.institutionRegister(data);
  },

  getCurrentAuthType: () => auth.getCurrentAuthType(),
  canAccessMarketplace: () => auth.canAccessMarketplace(),
  getMarketplacePermissions: () => auth.getMarketplacePermissions(),

  // Governance endpoints
  governance: {
    createProposal: async (data: any) => {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.CERT}/governance/proposal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },

    getProposal: async (id: string) => {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.CERT}/governance/proposal/${id}`, {
        headers: authHeaders,
      });
      return handleResponse(response);
    },

    getAllProposals: async () => {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.CERT}/governance/proposals`, {
        headers: authHeaders,
      });
      return handleResponse(response);
    },

    voteOnProposal: async (proposalId: number, vote: number, institutionId?: string) => {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.CERT}/governance/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ proposalId, vote, institutionId }),
      });
      return handleResponse(response);
    },

    getVotingPower: async (institutionId?: string) => {
      const authHeaders = getAuthHeaders();
      const response = await fetch(
        `${API_CONFIG.CERT}/governance/voting-power${institutionId ? `?institutionId=${institutionId}` : ""}`,
        { headers: authHeaders }
      );
      return handleResponse(response);
    },

    submitDispute: async (data: any) => {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.CERT}/governance/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },

    getDisputes: async (institutionId?: string) => {
      const authHeaders = getAuthHeaders();
      const response = await fetch(
        `${API_CONFIG.CERT}/governance/disputes${institutionId ? `?institutionId=${institutionId}` : ""}`,
        { headers: authHeaders }
      );
      return handleResponse(response);
    },

    getPoICScore: async (institutionId: string) => {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_CONFIG.CERT}/governance/poic-score/${institutionId}`, {
        headers: authHeaders,
      });
      return handleResponse(response);
    },
  },
};
