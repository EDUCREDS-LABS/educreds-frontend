// educreds-frontend/src/api/poic.ts
import axios from 'axios';
import { API_BASE } from '@/config/api'; // Ensure this path is correct
import { getAnyAuthToken } from '@/lib/authStorage';

// Define the submission data structure expected by the backend
export interface FrontendPoICSubmissionData {
  institutionId: string;
  institutionName: string;
  dimension1: {
    governmentRegistrationConfidence: number;
    accreditationCredibility: number;
    accreditationStability: number;
    legalRiskProbability: number;
  };
  dimension2: {
    digitalFootprintLongevity: number;
    facultyVerifiability: number;
    publicRegistryConsistency: number;
    studentBodyEvidence: number;
    infrastructureSignals: number;
  };
  dimension5: {
    baseScore: number;
    severityLevel: "none" | "low" | "medium" | "high" | "critical";
  };
}

// Define the expected response structure from the backend
export interface PoICCalculationResult {
  masterScore: number;
  dimensions: any;
  issuanceCapacity: {
    tier: string;
    maxIssuances: number;
    description: string;
  };
  governanceAction: {
    recommendation: string;
    rationale: string;
    restrictions: string[];
    suggestedMonitoring: string[];
  };
  auditTrail: any[];
}

export const submitPoICData = async (
  institutionId: string,
  data: FrontendPoICSubmissionData
): Promise<PoICCalculationResult> => {
  try {
    const authToken = getAnyAuthToken();
    const response = await axios.patch<PoICCalculationResult>(
      `${API_BASE}/institutions/${institutionId}/poic-submission`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to submit PoIC data failed:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to submit PoIC data to backend.');
    }
    throw new Error('Network error or unexpected response from backend.');
  }
};
