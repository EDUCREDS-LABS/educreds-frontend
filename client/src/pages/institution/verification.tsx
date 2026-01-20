import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, AlertCircle, Upload, Eye, FileText, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";

interface UploadedDocument {
  type: string;
  description: string;
  url: string;
  originalName: string;
}

export default function Verification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);

  const { data: verificationStatus, isLoading } = useQuery({
    queryKey: ["/api/institutions/verification-status"],
    enabled: !!user,
  });

  const { data: oracleStatus, isLoading: oracleLoading } = useQuery({
    queryKey: ["/api/oracle/institution", user?.walletAddress],
    enabled: !!user?.walletAddress,
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.uploadVerificationDocuments(formData),
    onSuccess: (data) => {
      toast({
        title: "Documents uploaded successfully",
        description: "Your verification documents have been submitted for review.",
      });
      // Transform documents for display but backend receives URLs only
      setUploadedDocuments(data.documents || []);
      queryClient.invalidateQueries({ queryKey: ["/api/institutions/verification-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadOracleDocumentsMutation = useMutation({
    mutationFn: ({ walletAddress, formData }: { walletAddress: string, formData: FormData }) => 
      api.submitOracleDocuments(walletAddress, formData),
    onSuccess: (data) => {
      toast({
        title: "Oracle documents uploaded successfully",
        description: "Your documents have been submitted for Oracle verification.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/oracle/institution", user?.walletAddress] });
    },
    onError: (error: any) => {
      toast({
        title: "Oracle document upload failed",
        description: error.message || "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: File[], types: string[], descriptions: string[]) => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('documents', file);
      formData.append(`type${index}`, types[index] || 'Other');
      formData.append(`description${index}`, descriptions[index] || '');
    });

    uploadMutation.mutate(formData);
  };

  const handleOracleDocumentUpload = (files: File[], types: string[], descriptions: string[]) => {
    if (!user?.walletAddress) {
      toast({
        title: "Wallet address required",
        description: "Please connect your wallet to submit Oracle documents.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('documents', file);
      formData.append(`documentTypes`, types[index] || 'OTHER');
      formData.append('description', descriptions[index] || 'Document submitted for Oracle verification');
    });

    uploadOracleDocumentsMutation.mutate({
      walletAddress: user.walletAddress,
      formData
    });
  };

  const getVerificationStep = (step: string, isCompleted: boolean, isPending: boolean) => {
    if (isCompleted) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-medium text-neutral-900">{step}</h3>
          <p className="text-sm text-green-600">Completed</p>
        </div>
      );
    } else if (isPending) {
      return (
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="font-medium text-neutral-900">{step}</h3>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="font-medium text-neutral-900">{step}</h3>
          <p className="text-sm text-neutral-500">Not Started</p>
        </div>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Not Submitted</Badge>;
    }
  };

  const getOracleStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCREDITED':
        return <Badge className="bg-green-100 text-green-800">Accredited</Badge>;
      case 'PROVISIONAL':
        return <Badge className="bg-blue-100 text-blue-800">Provisional</Badge>;
      case 'UNVERIFIED':
        return <Badge variant="secondary">Unverified</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isVerified = (verificationStatus as any)?.isVerified;
  const status = (verificationStatus as any)?.verificationStatus || 'not_submitted';
  const documents = (verificationStatus as any)?.verificationDocuments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900" data-testid="page-title">
            Institution Verification
          </h1>
          <p className="text-neutral-600">Submit documents to verify your institution</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(status)}
          <Button asChild variant="outline">
            <a href="/institution/governance-verification">
              <Shield className="w-4 h-4 mr-2" />
              Governance Verification
            </a>
          </Button>
        </div>
      </div>

      {/* Verification Status Alert */}
      {!isVerified && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your institution needs to be verified before you can issue certificates. 
            Please upload the required verification documents below.
          </AlertDescription>
        </Alert>
      )}

      {/* Verification Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {getVerificationStep("Documents", status === 'approved', status === 'pending')}
            {getVerificationStep("Identity", isVerified, status === 'pending')}
            {getVerificationStep("Accreditation", isVerified, status === 'pending')}
            {getVerificationStep("Blockchain", isVerified && (verificationStatus as any)?.blockchainRegistered, isVerified && !(verificationStatus as any)?.blockchainRegistered)}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Status Alert */}
      {isVerified && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {(verificationStatus as any)?.blockchainRegistered 
              ? "Your institution is registered on the blockchain and can issue certificates."
              : "Your institution is verified but blockchain registration is pending. This will be completed automatically by our admin team."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Oracle Accreditation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Oracle Accreditation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {oracleLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : oracleStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Accreditation Status:</span>
                {getOracleStatusBadge((oracleStatus as any).accreditationStatus)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Trust Score:</span>
                <span className="text-sm text-neutral-600">
                  {(oracleStatus as any).trustScore}/100
                </span>
              </div>

              {(oracleStatus as any).oracleMatch && (
                <div className="text-sm text-neutral-600">
                  <p>✓ Matched against official NCHE records</p>
                  <p>Name similarity: {((oracleStatus as any).oracleMatch.nameMatchScore * 100).toFixed(1)}%</p>
                </div>
              )}

              <div className="text-xs text-neutral-500">
                Last updated: {new Date((oracleStatus as any).lastUpdated).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-neutral-500">No Oracle verification data available</p>
              <p className="text-sm text-neutral-400">Submit documents below to get verified</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload
            onUpload={handleFileUpload}
            isUploading={uploadMutation.isPending}
            acceptedFileTypes=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            maxFiles={10}
            maxFileSize={10 * 1024 * 1024} // 10MB
          />

          {/* Document Types Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-2">Registration Certificate</h4>
              <p className="text-sm text-neutral-500 mb-3">Official business registration document</p>
              <div className="flex items-center text-sm">
                {documents.some((doc: any) => doc.type.includes('Registration')) ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-green-600">Uploaded</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-yellow-600">Required</span>
                  </>
                )}
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-2">Accreditation Certificate</h4>
              <p className="text-sm text-neutral-500 mb-3">Educational accreditation documents</p>
              <div className="flex items-center text-sm">
                {documents.some((doc: any) => doc.type.includes('Accreditation')) ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-green-600">Uploaded</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-yellow-600">Required</span>
                  </>
                )}
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-2">Identity Verification</h4>
              <p className="text-sm text-neutral-500 mb-3">Director/Administrator ID documents</p>
              <div className="flex items-center text-sm">
                {documents.some((doc: any) => doc.type.includes('Identity')) ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-green-600">Uploaded</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-yellow-600">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((document: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-neutral-100 rounded-lg">
                      <FileText className="w-6 h-6 text-neutral-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900" data-testid={`document-name-${index}`}>
                        {document.originalName}
                      </h4>
                      <p className="text-sm text-neutral-500">{document.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-green-100 text-green-800">Submitted</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(document.url, '_blank')}
                      data-testid={`view-document-${index}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Oracle Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Oracle Evidence Submission
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Submit additional documents to improve your Oracle accreditation score
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUpload
            onUpload={handleOracleDocumentUpload}
            isUploading={uploadOracleDocumentsMutation.isPending}
            acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
            maxFiles={5}
            maxFileSize={10 * 1024 * 1024} // 10MB
          />

          {/* Oracle Document Types Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-2">Accreditation Certificate</h4>
              <p className="text-sm text-neutral-500 mb-3">Official NCHE accreditation documents</p>
              <div className="flex items-center text-sm">
                <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-600">Improves trust score</span>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-2">Registration Certificate</h4>
              <p className="text-sm text-neutral-500 mb-3">Official business registration</p>
              <div className="flex items-center text-sm">
                <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-600">Required for verification</span>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-2">Audit Reports</h4>
              <p className="text-sm text-neutral-500 mb-3">Financial and compliance audits</p>
              <div className="flex items-center text-sm">
                <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-600">Bonus points</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
