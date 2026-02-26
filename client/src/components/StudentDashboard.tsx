import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CertificateCard } from '@/components/CertificateCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Award, Share2, Eye } from 'lucide-react';

export function StudentDashboard() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        const address = accounts[0];
        setWalletAddress(address);
        setConnected(true);
        
        // Connect wallet on backend
        await api.connectWallet(address);
        
        // Load certificates
        await loadCertificates(address);
      } catch (error: any) {
        const message = error.message || 'Unknown error';
        setError(`Failed to connect wallet: ${message}`);
        console.error('Failed to connect wallet:', message);
      }
    } else {
      alert('Please install MetaMask to connect your wallet');
    }
  };

  const loadCertificates = async (address: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getCertificatesByWallet(address);
      const normalizedCertificates = Array.isArray(result)
        ? result
        : Array.isArray(result?.certificates)
          ? result.certificates
          : [];
      setCertificates(normalizedCertificates);
    } catch (error: any) {
      const message = error.message || 'Unknown error';
      setError(`Failed to load certificates: ${message}`);
      console.error('Failed to load certificates:', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Student Certificate Wallet</h1>
          <p className="text-gray-600">Manage and share your educational credentials</p>
        </div>

        {/* Wallet Connection */}
        {!connected ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Connect Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Connect your wallet to view and manage your certificates
              </p>
              <Button onClick={connectWallet} className="w-full">
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Wallet Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Connected Wallet</p>
                      <p className="text-sm text-gray-600 font-mono">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{certificates.length}</p>
                      <p className="text-sm text-gray-600">Certificates</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {certificates.filter(c => c.isMinted).length}
                      </p>
                      <p className="text-sm text-gray-600">Minted</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Share2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">W3C Verifiable Credentials</h3>
                  <p className="text-sm text-gray-600">
                    Share standards-compliant credentials with any platform
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Blockchain Verified</h3>
                  <p className="text-sm text-gray-600">
                    Immutable proof of authenticity on the blockchain
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <Eye className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Multiple Formats</h3>
                  <p className="text-sm text-gray-600">
                    QR codes, URLs, and traditional verification methods
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Certificates */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Certificates</h2>
                <Button 
                  variant="outline" 
                  onClick={() => loadCertificates(walletAddress)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>

              {error && (
                <Card className="mb-4 border-red-200 bg-red-50">
                  <CardContent className="pt-4 text-sm text-red-700">
                    {error}
                  </CardContent>
                </Card>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <p>Loading certificates...</p>
                </div>
              ) : certificates.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No Certificates Found</h3>
                    <p className="text-gray-600">
                      Certificates issued to this wallet address will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map((certificate) => (
                    <CertificateCard 
                      key={certificate.id} 
                      certificate={certificate}
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
