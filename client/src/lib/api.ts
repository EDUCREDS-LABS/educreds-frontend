const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:3001").replace(/\/$/, "");
const CERT_API_BASE = (import.meta.env.VITE_CERT_API_BASE ?? "http://localhost:3001").replace(/\/$/, "");
const MARKETPLACE_API_BASE = (import.meta.env.VITE_MARKETPLACE_API_BASE ?? "http://localhost:3001").replace(/\/$/, "");
console.log("Using API base:", API_BASE);
console.log("Using Certificate API base:", CERT_API_BASE);
console.log("Using Marketplace API base:", MARKETPLACE_API_BASE);

import { auth, getAuthHeaders } from "./auth";
import { AdminAuth } from "./admin-auth";
import { transformDocumentsForBackend } from "@/utils/documentTransform";

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
      errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
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

export const api = {
  // Health check
  healthCheck: async () => {
    const response = await fetch(`${CERT_API_BASE}/api/health`);
    return handleResponse(response);
  },

  // Test admin endpoint
  testAdmin: async () => {
    const response = await fetch(`${CERT_API_BASE}/api/admin/test`, {
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  // Auth endpoints - Platform authentication (uses unified API)
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${CERT_API_BASE}/api/institutions/login`, {
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
    
    const response = await fetch(`${CERT_API_BASE}/api/institutions/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies for session
      body: JSON.stringify(transformedData),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${CERT_API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include", // Include cookies for session
    });
    return handleResponse(response);
  },

  verifySession: async () => {
    const response = await fetch(`${CERT_API_BASE}/auth/verify-session`, {
      credentials: "include", // Include cookies for session
    });
    return handleResponse(response);
  },

  // Institution endpoints
  getProfile: async () => {
    const user = auth.getUser();
    const response = await fetch(`${CERT_API_BASE}/api/institutions/profile`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionId: user?.sub })
    });
    return handleResponse(response);
  },

  getVerificationStatus: async () => {
    const user = auth.getUser();
    const response = await fetch(`${CERT_API_BASE}/api/institutions/verification-status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionId: user?.sub })
    });
    return handleResponse(response);
  },

  uploadVerificationDocuments: async (formData: FormData) => {
    const user = auth.getUser();
    formData.append('institutionId', user?.sub || '');
    const response = await fetch(`${CERT_API_BASE}/api/institutions/verification-documents`, {
      method: "POST",
      body: formData,
    });
    const data = await handleResponse(response);
    
    // Backend expects verificationDocuments as array of URLs
    // Frontend can still display full document objects for UI
    return data;
  },

  // Oracle endpoints
  getInstitutionOracleStatus: async (walletAddress?: string) => {
    const user = auth.getUser();
    const address = walletAddress || user?.walletAddress;
    if (!address) throw new Error('Wallet address required');
    
    const response = await fetch(`${CERT_API_BASE}/api/oracle/institution/${address}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    return handleResponse(response);
  },

  submitOracleDocuments: async (walletAddress: string, formData: FormData) => {
    const response = await fetch(`${CERT_API_BASE}/api/oracle/institution/${walletAddress}/documents`, {
      method: "POST",
      body: formData,
    });
    return handleResponse(response);
  },

  getOracleSnapshot: async () => {
    const response = await fetch(`${CERT_API_BASE}/api/oracle/snapshot/latest`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    return handleResponse(response);
  },

  // Certificate endpoints
  issueCertificate: async (formData: FormData) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/certificates/issue`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });
    return handleResponse(response);
  },

  updateCertificateAfterMint: async (certificateId: string, data: { tokenId: number; walletAddress: string }) => {
    const response = await fetch(`${CERT_API_BASE}/api/certificates/${certificateId}/onchain-mint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getCertificates: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/certificates/institution`, {
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

  // Subscription endpoints
  getSubscriptionPlans: async () => {
    const response = await fetch(`${CERT_API_BASE}/api/subscription/plans`);
    return handleResponse(response);
  },

  getCurrentSubscription: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/subscription/current`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  getUsage: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/subscription/usage`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  subscribe: async (data: { planId: string; paymentMethod: string }) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/subscription/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  cancelSubscription: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/subscription/cancel`, {
      method: "POST",
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  getPayments: async () => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/subscription/payments`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  // Dashboard stats
  getStats: async () => {
    const user = auth.getUser();
    const response = await fetch(`${CERT_API_BASE}/api/stats?institutionId=${user?.sub || ''}`);
    return handleResponse(response);
  },

  // Mint certificate to blockchain (student action)
  mintCertificateToBlockchain: async (certificateId: string, data: { walletAddress: string }) => {
    const response = await fetch(`${CERT_API_BASE}/api/certificates/${certificateId}/mint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Verification endpoints
  verifyCertificateByIPFS: async (ipfsHash: string) => {
    const response = await fetch(`${CERT_API_BASE}/api/certificates/verify/ipfs/${ipfsHash}`);
    return handleResponse(response);
  },

  verifyCertificateByToken: async (tokenId: number) => {
    const response = await fetch(`${CERT_API_BASE}/api/certificates/verify/token/${tokenId}`);
    return handleResponse(response);
  },

  // Student endpoints
  connectWallet: async (walletAddress: string) => {
    const response = await fetch(`${CERT_API_BASE}/api/students/connect-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });
    return handleResponse(response);
  },

  getCertificatesByWallet: async (walletAddress: string) => {
    const response = await fetch(`${CERT_API_BASE}/api/certificates/wallet/${walletAddress}`);
    const data = await handleResponse(response);

    // Normalize response shape for student certificates
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

  verifyCertificate: async (id: string) => {
    const response = await fetch(`${CERT_API_BASE}/api/certificates/verify/${id}`);
    return handleResponse(response);
  },

  // Blockchain integration endpoints
  getBlockchainStatus: async (institutionId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/institutions/${institutionId}/blockchain-status`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  // Admin blockchain endpoints
  getBlockchainSummary: async () => {
    const response = await fetch(`${API_BASE}/api/admin/blockchain-summary`, {
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  getBlockchainStatusAll: async () => {
    const response = await fetch(`${API_BASE}/api/admin/blockchain-status`, {
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  registerInstitutionOnBlockchain: async (institutionId: string) => {
    const response = await fetch(`${API_BASE}/api/admin/institutions/${institutionId}/blockchain-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders()
      },
    });
    return handleResponse(response);
  },

  authorizeInstitutionOnBlockchain: async (institutionId: string) => {
    const response = await fetch(`${API_BASE}/api/admin/institutions/${institutionId}/blockchain-authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders()
      },
    });
    return handleResponse(response);
  },

  bulkRegisterInstitutionsOnBlockchain: async () => {
    const response = await fetch(`${API_BASE}/api/admin/blockchain-register-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders()
      },
    });
    return handleResponse(response);
  },

  // Admin security
  changeAdminPassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await fetch(`${API_BASE}/api/admin/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders()
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Admin user management
  getAdminUsers: async () => {
    const response = await fetch(`${CERT_API_BASE}/api/admin/users`, {
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  createAdminUser: async (data: { email: string; name: string; role: string; password: string }) => {
    const response = await fetch(`${CERT_API_BASE}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders()
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateAdminUser: async (userId: string, data: { name?: string; role?: string; isActive?: boolean }) => {
    const response = await fetch(`${CERT_API_BASE}/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders()
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteAdminUser: async (userId: string) => {
    const response = await fetch(`${CERT_API_BASE}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  getAuditLogs: async (filters?: { startDate?: string; endDate?: string; userId?: string; action?: string }) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.action) params.append('action', filters.action);
    
    const response = await fetch(`${CERT_API_BASE}/api/admin/audit-logs?${params}`, {
      headers: getAdminHeaders(),
    });
    return handleResponse(response);
  },

  // Note: Marketplace-specific endpoints are now in marketplace-auth.ts

  // Bulk operations
  getInstitutionVariants: async (institutionId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${API_BASE}/api/institutions/${institutionId}/variants`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  bulkIssueCertificates: async (data: any) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/bulk/certificates/bulk-issue`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getBulkStatus: async (jobId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/bulk/certificates/bulk-status/${jobId}`, {
      headers: authHeaders,
    });
    return handleResponse(response);
  },

  downloadBulkZip: async (jobId: string) => {
    const authHeaders = getAuthHeaders();
    const response = await fetch(`${CERT_API_BASE}/api/bulk/certificates/bulk-download/${jobId}`, {
      headers: authHeaders,
    });
    if (!response.ok) {
      throw new Error("Failed to download bulk certificates");
    }
    return response.blob();
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
  getMarketplacePermissions: () => auth.getMarketplacePermissions()
};
