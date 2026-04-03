import { API_CONFIG } from '@/config/api';

export interface OracleSnapshot {
  id: string;
  snapshotHash: string;
  recordCount: number;
  createdAt: string;
  uploadedBy: string;
  description?: string;
  isActive: boolean;
}

export interface InstitutionProfile {
  walletAddress: string;
  name: string;
  accreditationStatus: 'ACCREDITED' | 'PROVISIONAL' | 'UNVERIFIED';
  trustScore: number;
  oracleMatch: boolean;
  manualOverride?: {
    status: string;
    reason: string;
    adminId: string;
    createdAt: string;
  };
  submittedDocuments: number;
  lastUpdated: string;
}

class OracleService {
  async getSnapshots(): Promise<OracleSnapshot[]> {
    const response = await fetch(API_CONFIG.ORACLE.SNAPSHOTS, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Oracle snapshots');
    }
    
    const data = await response.json();
    return data.snapshots || [];
  }

  async getInstitutionProfile(walletAddress: string): Promise<InstitutionProfile | null> {
    const response = await fetch(API_CONFIG.ORACLE.INSTITUTION(walletAddress));
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch institution profile');
    }
    
    return await response.json();
  }

  async uploadNCHEData(file: File, description?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', 'admin');
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(API_CONFIG.ORACLE.INGEST, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload NCHE data');
    }

    return await response.json();
  }

  async manualOverride(
    walletAddress: string, 
    status: 'ACCREDITED' | 'PROVISIONAL' | 'UNVERIFIED',
    reason: string
  ): Promise<InstitutionProfile> {
    const response = await fetch(API_CONFIG.ORACLE.OVERRIDE(walletAddress), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status,
        reason,
        adminId: 'admin'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to apply manual override');
    }

    const data = await response.json();
    return data.profile;
  }
}

export const oracleService = new OracleService();
