// educreds-frontend/src/api/onboarding.ts
import axios from 'axios';
import { API_BASE } from '@/config/api';

export interface InstitutionRegistrationData {
  name: string;
  email: string;
  walletAddress: string;
  registrationNumber: string;
  deploymentTier: 'workspace' | 'cloud-connector' | 'enterprise-connector';
  connectorEndpoint?: string; // For enterprise-connector
  connectorApiUrl?: string;   // For cloud-connector
}

export interface RegistrationResponse {
  message: string;
  institutionId: string;
  did: string;
  verificationStatus: string;
}

export interface InstitutionLoginData {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface LoginResponse {
  token: string;
  institution: {
    id: string;
    did: string;
    name: string;
    poicScore: number;
    isVerified: boolean;
  };
}

export const onboardInstitution = async (data: InstitutionRegistrationData): Promise<RegistrationResponse> => {
  try {
    const response = await axios.post<RegistrationResponse>(
      `${API_BASE}/institutions/register`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to onboard institution failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to onboard institution.');
  }
};

export const loginInstitution = async (data: InstitutionLoginData): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE}/institutions/login`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to login institution failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to login institution.');
  }
};
