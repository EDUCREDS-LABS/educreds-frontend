// educreds-frontend/src/api/health-status.ts
import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import { getAnyAuthToken } from '@/lib/authStorage';

const getAuthToken = () =>
  getAnyAuthToken() || '';

export interface ConnectorHealth {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'n/a';
  lastChecked: string;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
  message: string;
  latencyMs?: number;
}

export interface SystemComponentHealth {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'n/a';
  message?: string;
}

export interface TrustAgentHealth extends SystemComponentHealth {
  poicModelVersion?: string;
  poicModelHash?: string;
}

export interface InstitutionHealthStatus {
  overall: SystemComponentHealth['status'];
  systemComponents: {
    database: SystemComponentHealth;
    trustAgent: TrustAgentHealth;
    // Add other system components as needed
  };
  institutionSpecific: {
    connector: ConnectorHealth;
    webhook: SystemComponentHealth;
  };
}

export const getInstitutionHealthStatus = async (institutionId: string): Promise<InstitutionHealthStatus> => {
  const authToken = getAuthToken();

  try {
    const response = await axios.get<InstitutionHealthStatus>(
      `${API_CONFIG.INSTITUTIONS.BASE}/${institutionId}/health-status`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}` 
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to get institution health status failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch institution health status.');
  }
};
