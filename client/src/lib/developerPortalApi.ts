import axios from 'axios';
import { DualAuth } from './dualAuth';
import { API_CONFIG } from '@/config/api';
import { handleAuthFailure } from './authFailure';

const API_BASE = API_CONFIG.MAIN;

export const DEVELOPER_SCOPES = [
  'verify',
  'batch_verify',
  'issue',
  'webhooks',
  'identity',
] as const;

export type DeveloperScope = (typeof DEVELOPER_SCOPES)[number];

const api = axios.create({
    baseURL: `${API_BASE}/api/developer-portal`,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config: any) => {
    const token = DualAuth.getCurrentToken();
    if (!config.headers) {
        config.headers = {};
    }
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(handleAuthFailure(error))
);

export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;
    expiresAt?: string;
    lastUsedAt?: string;
    isActive: boolean;
    apiKey?: string;
    scopes?: string[];
    environment?: 'production' | 'sandbox';
}

export interface SubscriptionStatus {
    active: boolean;
    plan: string;
    features: string[];
}

export interface DeveloperUsageKey {
    name: string;
    clientId: string;
    usageCount: number;
    rateLimit: number;
    isActive: boolean;
    lastUsedAt: string | null;
    sandboxMode: boolean;
}

export interface DeveloperUsage {
    requests: number | null;
    errors: number | null;
    latencyP99Ms: number | null;
    activeKeys?: number | null;
    rateLimit?: number | null;
    rateLimitWindowSeconds?: number | null;
    lastUsedAt?: string | null;
    portalKeys?: number | null;
    keys?: DeveloperUsageKey[];
    source?: string | null;
}

export type ApiHealthStatus = 'operational' | 'degraded' | 'down';

const asNumber = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

export const developerPortalApi = {
    getKeys: async (): Promise<ApiKey[]> => {
        const response = await api.get('/keys');
        return response.data as ApiKey[];
    },

    generateKey: async (data: {
        name: string;
        expiry: '12h' | '78h' | 'never';
        scopes?: string[];
        environment?: 'production' | 'sandbox';
    }): Promise<ApiKey> => {
        const response = await api.post('/keys', data);
        return response.data as ApiKey;
    },

    revokeKey: async (id: string): Promise<{ success: true; message: string }> => {
        const response = await api.delete(`/keys/${id}`);
        return response.data as { success: true; message: string };
    },

    rotateKey: async (id: string): Promise<ApiKey> => {
        const response = await api.post(`/keys/${id}/rotate`);
        return response.data as ApiKey;
    },

    getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
        const response = await api.get('/subscription-status');
        return response.data as SubscriptionStatus;
    },

    getUsage: async (): Promise<DeveloperUsage> => {
        const token = DualAuth.getCurrentToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const response = await axios.get(`${API_BASE}/api/developer-portal/usage`, { headers });
        const data = response.data as Record<string, unknown>;
        const nested = (data.usage && typeof data.usage === 'object'
            ? (data.usage as Record<string, unknown>)
            : data);
        const keys = Array.isArray(nested.keys) ? (nested.keys as DeveloperUsageKey[]) : [];
        return {
            requests: asNumber(nested.requests ?? nested.apiRequests ?? nested.totalCalls ?? nested.callsThisMonth),
            errors: asNumber(nested.errors ?? nested.errorCount),
            latencyP99Ms: asNumber(nested.latencyP99 ?? nested.latency_p99 ?? nested.p99 ?? nested.latencyP99Ms),
            activeKeys: asNumber(nested.activeKeys),
            rateLimit: asNumber(nested.rateLimit),
            rateLimitWindowSeconds: asNumber(nested.rateLimitWindowSeconds),
            lastUsedAt: typeof nested.lastUsedAt === 'string' ? nested.lastUsedAt : null,
            portalKeys: asNumber(nested.portalKeys),
            keys,
            source: typeof nested.source === 'string' ? nested.source : null,
        };
    },

    getApiHealth: async (): Promise<ApiHealthStatus> => {
        try {
            const response = await fetch(API_CONFIG.HEALTH.CERT);
            if (response.ok) return 'operational';
            return 'degraded';
        } catch {
            return 'down';
        }
    },
};
