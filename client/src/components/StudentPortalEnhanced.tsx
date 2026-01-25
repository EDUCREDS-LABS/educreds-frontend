import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Award,
  Download,
  Share2,
  Eye,
  Calendar,
  Building,
  Star,
  Trophy,
  Medal,
  CheckCircle,
  ExternalLink,
  QrCode,
  Filter,
  Grid3X3,
  List,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { useWallet } from '@/hooks/useWallet';

interface Certificate {
  id: string;
  title: string;
  institution: string;
  type: 'degree' | 'certificate' | 'badge' | 'achievement';
  issuedDate: string;
  status: 'verified' | 'pending' | 'expired';
  grade?: string;
  creditsEarned?: number;
  verificationUrl: string;
  thumbnail: string;
  skills: string[];
  shareCount: number;
  viewCount: number;
  isMinted: boolean;
}

export const StudentPortalEnhanced: React.FC = () => {
  const { certificates: walletCertificates, isLoading, mintCertificate, isMinting } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const certificates = useMemo(() => {
    return walletCertificates.map((cert: any) => ({
      id: cert.id,
      title: cert.courseName,
      institution: cert.institutionName,
      type: cert.certificateType,
      issuedDate: cert.issuedAt,
      status: cert.isMinted ? 'verified' : 'pending',
      grade: cert.grade,
      creditsEarned: cert.credits,
      verificationUrl: `${window.location.origin}/verify/${cert.id}`,
      thumbnail: cert.thumbnail || '/cert-thumbnails/cs-degree.jpg', // Use cert thumbnail or fallback
      skills: cert.skills || [],
      shareCount: cert.shareCount || 0,
      viewCount: cert.viewCount || 0,
      isMinted: cert.isMinted
    }));
  }, [walletCertificates]);

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.institution.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || cert.type === selectedType;
    return matchesSearch && matchesType;
  });

  const { toast } = useToast();

  const handleShare = async (verificationUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Certificate',
          text: 'Check out my certificate!',
          url: verificationUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(verificationUrl);
        toast({
          title: "Copied to clipboard",
          description: "Certificate URL copied to clipboard.",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Error",
          description: "Could not copy to clipboard.",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalCredits = certificates.reduce((sum, cert) => sum + (cert.creditsEarned || 0), 0);
  const verifiedCount = certificates.filter(cert => cert.status === 'verified').length;

  const getTypeIcon = (type: string) => {
    const iconClass = viewMode === 'grid' ? "w-12 h-12" : "w-8 h-8";
    switch (type) {
      case 'degree': return <Trophy className={`${iconClass} text-blue-600`} />;
      case 'certificate': return <Award className={`${iconClass} text-indigo-600`} />;
      case 'badge': return <Medal className={`${iconClass} text-orange-600`} />;
      case 'achievement': return <Star className={`${iconClass} text-yellow-600`} />;
      default: return <CheckCircle className={`${iconClass} text-green-600`} />;
    }
  };

  const handleView = (id: string) => {
    window.open(`${window.location.origin}/verify/${id}`, '_blank');
  };

  const handleDownload = async (id: string) => {
    try {
      const shareData = await api.getSharePackage(id);
      if (shareData.w3cCredential) {
        const blob = new Blob([JSON.stringify(shareData.w3cCredential, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credential-${id}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Started",
          description: "Your W3C Verifiable Credential has been downloaded.",
        });
      } else {
        throw new Error("W3C Credential not available for this certificate.");
      }
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download credential.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">My Credentials</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage and share your verified digital certificates
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{certificates.length}</div>
              <div className="text-sm text-gray-600">Total Certificates</div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{verifiedCount}</div>
                <div className="text-sm text-gray-600">Verified</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{totalCredits}</div>
                <div className="text-sm text-gray-600">Credits Earned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {certificates.reduce((sum, cert) => sum + cert.viewCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Profile Views</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Share2 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {certificates.reduce((sum, cert) => sum + cert.shareCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Shares</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 flex space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search certificates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="degree">Degrees</option>
                    <option value="certificate">Certificates</option>
                    <option value="badge">Badges</option>
                    <option value="achievement">Achievements</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Certificates Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCertificates.map((certificate, index) => (
              <motion.div
                key={certificate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-0">
                    {/* Certificate Preview */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getTypeIcon(certificate.type)}
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className={getStatusColor(certificate.status)}>
                          {certificate.status}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {certificate.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {certificate.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">{certificate.institution}</p>

                      {certificate.grade && (
                        <div className="mb-3">
                          <Badge variant="outline" className="text-xs">
                            {certificate.grade}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(certificate.issuedDate).toLocaleDateString()}
                        {certificate.creditsEarned && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{certificate.creditsEarned} credits</span>
                          </>
                        )}
                      </div>

                      {/* Skills */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {certificate.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {certificate.skills.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{certificate.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {certificate.viewCount}
                          </div>
                          <div className="flex items-center">
                            <Share2 className="w-4 h-4 mr-1" />
                            {certificate.shareCount}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1" onClick={() => handleView(certificate.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleShare(certificate.verificationUrl)}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(certificate.id)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        {!certificate.isMinted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => mintCertificate(certificate)}
                            disabled={isMinting}
                          >
                            {isMinting ? "Minting..." : "Mint Certificate"}
                          </Button>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {filteredCertificates.map((certificate, index) => (
              <motion.div
                key={certificate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getTypeIcon(certificate.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{certificate.title}</h3>
                            <p className="text-gray-600">{certificate.institution}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(certificate.issuedDate).toLocaleDateString()}
                              </div>
                              {certificate.creditsEarned && (
                                <span>{certificate.creditsEarned} credits</span>
                              )}
                              <div className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {certificate.viewCount}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(certificate.status)}>
                              {certificate.status}
                            </Badge>
                            <Button size="sm" variant="outline" onClick={() => handleView(certificate.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            {!certificate.isMinted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => mintCertificate(certificate)}
                                disabled={isMinting}
                              >
                                {isMinting ? "Minting..." : "Mint Certificate"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {filteredCertificates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No certificates found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};