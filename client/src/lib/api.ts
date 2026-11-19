import { API_CONFIG } from "@/config/api";
import { auth, getAuthHeaders } from "./auth";
import { transformDocumentsForBackend } from "@/utils/documentTransform";
import { ethers, Eip1193Provider } from "ethers";
import { walletService } from "./walletService";
import { clearAuthStorage, getInstitutionToken } from "./authStorage";

// Extended EIP-1193 provider interface for wallet providers like MetaMask
interface EthereumProvider extends Eip1193Provider {
  isMetaMask?: boolean;
  isConnected?: () => boolean;
  networkVersion?: string;
  chainId?: string;
}

// Note: For wallet connection in utility functions, we use window.ethereum directly.


export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

let authRecoveryInProgress = false;

function recoverFromUnauthorized() {
  if (typeof window === "undefined" || authRecoveryInProgress) {
    return;
  }

  // Local auth bypass must not be kicked to /login by commercial 401/403s.
  const bypassAuth =
    import.meta.env.DEV &&
    String(import.meta.env.VITE_BYPASS_AUTH ?? "false").toLowerCase() === "true";
  if (bypassAuth) {
    return;
  }

  authRecoveryInProgress = true;
  try {
    clearAuthStorage();

    const path = window.location.pathname || "/";
    const isProtectedPath =
      path.startsWith("/institution") ||
      path.startsWith("/admin");
    const isAlreadyOnLogin =
      path === "/login" ||
      path === "/admin/login";

    if (isProtectedPath && !isAlreadyOnLogin) {
      window.location.href = "/login";
    }
  } finally {
    // Small delay to prevent immediate re-entry while redirect is occurring.
    setTimeout(() => {
      authRecoveryInProgress = false;
    }, 1000);
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      recoverFromUnauthorized();
    }

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

// Note: For wallet connection in utility functions, we use window.ethereum directly.
// The Window.ethereum type is declared in useWallet.ts

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

const isWalletDirectEnabled = (): boolean =>
  String(import.meta.env.VITE_ENABLE_WALLET_DIRECT_ISSUANCE ?? "true").toLowerCase() !== "false";

// A wallet provider is available when either an injected provider (MetaMask/Coinbase)
// exists OR the app has an active WalletConnect/AppKit session. Gating only on
// `window.ethereum` silently skips signing for WalletConnect users.
const hasWalletProvider = (): boolean => {
  if (typeof window === "undefined") return false;
  if (typeof (window as { ethereum?: unknown }).ethereum !== "undefined") return true;

  // WalletConnect/AppKit can still open a connect modal even when not connected yet.
  if (String(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "").trim()) {
    return true;
  }

  try {
    return walletService.isConnected();
  } catch (error) {
    console.warn("[API] walletService.isConnected() threw:", error);
    return false;
  }
};

const toHexChainId = (chainId: number): string => `0x${Number(chainId).toString(16)}`;

const CHAIN_CONFIG: Record<number, { chainName: string; rpcUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number }; blockExplorerUrls: string[] }> = {
  84532: {
    chainName: "Base Sepolia",
    rpcUrls: ["https://sepolia.base.org", "https://base-sepolia-rpc.publicnode.com"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://sepolia.basescan.org"],
  },
  8453: {
    chainName: "Base",
    rpcUrls: ["https://mainnet.base.org", "https://base-rpc.publicnode.com"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://basescan.org"],
  },
};

async function ensureWalletChain(chainId?: number) {
  if (!chainId) {
    return;
  }
  const provider = walletService.getRawProvider();
  if (!provider) return; // or throw error

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(chainId) }],
    });
  } catch (error: any) {
    const code = Number(error?.code);
    const chainMeta = CHAIN_CONFIG[Number(chainId)];
    if ((code === 4902 || code === -32603) && chainMeta) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: toHexChainId(chainId),
              chainName: chainMeta.chainName,
              rpcUrls: chainMeta.rpcUrls,
              nativeCurrency: chainMeta.nativeCurrency,
              blockExplorerUrls: chainMeta.blockExplorerUrls,
            },
          ],
        });
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: toHexChainId(chainId) }],
        });
        return;
      } catch (addError: any) {
        console.warn("[API] wallet_addEthereumChain failed:", addError?.message || addError);
      }
    }
    // Keep going; transaction may still fail with clearer wallet-specific error.
    console.warn("[API] Chain switch skipped/failed:", error?.message || error);
  }
}

async function submitWalletDirectIssuanceTx(prepared: any): Promise<string> {
  if (!walletService.isConnected()) {
    await walletService.connect();
  }
  const signer = walletService.getSigner();
  if (!signer) throw new Error("Could not get wallet signer.");
  await ensureWalletChain(Number(prepared?.transactionData?.chainId || 0));

  if (prepared?.transactionData?.to && prepared?.transactionData?.data) {
    const tx = await signer.sendTransaction({
      to: prepared.transactionData.to,
      data: prepared.transactionData.data,
      gasLimit: prepared.transactionData.gasEstimate
        ? BigInt(prepared.transactionData.gasEstimate)
        : undefined,
    });
    const receipt = await tx.wait();
    if (!receipt?.hash) {
      throw new Error("Wallet transaction mined but tx hash is missing");
    }
    return receipt.hash;
  }

  const contractAddress =
    import.meta.env.VITE_CREDENTIAL_ISSUER_ADDRESS ||
    prepared?.credentialIssuerAddress ||
    import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!contractAddress || isPlaceholderAddress(contractAddress)) {
    throw new Error(
      "Wallet-direct issuance is enabled but CredentialIssuer address is missing/placeholder. Set VITE_CREDENTIAL_ISSUER_ADDRESS to your deployed contract address.",
    );
  }

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
  return receipt.hash;
}

async function tryWalletDirectIssuance(formData: FormData, authHeaders: Record<string, string>) {
  const prepareResponse = await fetch(`${API_CONFIG.CERT}/api/certificates/issue/wallet-direct/prepare`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });
  const prepared = await handleResponse(prepareResponse);
  const txHash = await submitWalletDirectIssuanceTx(prepared);

  try {
    const confirmResponse = await fetch(`${API_CONFIG.CERT}/api/certificates/issue/wallet-direct/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        issuanceRequestId: prepared.issuanceRequestId,
        txHash,
      }),
    });
    const confirmed = await handleResponse(confirmResponse);

    return {
      ...confirmed,
      onChainStatus: "minted_wallet_direct",
      issuanceMode: "wallet_direct",
    };
  } catch (error) {
    // Transaction is already mined at this point. Do not fall back to backend issuance,
    // otherwise the same certificate request can be minted twice.
    const walletError = error instanceof Error ? error.message : String(error);
    return {
      ...prepared,
      blockchainTxHash: txHash,
      onChainStatus: "pending_wallet_confirmation",
      issuanceMode: "wallet_direct_pending_confirmation",
      walletDirectAttempted: true,
      walletDirectFailureReason: walletError,
    };
  }
}

async function confirmWalletDirectIssuanceIfNeeded(
  issuanceResponse: any,
  authHeaders: Record<string, string>,
) {
  if (!issuanceResponse?.walletDirectRequired) {
    return issuanceResponse;
  }

  if (!issuanceResponse?.issuanceRequestId) {
    throw new Error("walletDirectRequired response is missing issuanceRequestId");
  }

  const txHash = await submitWalletDirectIssuanceTx(issuanceResponse);
  const confirmResponse = await fetch(`${API_CONFIG.CERT}/api/certificates/issue/wallet-direct/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      issuanceRequestId: issuanceResponse.issuanceRequestId,
      txHash,
    }),
  });
  const confirmed = await handleResponse(confirmResponse);

  return {
    ...issuanceResponse,
    ...confirmed,
    blockchainTxHash: txHash,
    onChainStatus: "minted_wallet_direct",
    issuanceMode: "wallet_direct",
  };
}

const apiBase = {
  getCredentialPipeline: async (certificateId: string) => {
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/${encodeURIComponent(certificateId)}/pipeline`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  getPipelineSummary: async () => {
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/institution/pipeline-summary`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  retryAnchorJob: async (certificateId: string, jobType: string) => {
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/${encodeURIComponent(certificateId)}/retry-anchor`, {
      method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ jobType }),
    });
    return handleResponse(response);
  },
  exportVerifierReport: async (format: 'csv' | 'json', from?: string, to?: string) => {
    const params = new URLSearchParams({ format });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const response = await fetch(`${API_CONFIG.CERT}/api/verifier/reports/export?${params}`, { headers: getAuthHeaders() });
    if (!response.ok) return handleResponse(response);
    if (format === 'json') return handleResponse(response);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a'); link.href = url; link.download = 'verification-report.csv';
      document.body.appendChild(link); link.click(); link.remove();
    } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
  },
  saveBranding: async (data: { badgeAccentColor?: string | null; badgeLogoUrl?: string | null; badgeTagline?: string | null; badgeDefaultVariant?: string; pdfLayout?: string; pdfSignatureUrl?: string | null }) => {
    const response = await fetch(`${API_CONFIG.CERT}/api/institutions/branding`, { method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return handleResponse(response);
  },
  uploadBrandingLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const data = new FormData(); data.append('logo', file);
    const response = await fetch(`${API_CONFIG.CERT}/api/institutions/profile/logo`, { method: 'POST', headers: getAuthHeaders(), body: data });
    return handleResponse(response);
  },
  getBadgePreview: async (data: { institutionName: string; credentialType: string; issueYear: string; variant?: string; accentColor?: string; logoUrl?: string }): Promise<string> => {
    const response = await fetch(`${API_CONFIG.CERT}/api/badges/preview`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) await handleResponse(response);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Badge preview returned an invalid image');
    // Convert blob to data URL to avoid CSP blob: restrictions
    // CSP allows data: URLs in img-src, but not blob: URLs
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert badge preview to data URL'));
      reader.readAsDataURL(blob);
    });
  },
  downloadCredentialPDF: async (certificateId: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/${encodeURIComponent(certificateId)}/pdf`, { headers: getAuthHeaders() });
    if (!response.ok) await handleResponse(response);
    const blob = await response.blob();
    if (!blob.type.includes('pdf')) throw new Error('Certificate download returned an invalid PDF');
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a'); link.href = url; link.download = `credential-${certificateId}.pdf`;
      document.body.appendChild(link); link.click(); link.remove();
    } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
  },
  // Health check
  healthCheck: async () => {
    const response = await fetch(API_CONFIG.HEALTH.CERT);
    return handleResponse(response);
  },

  // Test admin endpoint
  testAdmin: async () => {
    const response = await fetch(API_CONFIG.ADMIN.TEST, {
      credentials: "include",
    });
    return handleResponse(response);
  },

  // Admin blockchain management
  getBlockchainSummary: async () => {
    const response = await fetch(API_CONFIG.ADMIN.BLOCKCHAIN_SUMMARY, {
      credentials: "include",
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
      credentials: "include",
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

  authorizeInstitutionOnBlockchain: async (institutionId: string) => {
    const response = await fetch(`${API_CONFIG.ADMIN.BASE}/institutions/${institutionId}/blockchain-authorize`, {
      method: "POST",
      credentials: "include",
    });
    return handleResponse(response);
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
      credentials: "include",
    });
    return handleResponse(response);
  },

  createAdminUser: async (userData: { email: string; name: string; role: string; password: string }) => {
    const response = await fetch(API_CONFIG.ADMIN.USERS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  updateAdminUser: async (userId: string, updates: { name?: string; role?: string; isActive?: boolean }) => {
    const response = await fetch(`${API_CONFIG.ADMIN.USERS}/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  deleteAdminUser: async (userId: string) => {
    const response = await fetch(`${API_CONFIG.ADMIN.USERS}/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    return handleResponse(response);
  },

  getAuditLogs: async (params?: { limit?: number; offset?: number; type?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.type) query.set("type", params.type);
    if (params?.severity) query.set("severity", params.severity);
    
    const response = await fetch(`${API_CONFIG.ADMIN.AUDIT_LOGS}?${query.toString()}`, {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    return handleResponse(response);
  },

  getSystemHealth: async () => {
    const authHeaders = getAuthHeaders();
    const [main, cert, marketplace] = await Promise.allSettled([
      fetch(API_CONFIG.HEALTH.MAIN, { headers: authHeaders, credentials: "include" }).then(handleResponse),
      fetch(API_CONFIG.HEALTH.CERT, { headers: authHeaders, credentials: "include" }).then(handleResponse),
      fetch(API_CONFIG.HEALTH.MARKETPLACE, { headers: authHeaders, credentials: "include" }).then(handleResponse),
    ]);
    
    return {
      main: main.status === 'fulfilled' ? main.value : { status: 'down', error: main.reason },
      cert: cert.status === 'fulfilled' ? cert.value : { status: 'down', error: cert.reason },
      marketplace: marketplace.status === 'fulfilled' ? marketplace.value : { status: 'down', error: marketplace.reason },
    };
  },

  getIndexerStatus: async () => {
    const response = await fetch(API_CONFIG.INDEXER.SYNC_STATUS, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Phase C backend follow-up — RBAC matrix (replaces frontend mock grants).
  getRbacMatrix: async () => {
    const response = await fetch(`${API_CONFIG.CERT}/api/auth/rbac/matrix`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Phase C backend follow-up — institution-scoped trust summary (Verification
  // Overview / Trust dashboard aggregate).
  getTrustSummary: async (institutionId?: string) => {
    const authHeaders = getAuthHeaders();
    const params = new URLSearchParams();
    if (institutionId) params.set("institutionId", institutionId);
    const query = params.toString();
    const response = await fetch(
      `${API_CONFIG.CERT}/api/institutions/trust-summary${query ? `?${query}` : ""}`,
      { headers: authHeaders }
    );
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
    const response = await fetch(API_CONFIG.INSTITUTIONS.PROFILE, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  getInstitutionNotificationPreferences: async () => {
    const response = await fetch(API_CONFIG.INSTITUTIONS.NOTIFICATION_PREFERENCES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  updateInstitutionNotificationPreferences: async (payload: {
    proposalUpdates?: boolean;
    governanceAlerts?: boolean;
    certificateEvents?: boolean;
    systemAnnouncements?: boolean;
    verificationStatus?: boolean;
    notificationsEnabled?: boolean;
    contactEmails?: string[];
    preferredContactMethod?: "email" | "dashboard" | "both";
  }) => {
    const response = await fetch(API_CONFIG.INSTITUTIONS.NOTIFICATION_PREFERENCES, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getNotifications: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.unreadOnly !== undefined) query.set("unreadOnly", String(params.unreadOnly));
    const url = query.toString()
      ? `${API_CONFIG.NOTIFICATIONS.LIST}?${query.toString()}`
      : API_CONFIG.NOTIFICATIONS.LIST;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  getUnreadNotificationCount: async () => {
    const response = await fetch(API_CONFIG.NOTIFICATIONS.UNREAD_COUNT, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await fetch(API_CONFIG.NOTIFICATIONS.MARK_READ(notificationId), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  markAllNotificationsAsRead: async () => {
    const response = await fetch(API_CONFIG.NOTIFICATIONS.MARK_ALL_READ, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  getEmailHealth: async (hours: number = 24) => {
    const url = `${API_CONFIG.EMAIL.HEALTH}?hours=${encodeURIComponent(String(hours))}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
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

  changeInstitutionPassword: async (oldPassword: string, newPassword: string) => {
    const response = await fetch(API_CONFIG.INSTITUTIONS.CHANGE_PASSWORD, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    return handleResponse(response);
  },

  uploadVerificationDocuments: async (formData: FormData) => {
    const token = getInstitutionToken();

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

  // LMS Import & Sync endpoints
  createLmsImportBatch: async (payload: { batchName: string; dataType: string; importConfig?: Record<string, any> }) => {
    const response = await fetch(API_CONFIG.LMS_IMPORT.BATCHES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getLmsImportBatches: async (params?: { limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.limit !== undefined) search.set("limit", String(params.limit));
    if (params?.offset !== undefined) search.set("offset", String(params.offset));
    const url = search.toString()
      ? `${API_CONFIG.LMS_IMPORT.BATCHES}?${search.toString()}`
      : API_CONFIG.LMS_IMPORT.BATCHES;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getLmsImportBatchStatus: async (batchId: string) => {
    const response = await fetch(API_CONFIG.LMS_IMPORT.BATCH_STATUS(batchId), {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  cancelLmsImportBatch: async (batchId: string) => {
    const response = await fetch(API_CONFIG.LMS_IMPORT.BATCH_CANCEL(batchId), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  uploadLmsImportCsv: async (batchId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(API_CONFIG.LMS_IMPORT.BATCH_UPLOAD(batchId), {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
    return handleResponse(response);
  },

  previewLmsImportBatch: async (batchId: string) => {
    const response = await fetch(API_CONFIG.LMS_IMPORT.BATCH_PREVIEW(batchId), {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getLmsImportLogs: async (batchId: string, params?: { limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.limit !== undefined) search.set("limit", String(params.limit));
    if (params?.offset !== undefined) search.set("offset", String(params.offset));
    const url = search.toString()
      ? `${API_CONFIG.LMS_IMPORT.BATCH_LOGS(batchId)}?${search.toString()}`
      : API_CONFIG.LMS_IMPORT.BATCH_LOGS(batchId);
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getLmsImportSchema: async (dataType: string) => {
    const response = await fetch(API_CONFIG.LMS_IMPORT.SCHEMA(dataType), {
      headers: getAuthHeaders(),
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

  // Trust Agent endpoints — proxied through cert_backend.
  // The Trust Agent only accepts service API keys (never browser JWTs),
  // so the backend bridges admin-JWT auth to service-key auth.
  trustAgent: {
    getObservabilityData: async () => {
      const response = await fetch(`${API_CONFIG.MAIN}/api/governance/trust-agent/observability`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
    getSystemHealth: async () => {
      const response = await fetch(`${API_CONFIG.MAIN}/api/governance/trust-agent/health`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    }
  },

  // Certificate endpoints
  issueCertificate: async (formData: FormData) => {
    const authHeaders = getAuthHeaders();
    const walletDirectEnabled = isWalletDirectEnabled();
    const walletAvailable = walletDirectEnabled && hasWalletProvider();

    if (walletAvailable) {
      try {
        return await tryWalletDirectIssuance(formData, authHeaders);
      } catch (error) {
        const walletDirectFailureReason = error instanceof Error ? error.message : String(error);
        throw new Error(`Wallet signing failed: ${walletDirectFailureReason}`);
      }
    }

    const response = await fetch(API_CONFIG.CERTIFICATES.ISSUE, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
    const fallback = await handleResponse(response);
    const walletDirectRequired = Boolean(fallback?.walletDirectRequired);

    if (walletDirectRequired) {
      if (!walletService.isConnected()) {
        await walletService.connect();
      }
      if (!hasWalletProvider()) {
        throw new Error(
          "This institution requires wallet-direct issuance. Connect an institutional wallet and retry issuance.",
        );
      }

      try {
        return await confirmWalletDirectIssuanceIfNeeded(fallback, authHeaders);
      } catch (error) {
        const walletError = error instanceof Error ? error.message : String(error);
        throw new Error(`Wallet signing failed during confirmation: ${walletError}`);
      }
    }

    return {
      ...fallback,
      onChainStatus: fallback?.onChainStatus || "minted_backend_fallback",
      issuanceMode: "backend_fallback",
      walletDirectAttempted: walletAvailable,
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

    // Use standard issue endpoint with privacy flag
    const url = `${API_CONFIG.CERTIFICATES.ISSUE}?privacy=true`;

    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    const result = await handleResponse(response);
    if (result?.walletDirectRequired) {
      if (!walletService.isConnected()) {
        await walletService.connect();
      }
      if (!hasWalletProvider()) {
        throw new Error(
          "This institution requires wallet-direct issuance. Connect an institutional wallet and retry issuance.",
        );
      }

      try {
        return await confirmWalletDirectIssuanceIfNeeded(result, authHeaders);
      } catch (error) {
        const walletError = error instanceof Error ? error.message : String(error);
        throw new Error(`Wallet signing failed during confirmation: ${walletError}`);
      }
    }
    return result;
  },

  updateCertificateAfterMint: async (certificateId: string, data: { tokenId: number; walletAddress: string }) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.ONCHAIN_MINT(certificateId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // List credentials stuck pending on-chain confirmation for the authenticated institution.
  getPendingCertificates: async (limit = 100) => {
    const data = await api.getCertificates({ limit, status: "pending" });
    const certificates = Array.isArray(data?.certificates)
      ? data.certificates.filter((cert: any) => {
          const status = String(cert?.issuanceStatus || "").toLowerCase();
          return status.includes("pending") || (!cert?.tokenId && !cert?.isMinted);
        })
      : [];

    return { certificates };
  },

  // Resume the wallet-direct mint for a pending credential: re-prepares the signing
  // payload, prompts the wallet to sign, then confirms the resulting transaction.
  retryMintCertificate: async (certificateId: string) => {
    const authHeaders = getAuthHeaders();
    if (!hasWalletProvider()) {
      throw new Error(
        "Connect an institutional wallet to retry the on-chain mint.",
      );
    }

    const prepareResponse = await fetch(API_CONFIG.CERTIFICATES.RETRY_MINT(certificateId), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({}),
    });
    const prepared = await handleResponse(prepareResponse);

    const txHash = await submitWalletDirectIssuanceTx(prepared);

    const confirmResponse = await fetch(API_CONFIG.CERTIFICATES.WALLET_DIRECT_CONFIRM, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        issuanceRequestId: prepared.issuanceRequestId || certificateId,
        txHash,
      }),
    });
    const confirmed = await handleResponse(confirmResponse);
    return { ...confirmed, txHash, onChainStatus: "minted_wallet_direct" };
  },

  // Finalise a pending credential using a known mint transaction hash, or by
  // matching an existing on-chain tokenId when no hash is supplied.
  reconcileCertificate: async (certificateId: string, txHash?: string) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.RECONCILE(certificateId), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(txHash ? { txHash } : {}),
    });
    return handleResponse(response);
  },

  getCertificates: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    status?: string;
    program?: string;
    search?: string;
  }) => {
    const authHeaders = getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.sortDir) query.set("sortDir", params.sortDir);
    if (params?.status) query.set("status", params.status);
    if (params?.program) query.set("program", params.program);
    if (params?.search) query.set("search", params.search);
    const url = query.toString()
      ? `${API_CONFIG.CERTIFICATES.INSTITUTION}?${query.toString()}`
      : API_CONFIG.CERTIFICATES.INSTITUTION;

    const response = await fetch(url, {
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

    const certificates = list.map((c: any) => {
      const isWalletLike = (value: unknown) =>
        typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value.trim());

      const toMeaningfulString = (value: unknown) => {
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        const normalized = trimmed.toLowerCase();
        if (
          normalized === "unknown" ||
          normalized === "unknown student" ||
          normalized === "student" ||
          normalized === "n/a" ||
          normalized === "na"
        ) {
          return undefined;
        }
        if (isWalletLike(trimmed)) {
          return undefined;
        }
        return trimmed;
      };

      const resolveStudentName = () => {
        if (!c) return undefined;

        const direct =
          toMeaningfulString(c.studentName) ||
          toMeaningfulString(c.student_name) ||
          toMeaningfulString(c.studentFullName) ||
          toMeaningfulString(c.student_full_name) ||
          toMeaningfulString(c.fullName);
        if (direct) {
          return direct;
        }

        if (c.student && typeof c.student === 'object') {
          const name =
            toMeaningfulString(c.student.fullName) ||
            toMeaningfulString(c.student.name) ||
            toMeaningfulString([c.student.firstName, c.student.lastName].filter(Boolean).join(' '));
          if (name) return name;
        }

        if (c.credentialSubject && typeof c.credentialSubject === 'object') {
          const name =
            toMeaningfulString(c.credentialSubject.studentName) ||
            toMeaningfulString(c.credentialSubject.fullName) ||
            toMeaningfulString(c.credentialSubject.name);
          if (name) return name;
        }

        const first = c.studentFirstName || c.firstName || c.first_name;
        const last = c.studentLastName || c.lastName || c.last_name;
        return toMeaningfulString([first, last].filter(Boolean).join(' '));
      };

      const resolveCourseName = () => {
        if (!c) return undefined;

        const direct =
          toMeaningfulString(c.courseName) ||
          toMeaningfulString(c.course_name) ||
          toMeaningfulString(c.program) ||
          toMeaningfulString(c.programName) ||
          toMeaningfulString(c.program_name) ||
          toMeaningfulString(c.courseTitle) ||
          toMeaningfulString(c.credential_name);
        if (direct) return direct;

        if (c.credentialSubject && typeof c.credentialSubject === 'object') {
          const course =
            toMeaningfulString(c.credentialSubject.courseName) ||
            toMeaningfulString(c.credentialSubject.programName) ||
            toMeaningfulString(c.credentialSubject.credentialName);
          if (course) return course;
        }

        if (c.course && typeof c.course === 'object') {
          const course =
            toMeaningfulString(c.course.courseName) ||
            toMeaningfulString(c.course.programName) ||
            toMeaningfulString(c.course.name);
          if (course) return course;
        }

        return undefined;
      };

      const resolveStudentAddress = () => {
        return (
          c.studentAddress ||
          c.studentWalletAddress ||
          c.walletAddress ||
          c.recipientWallet ||
          c.recipientAddress
        );
      };

      return {
      ...(() => {
        const status =
          c.issuanceStatus ??
          c.status ??
          (c.isValid === false || c.revocationReason
            ? "revoked"
            : (c.isMinted ?? Boolean(c.tokenId))
              ? "minted"
              : "pending_wallet_signature");
        const minted = status === "minted" || Boolean(c.isMinted ?? c.tokenId);
        return {
          issuanceStatus: status,
          isMinted: minted,
          isValid: c.isValid ?? (!c.revocationReason && minted),
        };
      })(),
      id: c.id ?? c._id ?? c.uuid ?? String(c.tokenId ?? c._id ?? Math.random()),
      studentAddress: resolveStudentAddress(),
      studentName: resolveStudentName(),
      courseName: resolveCourseName(),
      grade: c.grade ?? (c.gradescore !== undefined && c.gradescore !== null ? String(c.gradescore) : "N/A"),
      ipfsHash: c.ipfsHash,
      completionDate: c.completionDate,
      certificateType: c.certificateType ?? "Academic",
      issuedBy: c.issuedBy?._id ?? c.issuedBy ?? "",
      institutionName: c.institutionName,
      issuedAt: c.issuedAt ?? c.createdAt ?? c.issueDate,
      tokenId: c.tokenId,
      mintedTo: c.mintedTo,
      mintedAt: c.mintedAt,
      isArchived: c.isArchived ?? false,
      archivedAt: c.archivedAt,
      revocationReason: c.revocationReason ?? c.revocationReasonText ?? c.revocationReasonCode,
      revocationReasonCode: c.revocationReasonCode,
      revocationDetailsUri: c.revocationDetailsUri,
      revocationNotes: c.revocationNotes,
      revokedAt: c.revokedAt,
      revokedBy: c.revokedBy,
      revocationTxHash: c.revocationTxHash,
      revocationRequestStatus: c.revocationRequestStatus,
      revocationRequestReason: c.revocationRequestReason,
      revocationRequestReasonCode: c.revocationRequestReasonCode,
      revocationRequestDetailsUri: c.revocationRequestDetailsUri,
      revocationRequestNotes: c.revocationRequestNotes,
      revocationRequestRecordType: c.revocationRequestRecordType,
      revocationRequestedAt: c.revocationRequestedAt,
      revocationRequestedBy: c.revocationRequestedBy,
      revocationReviewedAt: c.revocationReviewedAt,
      revocationReviewedBy: c.revocationReviewedBy,
    };
    });

    const meta = (data as any)?.meta ?? (data as any)?.pagination ?? undefined;
    return { certificates, meta } as any;
  },

  getInstitutionPublicProfile: async (institutionId: string) => {
    const response = await fetch(API_CONFIG.INSTITUTIONS.BLOCKCHAIN_STATUS(institutionId));
    return handleResponse(response);
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

  revokeCertificate: async (
    id: string,
    payload: { reasonCode: number; reasonText: string; detailsUri: string; notes?: string },
  ) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/${id}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  uploadRevocationProof: async (payload: { file: File; recordType: string }) => {
    const authHeaders = getAuthHeaders();
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("recordType", payload.recordType);
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/revocations/upload-proof`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
    return handleResponse(response) as Promise<{ ipfsHash: string; uri: string }>;
  },

  bulkRequestRevocation: async (payload: {
    certificateIds: string[];
    reasonCode: number;
    reasonText: string;
    detailsUri: string;
    notes?: string;
    recordType: string;
  }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk-revocation-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  bulkApproveRevocations: async (payload: { certificateIds: string[] }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk-revocation-approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  bulkRevokeCertificates: async (payload: {
    certificateIds: string[];
    reasonCode: number;
    reasonText: string;
    detailsUri: string;
    notes?: string;
  }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk-revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  bulkArchiveCertificates: async (certificateIds: string[]) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk-archive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ certificateIds }),
    });
    return handleResponse(response);
  },

  bulkIssueCertificates: async (data: any) => {
    const authHeaders = getAuthHeaders();
    const institutionId = auth.getUser()?.sub;
    const formatNetworkError = (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("failed to fetch")) {
        return `Network error reaching certificate API at ${API_CONFIG.CERT}. Ensure backend is running and CORS/origin is configured.`;
      }
      return message;
    };

    const parseCsvLine = (line: string): string[] => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
          continue;
        }
        if (char === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
          continue;
        }
        current += char;
      }
      values.push(current.trim());
      return values;
    };

    const getValue = (
      row: Record<string, string>,
      aliases: string[],
      defaultValue: string = "",
    ): string => {
      for (const alias of aliases) {
        const normalized = alias.toLowerCase();
        if (row[normalized] !== undefined && row[normalized] !== "") {
          return row[normalized];
        }
      }
      return defaultValue;
    };

    const parseRecipientsFromCsv = (csv: string) => {
      const lines = csv
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error("CSV must include a header row and at least one data row");
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
      const recipients: Array<{
        name: string;
        email: string;
        wallet: string;
        customData?: Record<string, string>;
      }> = [];

      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = (cells[idx] || "").trim();
        });

        const wallet = getValue(row, [
          "recipientwallet",
          "wallet",
          "walletaddress",
          "studentwalletaddress",
          "studentwallet",
        ]);
        const name = getValue(row, ["recipientname", "name", "studentname"]);

        if (!wallet || !name) {
          continue;
        }

        const completionDate = getValue(row, ["completiondate", "date"]);
        const certificateType = getValue(row, ["certificatetype", "type"], "Academic");
        const grade = getValue(row, ["grade"], "N/A");
        const courseName = getValue(row, ["coursename", "course", "courseid"], "Course");
        const email = getValue(row, ["recipientemail", "email", "studentemail"], "");

        recipients.push({
          name,
          email,
          wallet,
          customData: {
            completionDate,
            certificateType,
            grade,
            courseName,
          },
        });
      }

      if (recipients.length === 0) {
        throw new Error(
          "CSV has no valid rows. Required columns include recipientWallet (or wallet) and recipientName (or name).",
        );
      }

      return recipients;
    };

    if (data instanceof FormData) {
      const csvFile = data.get("file");
      if (!(csvFile instanceof File)) {
        throw new Error("CSV file is required");
      }

      const templateInput = data.get("templateId");
      const templateId =
        typeof templateInput === "string" &&
        templateInput.trim() &&
        templateInput !== "__none__"
          ? templateInput.trim()
          : undefined;

      const csvText = await csvFile.text();
      const recipients = parseRecipientsFromCsv(csvText);

      let response: Response;
      const walletDirectEnabled =
        String(import.meta.env.VITE_ENABLE_WALLET_DIRECT_ISSUANCE ?? "true").toLowerCase() !== "false";

      try {
        response = await fetch(`${API_CONFIG.CERT}/api/v1/standard/certificates/issue/bulk`, {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(templateId ? { templateId } : {}),
            // Transform recipients to backend's expected shape
            certificates: recipients.map(r => ({
              student: { id: r.wallet, name: r.name, email: r.email },
              course: { name: r.customData?.courseName || 'Course', code: '' },
              achievement: {
                grade: r.customData?.grade || 'N/A',
                completionDate: r.customData?.completionDate || new Date().toISOString().split('T')[0],
                certificateType: r.customData?.certificateType || 'Academic',
              },
            })),
            ...(institutionId ? { institutionId } : {}),
            ...(walletDirectEnabled ? {} : { forceBackendSigner: true }),
          }),
        });
      } catch (error) {
        throw new Error(formatNetworkError(error));
      }

      const result = await handleResponse(response);
      let results = Array.isArray(result?.results) ? result.results : [];

      if (walletDirectEnabled && hasWalletProvider()) {
        const updatedResults = [];
        for (const item of results) {
          if (item?.walletDirectRequired && item?.transactionData && item?.issuanceRequestId) {
            try {
              const confirmed = await confirmWalletDirectIssuanceIfNeeded(item, authHeaders);
              updatedResults.push({ ...item, ...confirmed, walletDirectRequired: false, status: "minted" });
              continue;
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              updatedResults.push({ ...item, error: message });
              continue;
            }
          }
          updatedResults.push(item);
        }
        results = updatedResults;
      }
      const pending = results.filter((item: any) =>
        item?.walletDirectRequired || item?.status === "pending_wallet_signature"
      ).length;
      const successful = results.filter((item: any) =>
        item?.status === "minted" || item?.walletDirectRequired === false
      ).length;
      const failed = Math.max(0, Number(result?.failed ?? 0) + (results.length - successful - pending));
      const errors = results.length
        ? results
            .filter((item: any) => item?.status === "failed" || item?.error)
            .map((item: any) => item?.error || "Certificate issuance failed")
        : [];

      return {
        ...result,
        successful,
        failed,
        pending,
        results,
        errors,
      };
    }

    let response: Response;
    const walletDirectEnabled =
      String(import.meta.env.VITE_ENABLE_WALLET_DIRECT_ISSUANCE ?? "true").toLowerCase() !== "false";

    try {
      response = await fetch(`${API_CONFIG.CERT}/api/v1/standard/certificates/issue/bulk`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(institutionId ? { institutionId } : {}),
          ...data,
          ...(walletDirectEnabled ? {} : { forceBackendSigner: true }),
        }),
      });
    } catch (error) {
      throw new Error(formatNetworkError(error));
    }
    return handleResponse(response);
  },

  confirmWalletDirectIssuance: async (payload: any) => {
    const authHeaders = getAuthHeaders();
    return confirmWalletDirectIssuanceIfNeeded(payload, authHeaders);
  },

  // Bulk issuance via CSV upload — send file to backend bulk issuance pipeline.
  // This avoids silent 0/0 results caused by calling the legacy bulk-issue-template endpoint.
  bulkIssueCertificatesFromCSV: async (
    csvFile: File,
    options?: {
      batchSize?: number;
      continueOnError?: boolean;
      templateId?: string; // reserved for future (template binding server-side)
    }
  ) => {
    const authHeaders = getAuthHeaders();

    const form = new FormData();
    form.append('csvFile', csvFile);

    // The backend expects nested body.options; send as a JSON-string field `options`.
    // (Multer + Nest will parse this into @Body().options when possible.)
    form.append('options', JSON.stringify({
      batchSize: options?.batchSize ?? 10,
      continueOnError: options?.continueOnError ?? true,
    }));

    try {
      const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk/issue-csv`, {
        method: 'POST',
        headers: { ...authHeaders }, // do NOT set content-type for FormData
        body: form,
      });
      return handleResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ApiError(0, `Failed to start bulk issuance job: ${message}`);
    }
  },

  // List programs for the current institution
  listPrograms: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/institutions/programs`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  // List cohorts, optionally filtered by programId
  listCohorts: async (programId?: string) => {
    const authHeaders = getAuthHeaders();
    const qs = programId ? `?programId=${encodeURIComponent(programId)}` : '';
    const response = await fetch(`${API_CONFIG.CERT}/api/institutions/cohorts${qs}`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  // List students for the current institution with optional filters
  listStudentsForInstitution: async (filters: { programId?: string; cohortId?: string; status?: string; search?: string }) => {
    const authHeaders = getAuthHeaders();
    const params = new URLSearchParams();
    if (filters.programId) params.set('programId', filters.programId);
    if (filters.cohortId) params.set('cohortId', filters.cohortId);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_CONFIG.CERT}/api/students${qs}`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  // Bulk issue by student selection (cohort/program selection mode)
  bulkIssueSelection: async (payload: {
    studentIds: string[];
    courseName?: string;
    certificateType?: string;
    completionDate?: string;
    templateId?: string;
    options?: { batchSize?: number; continueOnError?: boolean };
  }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk/issue-selection`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // Get bulk job status
  getBulkIssuanceJobStatus: async (jobId: string) => {
    const authHeaders = getAuthHeaders();
    
    try {
      const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk/status/${jobId}`, {
        headers: authHeaders,
      });
      
      return handleResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ApiError(0, `Failed to get job status: ${message}`);
    }
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
      body: JSON.stringify(credential),
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

  getHybridCredentialProof: async (tokenId: number) => {
    const response = await fetch(API_CONFIG.W3C.HYBRID_PROOF(tokenId));
    return handleResponse(response);
  },

  // Sharing Methods (student JWT required — SEC-04)
  getSharePackage: async (certificateId: string) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.SHARE_PACKAGE(certificateId), {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getShareMethods: async (certificateId: string) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.SHARE_METHODS(certificateId), {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get certificates by wallet address (student JWT; wallet must match token)
  getCertificatesByWallet: async (walletAddress: string) => {
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/wallet/${walletAddress}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // EDU-ID session listing — student JWT required; eduCredsId must match token (SEC-06)
  getCertificatesByEduId: async (eduCredsId: string) => {
    const response = await fetch(
      `${API_CONFIG.CERT}/api/certificates/edu-id/${encodeURIComponent(eduCredsId)}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse(response);
  },

  getCertificatesByEmail: async (email: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(
      `${API_CONFIG.CERT}/api/certificates/by-email?email=${encodeURIComponent(email)}`,
      { headers: authHeaders }
    );
    return handleResponse(response);
  },

  // fix(DID): institution self-service DID profile
  getInstitutionDIDProfile: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/institutions/did-profile`, { headers: authHeaders });
    return handleResponse(response);
  },

  rotateInstitutionKey: async (payload: { reason: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/institutions/rotate-key`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  // Get statistics
  getStats: async (institutionId?: string) => {
    const authHeaders = getAuthHeaders();
    const resolvedInstitutionId = institutionId || auth.getUser()?.sub;
    const params = new URLSearchParams();
    if (resolvedInstitutionId) {
      params.set("institutionId", resolvedInstitutionId);
    }
    const query = params.toString();
    const response = await fetch(`${API_CONFIG.CERT}/api/stats${query ? `?${query}` : ""}`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  getIssuanceTrend: async (months: number = 6, institutionId?: string) => {
    const authHeaders = getAuthHeaders();
    const resolvedInstitutionId = institutionId || auth.getUser()?.sub;
    const params = new URLSearchParams();
    params.set("months", String(months));
    if (resolvedInstitutionId) {
      params.set("institutionId", resolvedInstitutionId);
    }
    const response = await fetch(`${API_CONFIG.CERT}/api/stats/trend?${params.toString()}`, {
      headers: authHeaders,
    });
    const data = await handleResponse(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray((data as any)?.data)) {
      return (data as any).data;
    }
    return [];
  },

  getCertificateDistribution: async (institutionId?: string) => {
    const authHeaders = getAuthHeaders();
    const resolvedInstitutionId = institutionId || auth.getUser()?.sub;
    const params = new URLSearchParams();
    if (resolvedInstitutionId) {
      params.set("institutionId", resolvedInstitutionId);
    }
    const query = params.toString();
    const response = await fetch(
      `${API_CONFIG.CERT}/api/stats/distribution${query ? `?${query}` : ""}`,
      {
        headers: authHeaders,
      },
    );
    const data = await handleResponse(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray((data as any)?.data)) {
      return (data as any).data;
    }
    return [];
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
    const result = await handleResponse(response);
    if (result?.walletDirectRequired && hasWalletProvider()) {
      try {
        return await confirmWalletDirectIssuanceIfNeeded(result, authHeaders);
      } catch (error) {
        const walletError = error instanceof Error ? error.message : String(error);
        return {
          ...result,
          onChainStatus: "pending_wallet_signature",
          issuanceMode: "wallet_direct_pending",
          walletDirectAttempted: true,
          walletDirectFailureReason: walletError,
        };
      }
    }
    return result;
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

  getBulkFailures: async (batchId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk/failures/${batchId}`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  retryBulkFailures: async (batchId: string, indices?: number[]) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk/retry-failed/${batchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ indices }),
    });
    return handleResponse(response);
  },

  // Template management methods
  getTemplates: async () => {
    const response = await fetch(`${API_CONFIG.CERT}/templates`);
    const data = await handleResponse(response);
    const templates = Array.isArray(data) ? data : (data.templates || []);
    const categoryMap: Record<string, string> = {
      certificate: 'academic',
      logo: 'corporate',
      banner: 'corporate',
      other: 'workshop',
    };

    const mapped = templates.map((t: any) => ({
        metadata: {
          id: t.id,
          name: t.name,
          description: t.description,
          category: categoryMap[t.templateType] || 'academic',
          fields: (t.placeholders || []).map((p: any) => ({
            name: p.key,
            label: p.label,
            required: true,
          })),
        },
        content: t.htmlContent,
        styles: t.cssContent,
      }));

    // Keep both keys for backward compatibility across components.
    return {
      templates: mapped,
      data: mapped,
    };
  },

  getTemplateSpecs: async (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_CONFIG.CERT}/templates/specs${query}`);
    const specs = await handleResponse(response);
    const templates = Array.isArray(specs) ? specs : (specs?.templates || []);
    return { templates };
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

  getSubscriptionUsage: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/api/subscription/usage`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  listCommercialPlans: async (workspace: "institution" | "verifier" | "student") => {
    const params = new URLSearchParams({ workspace });
    const response = await fetch(`${API_CONFIG.COMMERCIAL.PLANS}?${params}`);
    return handleResponse(response);
  },

  getCommercialSubscription: async (workspace?: "institution" | "verifier" | "student") => {
    const authHeaders = getAuthHeaders();
    const params = new URLSearchParams();
    if (workspace) params.set("workspace", workspace);
    const qs = params.toString();
    const response = await fetch(
      `${API_CONFIG.COMMERCIAL.SUBSCRIPTION}${qs ? `?${qs}` : ""}`,
      { headers: authHeaders },
    );
    return handleResponse(response);
  },

  cancelCommercialSubscription: async (workspace?: "institution" | "verifier" | "student") => {
    const authHeaders = getAuthHeaders();
    const params = new URLSearchParams();
    if (workspace) params.set("workspace", workspace);
    const qs = params.toString();
    const response = await fetch(
      `${API_CONFIG.COMMERCIAL.CANCEL}${qs ? `?${qs}` : ""}`,
      { method: "POST", headers: authHeaders },
    );
    return handleResponse(response);
  },

  createCommercialCheckout: async (data: {
    workspace: "institution" | "verifier" | "student";
    planKey: string;
  }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(API_CONFIG.COMMERCIAL.CHECKOUT, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  listCommercialInvoices: async (workspace?: "institution" | "verifier" | "student") => {
    const authHeaders = getAuthHeaders();
    const params = new URLSearchParams();
    if (workspace) params.set("workspace", workspace);
    const qs = params.toString();
    const response = await fetch(
      `${API_CONFIG.COMMERCIAL.INVOICES}${qs ? `?${qs}` : ""}`,
      { headers: authHeaders },
    );
    return handleResponse(response);
  },

  getCommercialUsage: async (workspace?: "institution" | "verifier" | "student") => {
    const authHeaders = getAuthHeaders();
    const params = new URLSearchParams();
    if (workspace) params.set("workspace", workspace);
    const qs = params.toString();
    const response = await fetch(
      `${API_CONFIG.COMMERCIAL.USAGE}${qs ? `?${qs}` : ""}`,
      { headers: authHeaders },
    );
    return handleResponse(response);
  },

  listCommercialEvents: async (query?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    tenantId?: string;
  }) => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("admin_token") : null;
    const params = new URLSearchParams();
    if (query?.limit != null) params.set("limit", String(query.limit));
    if (query?.offset != null) params.set("offset", String(query.offset));
    if (query?.eventType) params.set("eventType", query.eventType);
    if (query?.tenantId) params.set("tenantId", query.tenantId);
    const qs = params.toString();
    const response = await fetch(
      `${API_CONFIG.COMMERCIAL.EVENTS}${qs ? `?${qs}` : ""}`,
      {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    return handleResponse(response);
  },

  verifyCommercialEventChain: async () => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("admin_token") : null;
    const response = await fetch(API_CONFIG.COMMERCIAL.VERIFY_CHAIN, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return handleResponse(response);
  },

  listProvisioningJobs: async (query?: { limit?: number; status?: string; subscriptionId?: string }) => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("admin_token") : null;
    const params = new URLSearchParams();
    if (query?.limit != null) params.set("limit", String(query.limit));
    if (query?.status) params.set("status", query.status);
    if (query?.subscriptionId) params.set("subscriptionId", query.subscriptionId);
    const qs = params.toString();
    const response = await fetch(
      `${API_CONFIG.COMMERCIAL.PROVISIONING_JOBS}${qs ? `?${qs}` : ""}`,
      {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
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

/* Methods kept in a separate literal so the merged `api` type (via
   Object.assign) retains full typing for members that would otherwise fall
   beyond TypeScript's ~100-property object-literal inference cap. All calls go
   through cert_backend (the BFF), which injects the verifier API key and EVF
   HMAC secret server-side — no upstream secret reaches the browser. */
const apiExtra = {
  getPoICScore: async (institutionId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_CONFIG.CERT}/governance/poic-score/${institutionId}`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  verifyCertificate: async (certificateId: string, opts?: { mode?: string; async?: boolean; sharingLinkId?: string; purpose?: string; audience?: string }) => {
    const response = await fetch(API_CONFIG.VERIFY_PROXY.VERIFY, {
      method: 'POST',
      // Include auth headers when available so the backend can attribute this
      // verification to the logged-in verifier for metrics/stats.
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        certificateId,
        mode: opts?.mode || 'api',
        async: opts?.async || false,
        sharingLinkId: opts?.sharingLinkId,
        purpose: opts?.purpose,
        audience: opts?.audience,
      }),
    });
    return handleResponse(response);
  },

  // Anonymous Public Layer verify (Privacy Architecture). Hits the backend's
  // unauthenticated /api/certificates/verify/{id} route, which returns ONLY the
  // minimal PublicVerificationView (existence + issuer + type + issued year +
  // revoked). Never discloses holder identity or grade. Use this on public,
  // unauthenticated verify surfaces — NOT the EVF proxy.
  verifyPublicCertificate: async (id: string) => {
    const response = await fetch(API_CONFIG.CERTIFICATES.VERIFY(id));
    return handleResponse(response);
  },

  verifyBulk: async (certificateIds: string[], mode = 'api') => {
    const response = await fetch(API_CONFIG.VERIFY_PROXY.VERIFY_BULK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ certificateIds, mode }),
    });
    return handleResponse(response);
  },

  getVerificationResult: async (jobId: string) => {
    const response = await fetch(API_CONFIG.VERIFY_PROXY.RESULT(jobId));
    return handleResponse(response);
  },

  evfVerify: async (certificateId: string, opts?: { mode?: string; verifierDid?: string }) => {
    const response = await fetch(API_CONFIG.VERIFY_PROXY.EVF, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ certificateId, mode: opts?.mode || 'api', verifierDid: opts?.verifierDid }),
    });
    return handleResponse(response);
  },

  getVerificationStatus: async () => {
    const response = await fetch(API_CONFIG.VERIFY_PROXY.STATUS);
    return handleResponse(response);
  },

  getVerifierAnalytics: async () => {
    const response = await fetch(`${API_CONFIG.CERT}/api/verifier/analytics`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  getVerifierStats: async () => {
    const response = await fetch(`${API_CONFIG.CERT}/api/verifier/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  getVerifierChecks: async (limit = 10) => {
    const response = await fetch(`${API_CONFIG.CERT}/api/verifier/checks?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  /**
   * getVerificationHistory — paginated history for /verifier/history page.
   * Backed by GET /api/verifier/checks with a high limit; filters and pagination
   * are applied client-side for now (backend endpoint is append-only).
   */
  getVerificationHistory: async (opts?: { result?: string; page?: number; limit?: number }) => {
    // P2-V2: Use dedicated /api/verifier/history endpoint which JOINs certificates table
    const params = new URLSearchParams();
    if (opts?.result && opts.result !== 'all') params.set('result', opts.result);
    if (opts?.page) params.set('page', String(opts.page));
    if (opts?.limit) params.set('limit', String(opts.limit));

    const historyUrl = `${API_CONFIG.CERT}/api/verifier/history?${params.toString()}`;
    try {
      const histResp = await fetch(historyUrl, { headers: getAuthHeaders() });
      if (histResp.ok) {
        const data = await histResp.json();
        const verifications = data.verifications ?? data.results ?? data ?? [];
        const items = Array.isArray(verifications) ? verifications : [];
        const mapped = items.map((r: any) => ({
          ...r,
          verifiedAt: r.verifiedAt ?? r.createdAt ?? r.timestamp,
          credentialTitle: r.credentialTitle ?? r.courseName ?? r.credentialId ?? r.id,
          studentName: r.studentName ?? null,
          institutionName: r.institutionName ?? r.institution ?? null,
          result: r.result ?? (r.status === 'verified' ? 'valid' : r.status === 'failed' ? 'failed' : 'flagged'),
        }));
        return { results: mapped, total: data.total ?? mapped.length };
      }
    } catch { /* fall through */ }

    // Fallback to /api/verifier/checks if history endpoint not available
    const limit = opts?.limit ?? 100;
    const response = await fetch(`${API_CONFIG.CERT}/api/verifier/checks?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows: any[] = await response.json();
    const items = Array.isArray(rows) ? rows : (rows as any)?.checks ?? [];
    const mapped = items.map((r: any) => ({
      ...r,
      verifiedAt: r.verifiedAt ?? r.createdAt ?? r.timestamp,
      credentialTitle: r.credentialTitle ?? r.credentialId ?? r.id,
      studentName: r.studentName ?? null,
      institutionName: r.institutionName ?? r.institution ?? null,
      result: r.result ?? (r.status === 'verified' ? 'valid' : r.status === 'failed' ? 'failed' : 'flagged'),
    }));
    return { results: mapped, total: mapped.length };
  },

  getCredentialVerifications: async (certificateId: string) => {
    const response = await fetch(
      `${API_CONFIG.CERT}/api/certificates/${encodeURIComponent(certificateId)}/verifications`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  /* ---- Trust-agent (governance proxy) ---- */
  trustAgentHealth: async () => {
    const response = await fetch(API_CONFIG.TRUST_AGENT_PROXY.HEALTH);
    return handleResponse(response);
  },

  trustAgentPoicCompute: async (payload: Record<string, unknown>) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(API_CONFIG.TRUST_AGENT_PROXY.POIC_COMPUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};

/** Authenticated government BFF request; unlike raw fetch, errors reach query error states. */
export async function governmentRequest(path: string, init?: RequestInit): Promise<any> {
  const response = await fetch(`${API_CONFIG.CERT}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...init?.headers },
  });
  return handleResponse(response);
}

export async function governmentExport(format: "csv" | "pdf"): Promise<Blob> {
  const response = await fetch(`${API_CONFIG.CERT}/api/government/compliance/export?format=${format}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleResponse(response);
  return response.blob();
}

export const api = Object.assign(apiBase, apiExtra);