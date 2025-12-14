import { api } from './api';
import { blockchainService, CertificateData } from './blockchain';

export interface CertificateIssueRequest {
  studentName: string;
  studentEmail: string;
  studentWalletAddress?: string;
  courseName: string;
  grade: string;
  completionDate: string;
  certificateType: string;
  certificateFile: File;
  additionalData?: Record<string, any>;
}

export interface CertificateIssueResponse {
  certificateId: string;
  ipfsHash: string;
  tokenId?: number;
  transactionHash?: string;
  status: 'pending' | 'minted' | 'failed';
}

export interface CertificateVerificationResponse {
  certificateId: string;
  tokenId?: number;
  ipfsHash: string;
  blockchainData?: CertificateData;
  backendData?: any;
  isValid: boolean;
  verificationSource: 'blockchain' | 'backend' | 'both';
}

export class CertificateService {
  // Issue a certificate through the backend and optionally mint on blockchain
  async issueCertificate(request: CertificateIssueRequest): Promise<CertificateIssueResponse> {
    try {
      // 1. Create form data for backend
      const formData = new FormData();
      formData.append('studentName', request.studentName);
      formData.append('studentEmail', request.studentEmail);
      if (request.studentWalletAddress) {
        formData.append('studentWalletAddress', request.studentWalletAddress);
      }
      formData.append('courseName', request.courseName);
      formData.append('grade', request.grade);
      formData.append('completionDate', request.completionDate);
      formData.append('certificateType', request.certificateType);
      formData.append('certificateFile', request.certificateFile);
      
      if (request.additionalData) {
        formData.append('additionalData', JSON.stringify(request.additionalData));
      }

      // 2. Issue certificate through backend
      const backendResponse = await api.issueCertificate(formData);
      
      const response: CertificateIssueResponse = {
        certificateId: backendResponse.certificateId,
        ipfsHash: backendResponse.ipfsHash,
        status: 'pending'
      };

      // 3. Always attempt to mint on blockchain (institution wallet)
      try {
        // Connect wallet if not already connected
        await blockchainService.connectWallet();
        
        // Convert completion date to timestamp
        const completionTimestamp = Math.floor(new Date(request.completionDate).getTime() / 1000);
        
        // Use student wallet address if provided, otherwise use a default address
        const studentAddress = request.studentWalletAddress || '0x0000000000000000000000000000000000000000';
        
        // Mint certificate on blockchain
        const tokenId = await blockchainService.issueCertificate(
          studentAddress,
          request.studentName,
          request.courseName,
          request.grade,
          backendResponse.ipfsHash,
          completionTimestamp,
          request.certificateType
        );

        // Update backend with blockchain data
        await api.updateCertificateAfterMint(backendResponse.certificateId, {
          tokenId,
          walletAddress: studentAddress
        });

        response.tokenId = tokenId;
        response.status = 'minted';
      } catch (blockchainError) {
        console.error('Blockchain minting failed:', blockchainError);
        response.status = 'failed';
        // Certificate is still valid in backend, just not on blockchain
      }

      return response;
    } catch (error: any) {
      throw new Error(`Failed to issue certificate: ${error.message}`);
    }
  }

  // Batch issue certificates
  async batchIssueCertificates(requests: CertificateIssueRequest[]): Promise<CertificateIssueResponse[]> {
    const results: CertificateIssueResponse[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.issueCertificate(request);
        results.push(result);
      } catch (error: any) {
        results.push({
          certificateId: '',
          ipfsHash: '',
          status: 'failed'
        });
        console.error(`Failed to issue certificate for ${request.studentName}:`, error);
      }
    }
    
    return results;
  }

  // Verify a certificate by ID
  async verifyCertificate(certificateId: string): Promise<CertificateVerificationResponse> {
    try {
      // 1. Verify through backend
      const backendData = await api.verifyCertificate(certificateId);
      
      const response: CertificateVerificationResponse = {
        certificateId,
        ipfsHash: backendData.ipfsHash,
        backendData,
        isValid: backendData.isValid,
        verificationSource: 'backend'
      };

      // 2. If there's a token ID, verify on blockchain too
      if (backendData.tokenId) {
        try {
          const blockchainData = await blockchainService.verifyCertificate(backendData.tokenId);
          
          if (blockchainData) {
            response.blockchainData = blockchainData;
            response.tokenId = backendData.tokenId;
            response.verificationSource = 'both';
            response.isValid = response.isValid && blockchainData.isValid;
          }
        } catch (blockchainError) {
          console.error('Blockchain verification failed:', blockchainError);
          // Backend verification is still valid
        }
      }

      return response;
    } catch (error: any) {
      throw new Error(`Failed to verify certificate: ${error.message}`);
    }
  }

  // Verify a certificate by IPFS hash
  async verifyCertificateByIPFS(ipfsHash: string): Promise<CertificateVerificationResponse> {
    try {
      // 1. Verify on blockchain
      const blockchainResult = await blockchainService.verifyCertificateByIPFS(ipfsHash);
      
      const response: CertificateVerificationResponse = {
        certificateId: '',
        ipfsHash,
        isValid: !!(blockchainResult.exists && blockchainResult.certificate?.isValid),
        verificationSource: blockchainResult.exists ? 'blockchain' : 'backend'
      };

      if (blockchainResult.exists && blockchainResult.certificate) {
        response.blockchainData = blockchainResult.certificate;
        response.tokenId = blockchainResult.tokenId;
      }

      // 2. Try to find in backend as well
      try {
        // This would require a backend endpoint to search by IPFS hash
        // For now, we'll just use blockchain verification
      } catch (backendError) {
        console.error('Backend verification failed:', backendError);
      }

      return response;
    } catch (error: any) {
      throw new Error(`Failed to verify certificate by IPFS: ${error.message}`);
    }
  }

  // Get certificates for a wallet address
  async getCertificatesByWallet(walletAddress: string): Promise<CertificateVerificationResponse[]> {
    try {
      // 1. Get from backend
      const backendCertificates = await api.getCertificatesByWallet(walletAddress);
      
      // 2. Get from blockchain
      const blockchainTokenIds = await blockchainService.getCertificatesByStudent(walletAddress);
      
      const results: CertificateVerificationResponse[] = [];
      
      // Process backend certificates
      for (const cert of backendCertificates) {
        const response: CertificateVerificationResponse = {
          certificateId: cert.id,
          ipfsHash: cert.ipfsHash,
          backendData: cert,
          isValid: cert.isValid,
          verificationSource: 'backend'
        };

        if (cert.tokenId) {
          try {
            const blockchainData = await blockchainService.verifyCertificate(cert.tokenId);
            if (blockchainData) {
              response.blockchainData = blockchainData;
              response.tokenId = cert.tokenId;
              response.verificationSource = 'both';
              response.isValid = response.isValid && blockchainData.isValid;
            }
          } catch (error) {
            console.error(`Failed to verify token ${cert.tokenId}:`, error);
          }
        }

        results.push(response);
      }

      // Add blockchain-only certificates
      for (const tokenId of blockchainTokenIds) {
        const existingCert = results.find(r => r.tokenId === tokenId);
        if (!existingCert) {
          try {
            const blockchainData = await blockchainService.verifyCertificate(tokenId);
            if (blockchainData) {
              results.push({
                certificateId: '',
                ipfsHash: blockchainData.ipfsHash,
                blockchainData,
                tokenId,
                isValid: blockchainData.isValid,
                verificationSource: 'blockchain'
              });
            }
          } catch (error) {
            console.error(`Failed to verify token ${tokenId}:`, error);
          }
        }
      }

      return results;
    } catch (error: any) {
      throw new Error(`Failed to get certificates by wallet: ${error.message}`);
    }
  }

  // Get institution statistics
  async getInstitutionStats(institutionAddress: string): Promise<{
    backendStats: any;
    blockchainStats: any;
  }> {
    try {
      const [backendStats, blockchainStats] = await Promise.all([
        api.getStats().catch(() => null),
        blockchainService.getInstitutionStats(institutionAddress).catch(() => null)
      ]);

      return {
        backendStats,
        blockchainStats
      };
    } catch (error: any) {
      throw new Error(`Failed to get institution stats: ${error.message}`);
    }
  }

  // Connect student wallet
  async connectStudentWallet(walletAddress: string): Promise<void> {
    try {
      await api.connectWallet(walletAddress);
    } catch (error: any) {
      throw new Error(`Failed to connect student wallet: ${error.message}`);
    }
  }

  // Revoke a certificate
  async revokeCertificate(certificateId: string, tokenId?: number): Promise<void> {
    try {
      // Revoke on blockchain if token ID is provided
      if (tokenId) {
        await blockchainService.revokeCertificate(tokenId);
      }

      // Revoke on backend (this would need a backend endpoint)
      // await api.revokeCertificate(certificateId);
    } catch (error: any) {
      throw new Error(`Failed to revoke certificate: ${error.message}`);
    }
  }
}

// Export singleton instance
export const certificateService = new CertificateService();
