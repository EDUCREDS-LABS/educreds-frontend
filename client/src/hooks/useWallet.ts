import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { blockchainService, type CertificateData } from "@/lib/blockchain";
import { useToast } from "@/hooks/use-toast";
import { Certificate } from "@/shared/types/template";
import { walletService } from "@/lib/walletService";

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON response but got ${contentType || 'unknown'} - Server returned: ${response.statusText}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    const text = await response.text();
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }
}

export function useWallet() {
  const [isConnected, setIsConnected] = useState(walletService.isConnected());
  const [walletAddress, setWalletAddress] = useState<string | null>(walletService.getAddress());
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string>("");
  const { toast } = useToast();

  // Query for certificates when wallet is connected - use API fallback
  const { data: certificates, isLoading: certificatesLoading, refetch: refetchCertificates } = useQuery({
    queryKey: ["certificates", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      
      try {
        const API_BASE = import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
          const response = await fetch(
            `${API_BASE}/api/v1/verify/wallet/${walletAddress}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(`API returned status ${response.status}: ${response.statusText}`);
            return [];
          }

          const data = await safeJsonParse(response);
          const certs = data.certificates || data.data || data.payload || [];
          return Array.isArray(certs) ? certs : [];
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.warn('Certificate fetch request timed out');
          } else {
            console.warn('Certificate fetch error:', fetchError.message);
          }
          return [];
        }
      } catch (error: any) {
        console.warn('Failed to fetch certificates:', error.message);
        return [];
      }
    },
    enabled: isConnected && !!walletAddress,
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
    retryDelay: 1000,
  });

  // Subscribe to walletService events
  useEffect(() => {
    const handleConnect = ({ address, chainId }: { address: string; chainId: string }) => {
      setIsConnected(true);
      setWalletAddress(address);
      setNetworkId(chainId);
      setIsLoading(false);
    };

    const handleChange = ({ address, chainId }: { address: string; chainId: string }) => {
      setWalletAddress(address);
      setNetworkId(chainId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setWalletAddress(null);
      setNetworkId("");
      setIsLoading(false);
    };

    walletService.on('connect', handleConnect);
    walletService.on('change', handleChange);
    walletService.on('disconnect', handleDisconnect);

    // Check initial state
    walletService.getWalletState().then(state => {
      if (state.isConnected && state.address) {
        handleConnect({ address: state.address, chainId: state.chainId || '' });
      }
    });

    return () => {
      walletService.removeListener('connect', handleConnect);
      walletService.removeListener('change', handleChange);
      walletService.removeListener('disconnect', handleDisconnect);
    };
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // modal.open() resolves when the modal UI is visible (before the user connects).
      // Actual connection state is updated via walletService subscribeProvider callback.
      await walletService.connect();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to open wallet";
      setError(errorMessage);
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Wallet connection error:', error);
    } finally {
      // Reset loading after the modal opens so the button isn't stuck
      setIsLoading(false);
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    walletService.disconnect();
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    });
  }, [toast]);

  const verifyCertificate = async (certificateId: string) => {
    try {
      const API_BASE = import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001";
      
      const response = await fetch(
        `${API_BASE}/api/v1/verify/${certificateId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Certificate verification failed with status ${response.status}`);
      }

      const data = await safeJsonParse(response);
      return data.certificate || data.data || data;
    } catch (error: any) {
      const errorMessage = `Failed to verify certificate: ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const mintCertificate = async (certificate: Certificate) => {
    setIsMinting(true);
    setError("");
    
    try {
      if (!walletAddress) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      const txHash = await blockchainService.mintCertificate(
        certificate.id,
        certificate.studentAddress || walletAddress,
        certificate.studentName,
        certificate.courseName,
        certificate.ipfsHash,
        certificate.grade,
        certificate.certificateType,
        new Date(certificate.completionDate).getTime()
      );
      
      await refetchCertificates();
      
      toast({
        title: "Certificate minted",
        description: `Transaction: ${txHash.substring(0, 10)}...`,
      });
      
      return txHash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to mint certificate";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  const revokeCertificate = async (certificateId: string) => {
    try {
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      const txHash = await blockchainService.revokeCertificate(parseInt(certificateId, 10));
      
      await refetchCertificates();
      
      toast({
        title: "Certificate revoked",
        description: `Transaction: ${txHash.substring(0, 10)}...`,
      });
      
      return txHash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to revoke certificate";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const switchNetwork = async (chainId: string) => {
    try {
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }
      
      await blockchainService.switchToCorrectNetwork(chainId);
      
      toast({
        title: "Network switched",
        description: `Switched to chain ${chainId}`,
      });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to switch network";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getNetworkInfo = async () => {
    try {
      return await blockchainService.getNetworkInfo();
    } catch (error: any) {
      console.warn('Failed to get network info:', error.message);
      return { chainId: '0', name: 'Unknown' };
    }
  };

  return {
    isConnected,
    walletAddress: walletAddress || "",
    networkId,
    certificates: certificates || [],
    isLoading: isLoading || certificatesLoading,
    isMinting,
    error,
    connect,
    disconnect,
    verifyCertificate,
    mintCertificate,
    revokeCertificate,
    switchNetwork,
    getNetworkInfo,
    refetchCertificates,
  };
}
