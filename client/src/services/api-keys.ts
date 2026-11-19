// educreds-frontend/src/api/api-keys.ts
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { getAnyAuthToken } from '@/lib/authStorage';

const getAuthToken = () =>
  getAnyAuthToken() || '';

export interface ApiKey {
  id: string;
  clientId: string;
  name: string;
  isActive: boolean;
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateApiKeyRequest {
  name: string;
  scopes?: string[];
  expiresInDays?: number;
}

export interface GenerateApiKeyResponse {
  clientId: string;
  clientSecret: string;
}

export const generateApiKey = async (
  _institutionId: string,
  data: GenerateApiKeyRequest
): Promise<GenerateApiKeyResponse> => {
  const authToken = getAuthToken();

  try {
    const response = await axios.post<GenerateApiKeyResponse>(
      `${API_CONFIG.INSTITUTIONS.BASE}/api-keys`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` 
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to generate API key failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to generate API key.');
  }
};

export const listApiKeys = async (_institutionId: string): Promise<ApiKey[]> => {
  const authToken = getAuthToken();

  try {
    const response = await axios.get<ApiKey[]>(
      `${API_CONFIG.INSTITUTIONS.BASE}/api-keys`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}` 
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to list API keys failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to list API keys.');
  }
};

export const revokeApiKey = async (_institutionId: string, clientId: string): Promise<{ message: string }> => {
  const authToken = getAuthToken();

  try {
    const response = await axios.delete<{ message: string }>(
      `${API_CONFIG.INSTITUTIONS.BASE}/api-keys/${clientId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}` 
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to revoke API key failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to revoke API key.');
  }
};
