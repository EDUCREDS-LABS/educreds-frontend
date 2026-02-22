import { ethers, JsonRpcProvider } from 'ethers';
import { CONTRACT_CONFIG, type CertificateData, type InstitutionStats } from './contract';
import { walletService } from './walletService';

// Re-export types for external use
export type { CertificateData, InstitutionStats };

// Initialize provider with error handling
let provider: JsonRpcProvider;

try {
  provider = new JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
} catch (error) {
  console.warn('Failed to initialize blockchain provider:', error);
  // Create a mock provider that will fail gracefully
  provider = new JsonRpcProvider('https://invalid-url');
}



export class BlockchainService {
  private contract: ethers.Contract;

  constructor() {
    // Initialize with read-only provider. Write operations will use a signer-connected contract.
    this.contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, provider);
  }

  // This is now a helper to get a contract instance connected to a signer for write operations.
  private async getSignedContract(): Promise<ethers.Contract> {
    const signer = walletService.getSigner();
    if (!signer) {
      // Try to connect if not connected
      await walletService.connect();
      const newSigner = walletService.getSigner();
      if (!newSigner) {
        throw new Error('Wallet not connected or signer not available.');
      }
      return this.contract.connect(newSigner) as ethers.Contract;
    }
    return this.contract.connect(signer) as ethers.Contract;
  }

  public isWalletConnected(): boolean {
    return walletService.isConnected();
  }

  // Issue a new certificate on-chain (for institutions)
  async issueCertificate(
    studentAddress: string,
    studentName: string,
    courseName: string,
    grade: string,
    ipfsHash: string,
    completionDate: number,
    certificateType: string
  ): Promise<number> {
    try {
      const contract = await this.getSignedContract();
      const tx = await contract.issueCertificate(
        studentAddress,
        studentName,
        courseName,
        grade,
        ipfsHash,
        completionDate,
        certificateType
      );

      const receipt = await tx.wait();
      
      // Get the token ID from the event
      const event = receipt.logs?.find((log: any) => {
        try {
          const decoded = contract.interface.parseLog(log);
          return decoded?.name === 'CertificateIssued';
        } catch {
          return false;
        }
      }) as ethers.Log | undefined;
      
      if (event) {
        const decodedEvent = this.contract.interface.parseLog(event);
        if (decodedEvent && decodedEvent.args) {
          return Number(decodedEvent.args.tokenId);
        }
      }
      
      throw new Error('Certificate issued but token ID not found');
    } catch (error: any) {
      throw new Error(`Failed to issue certificate: ${error.message}`);
    }
  }

  // Verify a certificate exists on-chain by token ID
  async verifyCertificate(tokenId: number): Promise<CertificateData | null> {
    try {
      const certificateData = await this.contract.verifyCertificate(tokenId);
      
      // Check if certificate exists
      if (!certificateData || !certificateData.isValid) {
        return null;
      }

      return {
        studentName: certificateData.studentName,
        institutionName: certificateData.institutionName,
        courseName: certificateData.courseName,
        grade: certificateData.grade,
        issueDate: Number(certificateData.issueDate),
        ipfsHash: certificateData.ipfsHash,
        isValid: certificateData.isValid,
        issuedBy: certificateData.issuedBy,
        completionDate: Number(certificateData.completionDate),
        certificateType: certificateData.certificateType
      };
    } catch (error: any) {
      throw new Error(`Failed to verify certificate: ${error.message}`);
    }
  }

  // Verify a certificate by IPFS hash
  async verifyCertificateByIPFS(ipfsHash: string): Promise<{ exists: boolean; tokenId: number; certificate: CertificateData | null }> {
    try {
      // Ensure ipfsHash is a valid string and not empty
      if (!ipfsHash || typeof ipfsHash !== 'string') {
        throw new Error('Invalid IPFS hash: must be a non-empty string');
      }

      // Clean the IPFS hash (remove any whitespace or special characters)
      const cleanIpfsHash = ipfsHash.trim();
      
      // Validate IPFS hash format (basic validation)
      if (!cleanIpfsHash.startsWith('Qm') || cleanIpfsHash.length < 46) {
        throw new Error('Invalid IPFS hash format');
      }

      const result = await this.contract.verifyCertificateByIPFS(cleanIpfsHash);
      
      if (!result.exists) {
        return { exists: false, tokenId: 0, certificate: null };
      }

      const certificate = {
        studentName: result.cert.studentName,
        institutionName: result.cert.institutionName,
        courseName: result.cert.courseName,
        grade: result.cert.grade,
        issueDate: Number(result.cert.issueDate),
        ipfsHash: result.cert.ipfsHash,
        isValid: result.cert.isValid,
        issuedBy: result.cert.issuedBy,
        completionDate: Number(result.cert.completionDate),
        certificateType: result.cert.certificateType
      };

      return { 
        exists: true, 
        tokenId: Number(result.tokenId), 
        certificate 
      };
    } catch (error: any) {
      throw new Error(`Failed to verify certificate by IPFS: ${error.message}`);
    }
  }

  // Get all certificates for a student address
  async getCertificatesByStudent(studentAddress: string): Promise<number[]> {
    try {
      // Check if provider is connected
      if (!provider || !CONTRACT_CONFIG.rpcUrl || CONTRACT_CONFIG.rpcUrl.includes('invalid-url')) {
        console.warn('Blockchain provider not configured, returning empty array');
        return [];
      }
      
      const certificateIds = await this.contract.getStudentCertificates(studentAddress);
      return certificateIds.map((id: any) => Number(id));
    } catch (error: any) {
      console.warn('Failed to get student certificates from blockchain:', error.message);
      // Return empty array instead of throwing error to prevent infinite retries
      return [];
    }
  }

  // Get institution statistics
  async getInstitutionStats(institutionAddress: string): Promise<{
    name: string;
    isAuthorized: boolean;
    registrationDate: number;
    certificatesIssued: number;
  }> {
    try {
      const stats = await this.contract.getInstitutionStats(institutionAddress);
      return {
        name: stats[0],
        isAuthorized: stats[1],
        registrationDate: Number(stats[2]),
        certificatesIssued: Number(stats[3])
      };
    } catch (error: any) {
      throw new Error(`Failed to get institution stats: ${error.message}`);
    }
  }

  // Register an institution
  async registerInstitution(name: string, email: string): Promise<string> {
    try {
      const contract = await this.getSignedContract();
      const tx = await contract.registerInstitution(name, email);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      throw new Error(`Failed to register institution: ${error.message}`);
    }
  }

  // Update institution information
  async updateInstitutionInfo(newName: string, newEmail: string): Promise<string> {
    try {
      const contract = await this.getSignedContract();
      const tx = await contract.updateInstitutionInfo(newName, newEmail);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      throw new Error(`Failed to update institution info: ${error.message}`);
    }
  }

  // Revoke a certificate (set as invalid)
  async revokeCertificate(tokenId: number): Promise<string> {
    try {
      const contract = await this.getSignedContract();
      const tx = await contract.revokeCertificate(tokenId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      throw new Error(`Failed to revoke certificate: ${error.message}`);
    }
  }

  // Batch issue certificates
  async batchIssueCertificates(
    students: string[],
    studentNames: string[],
    courseNames: string[],
    grades: string[],
    ipfsHashes: string[],
    completionDates: number[],
    certificateTypes: string[]
  ): Promise<number[]> {
    try {
      const contract = await this.getSignedContract();
      const tx = await contract.batchIssueCertificates(
        students,
        studentNames,
        courseNames,
        grades,
        ipfsHashes,
        completionDates,
        certificateTypes
      );

      const receipt = await tx.wait();
      
      // Get the token IDs from the events
      const events = receipt.logs?.filter((log: any) => {
        try {
          const decoded = contract.interface.parseLog(log);
          return decoded?.name === 'CertificateIssued';
        } catch {
          return false;
        }
      }) || [];
      
      return events.map((event: ethers.Log) => {
        const decodedEvent = this.contract.interface.parseLog(event);
        if (decodedEvent && decodedEvent.args) {
          return Number(decodedEvent.args.tokenId);
        }
        return 0;
      }).filter((id: number) => id > 0);
    } catch (error: any) {
      throw new Error(`Failed to batch issue certificates: ${error.message}`);
    }
  }

  // Get the contract address
  getContractAddress(): string {
    return CONTRACT_CONFIG.address;
  }

  // Get total number of certificates
  async getTotalCertificates(): Promise<number> {
    try {
      const total = await this.contract.getTotalCertificates();
      return Number(total);
    } catch (error: any) {
      throw new Error(`Failed to get total certificates: ${error.message}`);
    }
  }

  // Mint a certificate to a student's wallet (different from issueCertificate)
  // This is used when a certificate has already been issued but needs to be minted to student's wallet
  async mintCertificate(
    certificateId: string,
    studentAddress: string,
    studentName: string,
    courseName: string,
    ipfsHash: string,
    grade?: string,
    certificateType?: string,
    completionDate?: number
  ): Promise<any> { // Returning tx hash would require waiting for it, let's return tokenId
    try {
      // Use the existing issueCertificate function to mint to blockchain
      // Default values if not provided
      const defaultGrade = grade || "A";
      const defaultType = certificateType || "Certificate";
      const defaultCompletionDate = completionDate || Math.floor(Date.now() / 1000);
      
      const tokenId = await this.issueCertificate(
        studentAddress,
        studentName,
        courseName,
        defaultGrade,
        ipfsHash,
        defaultCompletionDate,
        defaultType
      );

      // Returning tokenId is more useful here
      return tokenId;
    } catch (error: any) {
      throw new Error(`Failed to mint certificate: ${error.message}`);
    }
  }

  // Check if IPFS hash exists
  async checkIPFSHashExists(ipfsHash: string): Promise<boolean> {
    try {
      const exists = await this.contract.ipfsHashExists(ipfsHash);
      return exists;
    } catch (error: any) {
      throw new Error(`Failed to check IPFS hash: ${error.message}`);
    }
  }

  // Get network information
  async getNetworkInfo(): Promise<{ chainId: number; name: string }> {
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

  // Switch to the correct network
  async switchToCorrectNetwork(targetChainId: string): Promise<void> {
    const rawProvider = walletService.getRawProvider();
    if (!rawProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      await rawProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        throw new Error('Please add this network to your wallet first');
      }
      throw new Error(`Failed to switch network: ${error.message}`);
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();