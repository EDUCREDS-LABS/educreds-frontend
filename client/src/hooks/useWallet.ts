import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { blockchainService, type CertificateData } from "@/lib/blockchain";
import { useToast } from "@/hooks/use-toast";
import { Certificate } from "@/shared/types/template";

// Declare global ethereum object for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

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
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string>("");
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
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
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
          // Handle both response formats: certificates array or nested in object
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
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    retry: 1,
    retryDelay: 1000,
  });



  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await blockchainService.isWalletConnected();
        if (connected) {
          const address = await blockchainService.getWalletAddress();
          if (address) {
            setWalletAddress(address);
            setIsConnected(true);
            
            // Get network info
            try {
              const networkInfo = await blockchainService.getNetworkInfo();
              setNetworkId(networkInfo.chainId);
            } catch (networkError) {
              console.warn('Failed to get network info:', networkError);
            }
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkConnection();
  }, []);


  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsConnected(false);
          setWalletAddress("");
          setNetworkId("");
        } else {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        }
      };

      const handleChainChanged = (chainId: string) => {
        setNetworkId(chainId);
        // Reload page on network change
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);



  const connect = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Check if MetaMask or any Web3 wallet is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      const address = await blockchainService.connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
      
      // Get network info
      try {
        const networkInfo = await blockchainService.getNetworkInfo();
        setNetworkId(networkInfo.chainId);
      } catch (networkError) {
        console.warn('Failed to get network info:', networkError);
      }
      
      toast({
        title: "Wallet connected",
        description: `Connected to wallet: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
      });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to connect wallet";
      setError(errorMessage);
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Wallet connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
    setNetworkId("");
    setError("");
    
    // Clear any wallet-related data from localStorage
    try {
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('networkId');
    } catch (err) {
      console.warn('Failed to clear localStorage:', err);
    }
    
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    });
  };



  const verifyCertificate = async (certificateId: string) => {
    try {
      // Try API endpoint first (more reliable)
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

      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        // Demo mode - simulate transaction
        const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        toast({
          title: "Demo minting",
          description: "In production, this would be a real blockchain transaction.",
        });
        
        return mockTxHash;
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
      
      // Refetch certificates after minting
      await refetchCertificates();
      
      toast({
        title: "Certificate minted",
        description: `Transaction: ${txHash.substring(0, 10)}...`,
      });
      
      return txHash;
    } catch (error: any) {
      // Fallback to demo mode if blockchain fails
      if (error.message.includes("MetaMask") || error.message.includes("extension not found")) {
        const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        toast({
          title: "Demo minting simulation",
          description: "MetaMask not available. Simulated for demo purposes.",
        });
        
        return mockTxHash;
      }
      
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
      
      // Refetch certificates after revoking
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
    walletAddress,
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


