/**
 * Institution API Keys — service layer
 * Talks to /api/institutions/api-keys (NestJS InstitutionApiKeyService)
 */
import { API_CONFIG } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

export const ALL_SCOPES = ['read', 'verify', 'issue', 'issue:batch', 'revoke', 'webhook:manage', 'keys:manage'] as const;
export type ApiKeyScope = typeof ALL_SCOPES[number];

/** Assignment display names. Backend still uses ALL_SCOPES on the wire. */
export const BRIEF_SCOPE_LABEL: Record<string, string> = {
  verify: 'verify',
  'issue:batch': 'batch_verify',
  issue: 'issue',
  'webhook:manage': 'webhooks',
  read: 'identity',
  'keys:manage': 'admin',
  revoke: 'revoke',
};

export const SCOPE_LABELS: Record<ApiKeyScope, { label: string; description: string; risk: 'low' | 'medium' | 'high' }> = {
  'read':           { label: 'identity',       description: 'List credentials, read institution data',         risk: 'low'    },
  'verify':         { label: 'verify',         description: 'Call verification endpoints',                     risk: 'low'    },
  'issue':          { label: 'issue',          description: 'Issue a single credential',                       risk: 'high'   },
  'issue:batch':    { label: 'batch_verify',   description: 'Issue credentials in bulk (up to 1000)',          risk: 'high'   },
  'revoke':         { label: 'revoke',         description: 'Revoke issued credentials',                       risk: 'high'   },
  'webhook:manage': { label: 'webhooks',       description: 'Register and update webhook endpoints',           risk: 'medium' },
  'keys:manage':    { label: 'admin',          description: 'Create and revoke child API keys (delegated)',    risk: 'high'   },
};

export interface ApiKey {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  scopes: string[];
  rateLimit: number;
  rateLimitWindowSeconds: number;
  allowedIps: string | null;
  sandboxMode: boolean;
  usageCount: number;
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastRotatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  scopes: ApiKeyScope[];
  expiresInDays?: number;
  rateLimit?: number;
  allowedIps?: string[];
  sandboxMode?: boolean;
}

export interface CreateApiKeyResponse {
  clientId: string;
  clientSecret: string;
  xApiKey: string;
  scopes: string[];
  expiresAt: string | null;
  sandboxMode: boolean;
}

export interface RotateApiKeyResponse {
  clientSecret: string;
  xApiKey: string;
}

export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  scopes?: ApiKeyScope[];
  rateLimit?: number;
  allowedIps?: string[];
}

export interface IssuanceJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  jobType: 'single' | 'batch';
  triggeredBy: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  result: Record<string, unknown> | null;
  error: string | null;
  sandboxMode: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  statusUrl: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((err.message as string) || `Request failed: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

// ── API ───────────────────────────────────────────────────────────────────────

export const listApiKeys = (): Promise<ApiKey[]> =>
  apiFetch<ApiKey[]>(API_CONFIG.INSTITUTIONS.API_KEYS);

export const createApiKey = (data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> =>
  apiFetch<CreateApiKeyResponse>(API_CONFIG.INSTITUTIONS.API_KEYS, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateApiKey = (clientId: string, data: UpdateApiKeyRequest): Promise<{ success: boolean }> =>
  apiFetch<{ success: boolean }>(`${API_CONFIG.INSTITUTIONS.API_KEYS}/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const rotateApiKey = (clientId: string): Promise<RotateApiKeyResponse> =>
  apiFetch<RotateApiKeyResponse>(`${API_CONFIG.INSTITUTIONS.API_KEYS}/${clientId}/rotate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

export const revokeApiKey = (clientId: string): Promise<{ success: boolean }> =>
  apiFetch<{ success: boolean }>(`${API_CONFIG.INSTITUTIONS.API_KEYS}/${clientId}`, {
    method: 'DELETE',
  });

export const listIssuanceJobs = (params?: { status?: string; limit?: number }): Promise<{ jobs: IssuanceJob[]; total: number }> => {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.limit) q.set('limit', String(params.limit));
  return apiFetch<{ jobs: IssuanceJob[]; total: number }>(`${API_CONFIG.INSTITUTIONS.ISSUANCE_JOBS}?${q}`);
};
