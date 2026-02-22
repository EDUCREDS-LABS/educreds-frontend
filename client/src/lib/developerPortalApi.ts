import axios from 'axios';
import { DualAuth } from './dualAuth';

const API_BASE = (typeof window !== 'undefined' && import.meta?.env?.VITE_API_URL) || 'http://localhost:5002'; // Default to 5002 for dev

const api = axios.create({
    baseURL: `${API_BASE}/api/developer-portal`, // Note: Backend routes are mounted at /api/developer-portal
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth interceptor
api.interceptors.request.use((config: any) => {
    const token = DualAuth.getCurrentToken();
    if (token) {
        if (!config.headers) {
            config.headers = {} as any;
        }
        // Type assertion to bypass strict typing issues with specific axios versions
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAt: string; // ISO date string
    expiresAt?: string; // ISO date string
    lastUsedAt?: string; // ISO date string
    isActive: boolean;
    apiKey?: string; // Only present upon creation
}

export interface SubscriptionStatus {
    active: boolean;
    plan: string;
    features: string[];
}

export const developerPortalApi = {
    getKeys: async (): Promise<ApiKey[]> => {
        const response = await api.get('/keys');
        return response.data as ApiKey[];
    },

    generateKey: async (data: { name: string; expiry: '12h' | '78h' | 'never' }): Promise<ApiKey> => {
        const response = await api.post('/keys', data);
        return response.data as ApiKey;
    },

    revokeKey: async (id: string): Promise<{ success: true; message: string }> => {
        const response = await api.delete(`/keys/${id}`);
        return response.data as { success: true; message: string };
    },

    getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
        const response = await api.get('/subscription-status');
        return response.data as SubscriptionStatus;
    }
};
