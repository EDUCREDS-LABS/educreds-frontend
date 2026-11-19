// educreds-frontend/src/api/profile.ts
import axios from 'axios';
import { API_BASE } from '@/config/api';
import { clearAuthStorage, getAnyAuthToken } from '@/lib/authStorage';

function getAuthToken(): string | null {
  return getAnyAuthToken();
}

export interface InstitutionProfile {
  id: string;
  did: string;
  walletAddress: string;
  name: string;
  email: string;
  registrationNumber: string;
  poicScore: number;
  isVerified: boolean;
  verificationStatus: string;
  blockchainRegistered: boolean;
  iinTokenId?: number;
  deploymentTier: 'workspace' | 'cloud-connector' | 'enterprise-connector';
  connectorEndpoint?: string;
  connectorApiUrl?: string;
  webhookUrl?: string;
}

export const getInstitutionProfile = async (institutionId: string): Promise<InstitutionProfile> => {
  const authToken = getAuthToken();

  if (!authToken) {
    throw new Error('Authentication token not found. Please log in.');
  }

  try {
    const response = await axios.get<InstitutionProfile>(
      `${API_BASE}/api/institutions/profile`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}` 
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to get institution profile failed:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized access and redirect to login
      clearAuthStorage();
      window.location.href = '/login'; // Or use navigate if in a component
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch institution profile.');
  }
};
