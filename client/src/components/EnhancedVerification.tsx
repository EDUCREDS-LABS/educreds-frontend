import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  QrCode,
  ExternalLink,
  Download,
  Share2,
  Eye,
  Calendar,
  User,
  Building,
  Award,
  Fingerprint
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CertificateData {
  id: string;
  recipientName: string;
  recipientEmail: string;
  institutionName: string;
  certificateType: string;
  issuedDate: string;
  expiryDate?: string;
  status: 'valid' | 'revoked' | 'expired';
  blockchainTxHash: string;
  verificationUrl: string;
  metadata: {
    courseName?: string;
    grade?: string;
    credits?: number;
    instructor?: string;
  };
}

export const EnhancedVerification: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerification = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const response = await fetch(`/api/verify?certId=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Certificate not found.');
        } else {
          setError('Failed to verify certificate.');
        }
        throw new Error('Verification failed');
      }
      
      const result = await response.json();
      const verificationData = result.data;

      if (!verificationData || !verificationData.isValid) {
        setError('Certificate is not valid.');
        return;
      }

      const transformedCertificate: CertificateData = {
        id: verificationData.certificate.id,
        recipientName: verificationData.certificate.data.recipientName || 'N/A',
        recipientEmail: verificationData.certificate.data.recipientEmail || 'N/A',
        institutionName: verificationData.template?.metadata.name || 'N/A',
        certificateType: verificationData.template?.metadata.category || 'N/A',
        issuedDate: verificationData.certificate.issuedAt,
        status: 'valid', // The API only returns valid certs, so this is hardcoded
        blockchainTxHash: verificationData.certificate.certificateHash,
        verificationUrl: `${window.location.origin}/verify/${verificationData.certificate.id}`,
        metadata: {
          courseName: verificationData.certificate.data.courseName,
          grade: verificationData.certificate.data.grade,
          credits: verificationData.certificate.data.credits ? parseInt(verificationData.certificate.data.credits, 10) : undefined,
          instructor: verificationData.certificate.data.instructor,
        }
      };

      setCertificate(transformedCertificate);
    } catch (err) {
      if (!error) {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-100';
      case 'revoked': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="w-5 h-5" />;
      case 'revoked': return <AlertCircle className="w-5 h-5" />;
      case 'expired': return <AlertCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Certificate Verification</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Verify the authenticity of digital certificates using blockchain technology. 
            Enter a certificate ID or scan a QR code to get started.
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Verify Certificate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter certificate ID or verification code"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerification()}
                    className="text-lg h-12"
                  />
                </div>
                <Button 
                  onClick={handleVerification}
                  disabled={isLoading || !searchQuery.trim()}
                  size="lg"
                  className="px-8"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-center mt-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                  <Skeleton className="h-32" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  Verification Failed
                </h3>
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Certificate Details */}
        {certificate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Banner */}
            <Card className={`border-2 ${certificate.status === 'valid' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(certificate.status)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        Certificate {certificate.status === 'valid' ? 'Verified' : 'Invalid'}
                      </h3>
                      <p className="text-sm opacity-80">
                        {certificate.status === 'valid' 
                          ? 'This certificate is authentic and verified on the blockchain'
                          : 'This certificate could not be verified or has been revoked'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(certificate.status)}>
                    {certificate.status.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Recipient Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-lg font-semibold">{certificate.recipientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p>{certificate.recipientEmail}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Institution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Institution Name</label>
                    <p className="text-lg font-semibold">{certificate.institutionName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Certificate Type</label>
                    <p>{certificate.certificateType}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Certificate Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Certificate Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Issue Date</label>
                    <p className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(certificate.issuedDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                  {certificate.metadata.courseName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Course</label>
                      <p>{certificate.metadata.courseName}</p>
                    </div>
                  )}
                  {certificate.metadata.grade && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Grade</label>
                      <p>{certificate.metadata.grade}</p>
                    </div>
                  )}
                  {certificate.metadata.credits && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Credits</label>
                      <p>{certificate.metadata.credits}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Fingerprint className="w-5 h-5" />
                  <span>Blockchain Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Transaction Hash</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                      {certificate.blockchainTxHash}
                    </code>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Certificate ID</label>
                  <code className="block bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono mt-1">
                    {certificate.id}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Certificate
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share Verification
              </Button>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View on Blockchain
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};