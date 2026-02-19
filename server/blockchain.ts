import { ethers, JsonRpcProvider } from 'ethers';

// Get environment variables from server
const CONTRACT_ADDRESS =
  process.env.VITE_CREDENTIAL_ISSUER_ADDRESS ||
  process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = process.env.CONTRACT_ABI;
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;

// Parse ABI from environment variable
let parsedABI: any[];
try {
  parsedABI = JSON.parse(CONTRACT_ABI || '[]');
} catch (error) {
  console.error('Failed to parse CONTRACT_ABI:', error);
  parsedABI = [];
}

// Initialize provider
const provider = new JsonRpcProvider(ETHEREUM_RPC_URL);

export interface BlockchainConfig {
  contractAddress: string;
  contractABI: any[];
  rpcUrl: string;
}

export function getBlockchainConfig(): BlockchainConfig {
  return {
    contractAddress: CONTRACT_ADDRESS || '',
    contractABI: parsedABI,
    rpcUrl: ETHEREUM_RPC_URL || '',
  };
}

export interface CertificateData {
  id: string;
  studentAddress: string;
  institutionAddress: string;
  studentName: string;
  courseName: string;
  issueDate: number;
  ipfsHash: string;
  isValid: boolean;
}

export class ServerBlockchainService {
  private contract: ethers.Contract | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (CONTRACT_ADDRESS && parsedABI.length && ETHEREUM_RPC_URL) {
      try {
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, parsedABI, provider);
        this.isConfigured = true;
      } catch (error) {
        console.warn('Failed to initialize blockchain contract:', error);
        this.isConfigured = false;
      }
    } else {
      console.log('Blockchain configuration not provided. Some features will be disabled.');
      this.isConfigured = false;
    }
  }

  private throwIfNotConfigured() {
    if (!this.isConfigured || !this.contract) {
      throw new Error('Blockchain service is not configured. Please set CONTRACT_ADDRESS, CONTRACT_ABI, and ETHEREUM_RPC_URL environment variables.');
    }
  }

  // Verify a certificate exists on-chain (read-only operation)
  async verifyCertificate(certificateId: string): Promise<CertificateData | null> {
    this.throwIfNotConfigured();
    try {
      const certificateData = await this.contract!.getCertificate(certificateId);
      
      // Check if certificate exists (assuming the contract returns default values for non-existent certificates)
      if (!certificateData || certificateData.studentAddress === ethers.ZeroAddress) {
        return null;
      }

      return {
        id: certificateId,
        studentAddress: certificateData.studentAddress,
        institutionAddress: certificateData.institutionAddress,
        studentName: certificateData.studentName,
        courseName: certificateData.courseName,
        issueDate: Number(certificateData.issueDate),
        ipfsHash: certificateData.ipfsHash,
        isValid: certificateData.isValid
      };
    } catch (error: any) {
      console.error('Failed to verify certificate:', error);
      throw new Error(`Failed to verify certificate: ${error.message}`);
    }
  }

  // Get all certificates for a student address (read-only operation)
  async getCertificatesByStudent(studentAddress: string): Promise<CertificateData[]> {
    this.throwIfNotConfigured();
    try {
      const certificateIds = await this.contract!.getCertificatesByStudent(studentAddress);
      const certificates: CertificateData[] = [];

      for (const id of certificateIds) {
        const cert = await this.verifyCertificate(id);
        if (cert) {
          certificates.push(cert);
        }
      }

      return certificates;
    } catch (error: any) {
      console.error('Failed to get certificates:', error);
      throw new Error(`Failed to get certificates: ${error.message}`);
    }
  }

  // Get all certificates issued by an institution (read-only operation)
  async getCertificatesByInstitution(institutionAddress: string): Promise<CertificateData[]> {
    this.throwIfNotConfigured();
    try {
      const certificateIds = await this.contract!.getCertificatesByInstitution(institutionAddress);
      const certificates: CertificateData[] = [];

      for (const id of certificateIds) {
        const cert = await this.verifyCertificate(id);
        if (cert) {
          certificates.push(cert);
        }
      }

      return certificates;
    } catch (error: any) {
      console.error('Failed to get institution certificates:', error);
      throw new Error(`Failed to get institution certificates: ${error.message}`);
    }
  }

  // Get the contract address
  getContractAddress(): string {
    return CONTRACT_ADDRESS || '';
  }

  // Get network information
  async getNetworkInfo(): Promise<{ chainId: number; name: string }> {
    this.throwIfNotConfigured();
    try {
      const network = await provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name
      };
    } catch (error: any) {
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }
}

// Export singleton instance
export const serverBlockchainService = new ServerBlockchainService();
