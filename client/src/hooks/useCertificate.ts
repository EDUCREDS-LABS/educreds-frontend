import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { certificateService, CertificateIssueRequest, CertificateVerificationResponse } from '@/lib/certificateService';
import { toast } from 'sonner';

export function useCertificate() {
  const queryClient = useQueryClient();

  // Issue a single certificate
  const issueCertificate = useMutation({
    mutationFn: (request: CertificateIssueRequest) => 
      certificateService.issueCertificate(request),
    onSuccess: (data) => {
      toast.success(
        data.status === 'minted' 
          ? 'Certificate issued and minted on blockchain successfully!' 
          : 'Certificate issued successfully!'
      );
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to issue certificate: ${error.message}`);
    }
  });

  // Batch issue certificates
  const batchIssueCertificates = useMutation({
    mutationFn: (requests: CertificateIssueRequest[]) => 
      certificateService.batchIssueCertificates(requests),
    onSuccess: (results) => {
      const successCount = results.filter(r => r.status !== 'failed').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      
      if (successCount > 0) {
        toast.success(`Successfully issued ${successCount} certificates`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} certificates failed to issue`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to batch issue certificates: ${error.message}`);
    }
  });

  // Verify a certificate by ID
  const verifyCertificate = useQuery({
    queryKey: ['certificate', 'verify'],
    queryFn: () => Promise.resolve(null),
    enabled: false
  });

  const verifyCertificateMutation = useMutation({
    mutationFn: (certificateId: string) => 
      certificateService.verifyCertificate(certificateId),
    onSuccess: (data) => {
      toast.success(
        data.isValid 
          ? 'Certificate verified successfully!' 
          : 'Certificate is invalid or has been revoked'
      );
    },
    onError: (error: any) => {
      toast.error(`Failed to verify certificate: ${error.message}`);
    }
  });

  // Verify a certificate by IPFS hash
  const verifyCertificateByIPFS = useMutation({
    mutationFn: (ipfsHash: string) => 
      certificateService.verifyCertificateByIPFS(ipfsHash),
    onSuccess: (data) => {
      toast.success(
        data.isValid 
          ? 'Certificate verified successfully!' 
          : 'Certificate is invalid or has been revoked'
      );
    },
    onError: (error: any) => {
      toast.error(`Failed to verify certificate: ${error.message}`);
    }
  });

  // Get certificates by wallet address
  const getCertificatesByWallet = (walletAddress: string) => useQuery({
    queryKey: ['certificates', 'wallet', walletAddress],
    queryFn: () => certificateService.getCertificatesByWallet(walletAddress),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get institution statistics
  const getInstitutionStats = (institutionAddress: string) => useQuery({
    queryKey: ['stats', 'institution', institutionAddress],
    queryFn: () => certificateService.getInstitutionStats(institutionAddress),
    enabled: !!institutionAddress,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Connect student wallet
  const connectStudentWallet = useMutation({
    mutationFn: (walletAddress: string) => 
      certificateService.connectStudentWallet(walletAddress),
    onSuccess: () => {
      toast.success('Wallet connected successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to connect wallet: ${error.message}`);
    }
  });

  // Revoke a certificate
  const revokeCertificate = useMutation({
    mutationFn: ({ certificateId, tokenId }: { certificateId: string; tokenId?: number }) => 
      certificateService.revokeCertificate(certificateId, tokenId),
    onSuccess: () => {
      toast.success('Certificate revoked successfully!');
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to revoke certificate: ${error.message}`);
    }
  });

  return {
    // Mutations
    issueCertificate,
    batchIssueCertificates,
    verifyCertificateMutation,
    verifyCertificateByIPFS,
    connectStudentWallet,
    revokeCertificate,
    
    // Queries
    getCertificatesByWallet,
    getInstitutionStats,
    
    // Loading states
    isIssuing: issueCertificate.isPending,
    isBatchIssuing: batchIssueCertificates.isPending,
    isVerifying: verifyCertificateMutation.isPending,
    isVerifyingIPFS: verifyCertificateByIPFS.isPending,
    isConnectingWallet: connectStudentWallet.isPending,
    isRevoking: revokeCertificate.isPending,
  };
}

// Hook for certificate verification
export function useCertificateVerification() {
  const [verificationResult, setVerificationResult] = useState<CertificateVerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyById = async (certificateId: string) => {
    setIsVerifying(true);
    try {
      const result = await certificateService.verifyCertificate(certificateId);
      setVerificationResult(result);
      return result;
    } catch (error: any) {
      toast.error(`Failed to verify certificate: ${error.message}`);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyByIPFS = async (ipfsHash: string) => {
    setIsVerifying(true);
    try {
      const result = await certificateService.verifyCertificateByIPFS(ipfsHash);
      setVerificationResult(result);
      return result;
    } catch (error: any) {
      toast.error(`Failed to verify certificate: ${error.message}`);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verificationResult,
    isVerifying,
    verifyById,
    verifyByIPFS,
    clearResult: () => setVerificationResult(null)
  };
}

// Hook for wallet certificate management
export function useWalletCertificates(walletAddress: string) {
  const { data: certificates, isLoading, error, refetch } = useQuery({
    queryKey: ['certificates', 'wallet', walletAddress],
    queryFn: () => certificateService.getCertificatesByWallet(walletAddress),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const connectWallet = useMutation({
    mutationFn: (address: string) => certificateService.connectStudentWallet(address),
    onSuccess: () => {
      toast.success('Wallet connected successfully!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to connect wallet: ${error.message}`);
    }
  });

  return {
    certificates: certificates || [],
    isLoading,
    error,
    refetch,
    connectWallet,
    isConnecting: connectWallet.isPending
  };
}
