import { API_CONFIG } from "@/config/api";
import { auth, getAuthHeaders } from "./auth";
import { AdminAuth } from "./admin-auth";
import { transformDocumentsForBackend } from "@/utils/documentTransform";
import { ethers, Eip1193Provider } from "ethers";
import { walletService } from "./walletService";

// Extended EIP-1193 provider interface for wallet providers like MetaMask
interface EthereumProvider extends Eip1193Provider {
  isMetaMask?: boolean;
  isConnected?: () => boolean;
  networkVersion?: string;
  chainId?: string;
}

// Note: For wallet connection in utility functions, we use window.ethereum directly.

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
    const walletDirectRequired = Boolean(fallback?.walletDirectRequired);
    if (walletDirectRequired && typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        return await confirmWalletDirectIssuanceIfNeeded(fallback, authHeaders);
      } catch (error) {
        const walletError = error instanceof Error ? error.message : String(error);
        return {
          ...fallback,
          onChainStatus: "pending_wallet_signature",
          issuanceMode: "wallet_direct_pending",
          walletDirectAttempted: true,
          walletDirectFailureReason: walletError,
        };
      }
    }

    return {
      ...fallback,
      onChainStatus: walletDirectRequired
        ? "pending_wallet_signature"
        : fallback?.onChainStatus || "minted_backend_fallback",
      issuanceMode: walletDirectRequired ? "wallet_direct_pending" : "backend_fallback",
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
    const result = await handleResponse(response);
    if (result?.walletDirectRequired && typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
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
      ...(() => {
        const status =
          c.issuanceStatus ??
          (c.isValid === false
            ? "revoked"
            : (c.isMinted ?? Boolean(c.tokenId))
              ? "minted"
              : "pending_wallet_signature");
        const minted = status === "minted" || Boolean(c.isMinted ?? c.tokenId);
        return {
          issuanceStatus: status,
          isMinted: minted,
          isValid: c.isValid ?? minted,
        };
      })(),
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
      try {
        response = await fetch(`${API_CONFIG.CERT}/api/v1/issue/batch`, {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
            ...(institutionId ? { "x-institution-id": institutionId } : {}),
          },
          body: JSON.stringify({
            ...(templateId ? { templateId } : {}),
            recipients,
            ...(institutionId ? { institutionId } : {}),
          }),
        });
      } catch (error) {
        throw new Error(formatNetworkError(error));
      }

      const result = await handleResponse(response);
      const successful = Number(result?.successful ?? 0);
      const failed = Number(result?.failed ?? 0);
      const errors = Array.isArray(result?.results)
        ? result.results
            .filter((item: any) => item?.status === "failed" || item?.error)
            .map((item: any) => item?.error || "Certificate issuance failed")
        : [];

      return {
        ...result,
        successful,
        failed,
        errors,
      };
    }

    let response: Response;
    try {
      response = await fetch(`${API_CONFIG.CERT}/api/v1/issue/batch`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          ...(institutionId ? { "x-institution-id": institutionId } : {}),
        },
        body: JSON.stringify({
          ...(institutionId ? { institutionId } : {}),
          ...data,
        }),
      });
    } catch (error) {
      throw new Error(formatNetworkError(error));
    }
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
    if (result?.walletDirectRequired && typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
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
