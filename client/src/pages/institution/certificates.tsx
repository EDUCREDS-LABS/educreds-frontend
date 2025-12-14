import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter, Eye, Edit, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import CreateCertificateModal from "@/components/CreateCertificateModal";
import { format } from "date-fns";
import type { Certificate } from "@shared/schema";

export default function Certificates() {
  const { user } = useAuth();
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900" data-testid="page-title">
            Certificate Management
          </h1>
          <p className="text-neutral-600">Manage and track your institution's certificates</p>
        </div>
        <Button onClick={() => setIsCertificateModalOpen(true)} data-testid="button-create-certificate">
          <Plus className="w-4 h-4 mr-2" />
          Create New Certificate
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="search-certificates"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[180px]">
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

      {/* Certificates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
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
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No certificates found</h3>
            <p className="text-neutral-500 mb-4">
              {searchTerm || statusFilter !== "all" || programFilter !== "all"
                ? "Try adjusting your search filters."
                : "Start by creating your first certificate."}
            </p>
            {(!searchTerm && statusFilter === "all" && programFilter === "all") && (
              <Button onClick={() => setIsCertificateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Certificate
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate: Certificate) => (
            <Card key={certificate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1" data-testid={`certificate-title-${certificate.id}`}>
                      {certificate.courseName}
                    </h3>
                    <p className="text-sm text-neutral-600" data-testid={`certificate-student-${certificate.id}`}>
                      {certificate.studentName}
                    </p>
                  </div>
                  {getStatusBadge(certificate)}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Issue Date:</span>
                    <span className="text-neutral-900">
                      {format(new Date(certificate.issuedAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Grade:</span>
                    <span className="text-neutral-900">{certificate.grade}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Type:</span>
                    <span className="text-neutral-900">{certificate.certificateType}</span>
                  </div>
                  {certificate.tokenId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">Token ID:</span>
                      <span className="text-neutral-900 font-mono">#{certificate.tokenId}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`https://ipfs.io/ipfs/${certificate.ipfsHash}`, '_blank')}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {certificate.isValid && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
