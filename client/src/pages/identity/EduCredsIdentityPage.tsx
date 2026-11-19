import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, BookUser, Mail, ShieldCheck } from 'lucide-react';
import { API_CONFIG } from '../../config/api';

// Real public identity profile fetch (Phase 6: EDU-ID is public, shareable).
const fetchPublicIdentity = async (eduCredsId: string) => {
  const response = await fetch(`${API_CONFIG.CERT}/api/identities/${eduCredsId}`);
  if (!response.ok) {
    throw new Error('EduCreds Identity not found.');
  }
  return response.json();
};

export default function EduCredsIdentityPage() {
  const { eduCredsId } = useParams<{ eduCredsId: string }>();
  const [loading, setLoading] = useState(true);
  const [identityData, setIdentityData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eduCredsId) {
      fetchPublicIdentity(eduCredsId)
        .then((data: any) => {
          setIdentityData(data);
        })
        .catch(err => {
          console.error(err);
          setError('EduCreds Identity not found.');
        })
        .finally(() => setLoading(false));
    }
  }, [eduCredsId]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  const shortWallet = identityData.walletAddress
    ? `${identityData.walletAddress.slice(0, 10)}…${identityData.walletAddress.slice(-8)}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-black">
              {identityData.eduCredsId?.replace('EDU-', '').slice(0, 2) || 'ID'}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold">{identityData.eduCredsId}</h1>
              {shortWallet && (
                <p className="text-lg font-mono text-gray-500">{shortWallet}</p>
              )}
              <div className="flex items-center justify-center sm:justify-start space-x-4 mt-2">
                {identityData.claimMethod && (
                  <span className="flex items-center text-sm text-gray-600">
                    <ShieldCheck className="mr-1.5 h-4 w-4" /> Claimed via {identityData.claimMethod}
                  </span>
                )}
                {identityData.walletAddress && (
                  <span className="flex items-center text-sm text-gray-600">
                    <Globe className="mr-1.5 h-4 w-4" /> 1 Linked Wallet
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credentials Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BookUser className="mr-2 h-5 w-5" />
            Verified Credentials
          </h2>
          <div className="space-y-4">
            {identityData.certificates?.map((cred: any) => (
              <Card key={cred.id}>
                <CardHeader>
                  <CardTitle>{cred.courseName}</CardTitle>
                  <CardDescription>
                    Issued by: {cred.institutionName} on {cred.issuedAt?.slice(0, 10)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/verify">
                    <Badge variant="outline" className="cursor-pointer">
                      View &amp; Verify Credential
                    </Badge>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {(!identityData.certificates || identityData.certificates.length === 0) && (
              <p>No credentials have been claimed for this identity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
