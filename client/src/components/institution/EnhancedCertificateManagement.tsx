import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Search, Eye, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Certificate } from "@shared/schema";

export default function EnhancedCertificateManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [revokingCert, setRevokingCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [editFormData, setEditFormData] = useState({ studentName: "", grade: "" });

  const { data: certificatesData, isLoading } = useQuery({
    queryKey: ["/api/certificates/institution"],
    queryFn: api.getCertificates,
    enabled: !!user,
  });

  const certificates = certificatesData?.certificates || [];

  const updateCertMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<Certificate> }) =>
      api.updateCertificate(data.id, data.updates),
    onSuccess: () => {
      toast({ title: "Success", description: "Certificate updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
      setEditingCert(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const revokeCertMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) =>
      api.revokeCertificate(data.id, data.reason),
    onSuccess: () => {
      toast({ title: "Certificate Revoked", description: "Certificate has been revoked successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
      setRevokingCert(null);
      setRevokeReason("");
    },
    onError: (error: any) => {
      toast({ title: "Revocation Failed", description: error.message, variant: "destructive" });
    },
  });

  const filteredCertificates = certificates.filter((cert: Certificate) => {
    const matchesSearch = cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && cert.isValid) ||
                         (statusFilter === "revoked" && !cert.isValid);
    return matchesSearch && matchesStatus;
  });

  const handleRevoke = () => {
    if (revokingCert && revokeReason.trim()) {
      revokeCertMutation.mutate({ id: revokingCert.id, reason: revokeReason });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Certificate Management</h1>
          <p className="text-neutral-600">View, edit, and manage certificates</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by student or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No certificates found</h3>
            <p className="text-neutral-600">Try adjusting your search filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCertificates.map((cert: Certificate) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1">{cert.courseName}</h3>
                    <p className="text-sm text-neutral-600">{cert.studentName}</p>
                  </div>
                  {cert.isValid ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Revoked</Badge>
                  )}
                </div>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Issue Date:</span>
                    <span>{format(new Date(cert.issuedAt), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Grade:</span>
                    <span>{cert.grade}</span>
                  </div>
                  {cert.tokenId && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Token:</span>
                      <span className="font-mono">#{cert.tokenId}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`https://ipfs.io/ipfs/${cert.ipfsHash}`, '_blank')}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingCert(cert)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {cert.isValid && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setRevokingCert(cert)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog 
        open={!!editingCert} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingCert(null);
            setEditFormData({ studentName: "", grade: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Certificate</DialogTitle>
            <DialogDescription>Update certificate details</DialogDescription>
          </DialogHeader>
          {editingCert && (
            <div className="space-y-4">
              <div>
                <Label>Student Name</Label>
                <Input 
                  value={editFormData.studentName || editingCert.studentName}
                  onChange={(e) => setEditFormData({ ...editFormData, studentName: e.target.value })}
                />
              </div>
              <div>
                <Label>Grade</Label>
                <Input 
                  value={editFormData.grade || editingCert.grade || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                  placeholder="e.g., A+, Pass, 95%"
                />
              </div>
              <div>
                <Label>Course Name</Label>
                <Input 
                  value={editingCert.courseName}
                  disabled
                  className="bg-neutral-100 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500 mt-1">Course name cannot be edited</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingCert(null);
              setEditFormData({ studentName: "", grade: "" });
            }}>Cancel</Button>
            <Button 
              onClick={() => {
                if (editingCert) {
                  const updates: Partial<Certificate> = {};
                  if (editFormData.studentName && editFormData.studentName !== editingCert.studentName) {
                    updates.studentName = editFormData.studentName;
                  }
                  if (editFormData.grade && editFormData.grade !== editingCert.grade) {
                    updates.grade = editFormData.grade;
                  }
                  updateCertMutation.mutate({ id: editingCert.id, updates });
                }
              }}
              disabled={updateCertMutation.isPending}
            >
              {updateCertMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={!!revokingCert} onOpenChange={() => setRevokingCert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Certificate</DialogTitle>
            <DialogDescription>This action cannot be undone. Please provide a reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Revocation Reason *</Label>
              <Textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={4}
                placeholder="Enter the reason for revoking this certificate..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokingCert(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={!revokeReason.trim() || revokeCertMutation.isPending}>
              {revokeCertMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Revoking...</>
              ) : (
                "Revoke Certificate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}