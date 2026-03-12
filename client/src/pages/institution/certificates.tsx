import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter, Eye, Edit, AlertTriangle, Download, Award, Check, Clock, X, CalendarIcon, Star, Hash, Trash2 } from "lucide-react";
import { saveAs } from "file-saver";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import CreateCertificateModal from "@/components/CreateCertificateModal";
import { format } from "date-fns";
import type { Certificate } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { API_CONFIG } from "@/config/api";

export default function Certificates() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<string[]>([]);

  const { data: certificatesData, isLoading } = useQuery({
    queryKey: ["/api/certificates/institution"],
    queryFn: api.getCertificates,
    enabled: !!user,
    refetchOnMount: true,
  });

  const certificates = certificatesData?.certificates || [];

  const filteredCertificates = certificates.filter((cert: Certificate) => {
    const matchesSearch = cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && cert.isValid) ||
                         (statusFilter === "pending" && !cert.isMinted) ||
                         (statusFilter === "revoked" && !cert.isValid);
    
    const matchesProgram = programFilter === "all" || 
                          cert.courseName.toLowerCase().includes(programFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const getStatusBadge = (certificate: Certificate) => {
    if (!certificate.isValid) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    // Show Active for issued certificates, Pending only if not yet issued
    if (certificate.issuedAt && certificate.ipfsHash) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVisibleCertificateIds = filteredCertificates.map(cert => cert.id);
      setSelectedCertificateIds(allVisibleCertificateIds);
    } else {
      setSelectedCertificateIds([]);
    }
  };

  const handleSelectCertificate = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCertificateIds(prev => [...prev, id]);
    } else {
      setSelectedCertificateIds(prev => prev.filter(certId => certId !== id));
    }
  };

  const handleBulkRevoke = async () => {
    if (selectedCertificateIds.length === 0) return;

    if (!window.confirm(`Are you sure you want to revoke ${selectedCertificateIds.length} certificates? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.post(
        `${API_CONFIG.CERT}/api/certificates/bulk-revoke`,
        { certificateIds: selectedCertificateIds },
        { headers: getAuthHeaders() }
      );
      toast({
        title: 'Certificates Revoked',
        description: `${selectedCertificateIds.length} certificates have been revoked successfully.`,
      });
      setSelectedCertificateIds([]); // Clear selections
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] }); // Refresh list
    } catch (error: any) {
      toast({
        title: 'Revocation Failed',
        description: error.response?.data?.message || 'Failed to revoke certificates.',
        variant: 'destructive',
      });
    }
  };


  const handleExportCsv = () => {
    if (filteredCertificates.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no certificates matching your current filters to export.',
        variant: 'info',
      });
      return;
    }

    const headers = [
      "ID", "Student Name", "Student Address", "Course Name", "Grade",
      "Certificate Type", "Issued At", "IPFS Hash", "Token ID", "Status"
    ];

    const csvRows = filteredCertificates.map(cert => [
      `"${cert.id}"`,
      `"${cert.studentName}"`,
      `"${cert.studentAddress}"`,
      `"${cert.courseName}"`,
      `"${cert.grade}"`,
      `"${cert.certificateType}"`,
      `"${format(new Date(cert.issuedAt), "yyyy-MM-dd HH:mm:ss")}"`,
      `"${cert.ipfsHash || ''}"`,
      `"${cert.tokenId || ''}"`,
      `"${cert.isValid ? 'Active' : 'Revoked'}"`,
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'certificates.csv');

    toast({
      title: 'Export Successful',
      description: `${filteredCertificates.length} certificates exported to certificates.csv.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent" data-testid="page-title">
              Certificate Management
            </h1>
            <p className="text-neutral-600 mt-1">Manage, track, and issue your institution's digital credentials</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {selectedCertificateIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkRevoke}
                className="bg-red-600 hover:bg-red-700"
                data-testid="bulk-revoke-button"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Revoke ({selectedCertificateIds.length})
              </Button>
            )}
            <Button 
              onClick={() => setLocation('/institution/issue')} 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
              data-testid="button-create-certificate"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Certificate
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportCsv}
              className="border-neutral-200 hover:bg-neutral-50"
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-25 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Certificates</p>
                <p className="text-2xl font-bold text-blue-900">{filteredCertificates.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-25 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-900">{filteredCertificates.filter((c: Certificate) => c.isValid && c.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-25 border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-900">{filteredCertificates.filter((c: Certificate) => c.status === 'pending').length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-25 border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Revoked</p>
                <p className="text-2xl font-bold text-red-900">{filteredCertificates.filter((c: Certificate) => c.status === 'revoked').length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select All Checkbox - Enhanced */}
      {filteredCertificates.length > 0 && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <Checkbox
            id="selectAll"
            checked={selectedCertificateIds.length === filteredCertificates.length && filteredCertificates.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="selectAll" className="text-sm font-medium text-blue-900">
            Select All ({selectedCertificateIds.length} of {filteredCertificates.length} selected)
          </label>
        </div>
      )}

      {/* Search and Filter - Professional Card */}
      <Card className="border border-neutral-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by certificate name, student, or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-neutral-200 focus:border-blue-500 focus:ring-blue-500"
                data-testid="search-certificates"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-neutral-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-full sm:w-[180px] border-neutral-200">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="computer">Computer Science</SelectItem>
                  <SelectItem value="business">Business Administration</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Grid - Advanced Card Design */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-neutral-200">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCertificates.length === 0 ? (
        <Card className="border border-neutral-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No certificates found</h3>
            <p className="text-neutral-600 mb-6">
              {searchTerm || statusFilter !== "all" || programFilter !== "all"
                ? "Try adjusting your search filters to find what you're looking for."
                : "Start by creating your first certificate to get began managing digital credentials."}
            </p>
            {(!searchTerm && statusFilter === "all" && programFilter === "all") && (
              <Button 
                onClick={() => setLocation('/institution/issue')}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Certificate
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate: Certificate) => {
            const isRevoked = certificate.status === 'revoked';
            const isPending = certificate.status === 'pending';
            const isActive = certificate.isValid && certificate.status === 'active';
            
            // Determine color scheme based on status
            const colorScheme = isRevoked 
              ? { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-100', text: 'text-red-700' }
              : isPending
              ? { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100', text: 'text-amber-700' }
              : { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100', text: 'text-blue-700' };

            return (
              <Card 
                key={certificate.id} 
                className={`${colorScheme.border} border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 group overflow-hidden`}
              >
                {/* Status bar top */}
                <div className={`h-1 ${isRevoked ? 'bg-red-500' : isPending ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`} />
                
                <CardContent className="p-6">
                  {/* Header with status badge and checkbox */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 text-lg mb-1 line-clamp-2" data-testid={`certificate-title-${certificate.id}`}>
                        {certificate.courseName}
                      </h3>
                      <p className="text-sm text-neutral-600 line-clamp-1" data-testid={`certificate-student-${certificate.id}`}>
                        {certificate.studentName}
                      </p>
                    </div>
                    <div className="flex gap-2 items-start">
                      {getStatusBadge(certificate)}
                      <Checkbox
                        checked={selectedCertificateIds.includes(certificate.id!)}
                        onCheckedChange={(checked: boolean) => handleSelectCertificate(certificate.id!, checked)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Certificate info grid */}
                  <div className={`${colorScheme.bg} rounded-lg p-4 mb-4 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-neutral-500" />
                        <span className="text-xs text-neutral-600 font-medium">Issue Date</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {format(new Date(certificate.issuedAt), "MMM dd, yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-neutral-500" />
                        <span className="text-xs text-neutral-600 font-medium">Grade</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 bg-white px-3 py-1 rounded-full">
                        {certificate.grade}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-neutral-500" />
                        <span className="text-xs text-neutral-600 font-medium">Type</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">{certificate.certificateType}</span>
                    </div>

                    {certificate.tokenId && (
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-neutral-500" />
                          <span className="text-xs text-neutral-600 font-medium">Token ID</span>
                        </div>
                        <span className="text-xs font-mono text-neutral-700 bg-white px-2 py-1 rounded">
                          #{certificate.tokenId.toString().slice(-6)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons with hover reveal */}
                  <div className="flex gap-2 opacity-100 group-hover:opacity-100 transition-all">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-neutral-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      onClick={() => window.open(`https://ipfs.io/ipfs/${certificate.ipfsHash}`, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-neutral-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {certificate.isValid && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Certificate Modal */}
      <CreateCertificateModal
        open={isCertificateModalOpen}
        onOpenChange={setIsCertificateModalOpen}
      />
    </div>
  );
}
