import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { blockchainService, type CertificateData } from "@/lib/blockchain";
import { useToast } from "@/hooks/use-toast";
import { Certificate } from "@/shared/types/template";
// Removed ReownClient import - using ethers instead

// Declare global ethereum object for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}



export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();



  // Using ethers for wallet connection instead of ReownClient



  // Query for certificates when wallet is connected - use API fallback
  const { data: certificates, isLoading: certificatesLoading, refetch: refetchCertificates } = useQuery({
    queryKey: ["certificates", walletAddress],
    queryFn: async () => {
      try {
        // Try blockchain service first
        const blockchainCertificates = await blockchainService.getCertificatesByStudent(walletAddress);
        if (blockchainCertificates && blockchainCertificates.length > 0) {
          return blockchainCertificates;
        }
        
        // Fallback to API endpoint
        const API_BASE = import.meta.env.VITE_API_BASE;
        const response = await fetch(`${API_BASE}/api/certificates/student/${walletAddress}`);
        if (!response.ok) {
          console.warn('API fallback also failed, returning empty array');
          return [];
        }
        const data = await response.json();
        return data.certificates || [];
      } catch (error) {
        console.warn('Failed to fetch certificates from both blockchain and API:', error);
        return [];
      }
    },
    enabled: isConnected && !!walletAddress,
    retry: 1, // Limit retries to prevent infinite loops
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

        } else {

          setWalletAddress(accounts[0]);

          setIsConnected(true);

        }

      };



      window.ethereum.on('accountsChanged', handleAccountsChanged);



      return () => {

        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);

      };

    }

  }, []);



  const connect = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const address = await blockchainService.connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
      
      toast({
        title: "Wallet connected",
        description: "Successfully connected to your wallet and blockchain.",
      });
    } catch (error: any) {
      setError(error.message || "Failed to connect wallet");
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to your wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
    setError("");
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    });
  };



  const verifyCertificate = async (certificateId: string) => {

    try {

      // Try blockchain service first

      const result = await blockchainService.verifyCertificate(parseInt(certificateId, 10));

      return result;

    } catch (error: any) {

      // Fallback to API endpoint

      try {

        const response = await fetch(`/api/blockchain/certificate/${certificateId}`);

        if (!response.ok) throw new Error('Certificate not found');

        const data = await response.json();

        return data.certificate;

      } catch (apiError: any) {

        throw new Error(error.message || "Failed to verify certificate");

      }

    }

  };



  const mintCertificate = async (certificate: Certificate) => {

    setIsMinting(true);

    try {

      // Check if MetaMask is available

      if (typeof window.ethereum === 'undefined') {

        // Demo mode - simulate transaction

        const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

        

        toast({

          title: "Demo minting simulation",

          description: "Certificate minting simulated successfully. In production, this would be a real blockchain transaction.",

        });

        

        return mockTxHash;

      }



      const txHash = await blockchainService.mintCertificate(

        certificate.id,

        certificate.studentAddress,

        certificate.studentName,

        certificate.courseName,

        certificate.ipfsHash,

        certificate.grade,

        certificate.certificateType,

        new Date(certificate.completionDate).getTime()

      );

      

      // Refetch certificates after minting

      await refetchCertificates();

      

      return txHash;

    } catch (error: any) {

      // Fallback to demo mode if blockchain fails

      if (error.message.includes("MetaMask") || error.message.includes("extension not found")) {

        const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

        

        toast({

          title: "Demo minting simulation",

          description: "MetaMask not available. Certificate minting simulated for demo purposes.",

        });

        

        return mockTxHash;

      }

      

      throw new Error(error.message || "Failed to mint certificate");

    } finally {

      setIsMinting(false);

    }

  };



  const revokeCertificate = async (certificateId: string) => {

    try {

      const txHash = await blockchainService.revokeCertificate(parseInt(certificateId, 10));

      

      // Refetch certificates after revoking

      await refetchCertificates();

      

      return txHash;

    } catch (error: any) {

      throw new Error(error.message || "Failed to revoke certificate");

    }

  };



  const switchNetwork = async (chainId: string) => {

    try {

      await blockchainService.switchToCorrectNetwork(chainId);

    } catch (error: any) {

      throw new Error(error.message || "Failed to switch network");

    }

  };



  const getNetworkInfo = async () => {

    try {

      return await blockchainService.getNetworkInfo();

    } catch (error: any) {

      throw new Error(error.message || "Failed to get network info");

    }

  };



  return {

    isConnected,

    walletAddress,

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


