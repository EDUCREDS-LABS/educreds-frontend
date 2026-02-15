import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  FileText, 
  Building, 
  Globe, 
  MapPin,
  Mail,
  Phone,
  Shield,
  Loader2,
  ArrowRight,
  Info
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";

const verificationSchema = z.object({
  institutionName: z.string().min(3, "Institution name must be at least 3 characters"),
  institutionType: z.enum(["university", "college", "training_center", "online_platform"]),
  country: z.string().min(2, "Country is required"),
  domain: z.string().url("Must be a valid URL").or(z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, "Must be a valid domain")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  registrationNumber: z.string().min(1, "Registration number is required"),
  accreditationBody: z.string().optional(),
  accreditationNumber: z.string().optional(),
  contactEmail: z.string().email("Must be a valid email"),
  contactPhone: z.string().optional(),
  address: z.string().min(10, "Address must be at least 10 characters"),
  representativeWallets: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address")),
  description: z.string().min(50, "Description must be at least 50 characters"),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

export default function GovernanceVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ type: string; url: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      institutionName: "",
      institutionType: "university",
      country: "",
      domain: "",
      website: "",
      registrationNumber: "",
      accreditationBody: "",
      accreditationNumber: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      representativeWallets: [""],
      description: "",
    },
  });

  // Check if institution already has a proposal
  const { data: existingProposal, isLoading: proposalLoading } = useQuery({
    queryKey: ["/governance/proposals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const proposals = await api.governance.getAllProposals();
        return proposals.find((p: any) => p.institution_name === user?.name || p.institutionId === user?.id);
      } catch {
        return null;
      }
    },
  });

  const { data: verificationStatus, isLoading: verificationStatusLoading } = useQuery({
    queryKey: ["institution-verification-status", user?.id],
    enabled: !!user?.id,
    queryFn: () => api.getVerificationStatus(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.uploadVerificationDocuments(formData);
    },
    onSuccess: (data) => {
      const documents = data.documents || [];
      setUploadedDocuments(prev => [...prev, ...documents.map((d: any) => ({
        type: d.type,
        url: d.url,
        name: d.originalName || d.name
      }))]);
      toast({
        title: "Documents uploaded",
        description: "Your documents have been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload documents.",
        variant: "destructive",
      });
    },
  });

  const submitProposalMutation = useMutation({
    mutationFn: async (data: VerificationFormData) => {
      return api.governance.createProposal({
        institution_name: data.institutionName,
        institution_type: data.institutionType,
        country: data.country,
        domain: data.domain,
        website: data.website,
        registration_number: data.registrationNumber,
        accreditation_body: data.accreditationBody,
        accreditation_number: data.accreditationNumber,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        address: data.address,
        representative_wallets: data.representativeWallets.filter(w => w.length > 0),
        description: data.description,
        institution_documents: uploadedDocuments.map(d => d.url),
        wallet_address: user?.walletAddress,
        institutionId: user?.id,
        metadata: {
          registrationNumber: data.registrationNumber,
          accreditationBody: data.accreditationBody,
          accreditationNumber: data.accreditationNumber,
        }
      });
    },
    onSuccess: (proposal) => {
      toast({
        title: "Proposal submitted",
        description: "Your institution verification proposal has been submitted for AI analysis and DAO review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/governance/proposals"] });
      form.reset();
      setUploadedDocuments([]);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit proposal. Please try again.",
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

  const onSubmit = async (data: VerificationFormData) => {
    if (uploadedDocuments.length === 0) {
      toast({
        title: "Documents required",
        description: "Please upload at least one verification document.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitProposalMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addWalletField = () => {
    form.setValue("representativeWallets", [...form.watch("representativeWallets"), ""]);
  };

  const removeWalletField = (index: number) => {
    const wallets = form.watch("representativeWallets");
    if (wallets.length > 1) {
      form.setValue("representativeWallets", wallets.filter((_, i) => i !== index));
    }
  };

  const completionPercentage = () => {
    const fields = [
      form.watch("institutionName"),
      form.watch("country"),
      form.watch("domain"),
      form.watch("registrationNumber"),
      form.watch("contactEmail"),
      form.watch("address"),
      form.watch("description"),
      uploadedDocuments.length > 0,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  if (proposalLoading || verificationStatusLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const isAlreadyVerified = Boolean((verificationStatus as any)?.isVerified) ||
    (verificationStatus as any)?.verificationStatus === "approved";

  if (isAlreadyVerified) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Institution Already Verified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your institution is already approved. Governance verification resubmission is not required.
              </AlertDescription>
            </Alert>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge className="bg-green-100 text-green-800">Approved</Badge>
            </div>
            <Button onClick={() => window.location.href = "/institution/governance-workspace"} className="w-full">
              Open Governance Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingProposal) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Proposal Already Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your institution verification proposal has already been submitted and is under review.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Proposal ID:</span>
                <Badge>{existingProposal.proposal_id}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Legitimacy Score:</span>
                <Badge variant={existingProposal.legitimacy_score > 70 ? "default" : "secondary"}>
                  {existingProposal.legitimacy_score}/100
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Recommended Action:</span>
                <Badge>{existingProposal.recommended_action}</Badge>
              </div>
              {existingProposal.risk_flags && existingProposal.risk_flags.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Risk Flags:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {existingProposal.risk_flags.map((flag: string, i: number) => (
                      <Badge key={i} variant="destructive">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button onClick={() => window.location.href = "/institution/governance-workspace"} className="w-full">
              View Governance Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Institution Governance Verification</h1>
        <p className="text-neutral-600 mt-2">
          Submit your institution information for AI analysis and DAO approval
        </p>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion</span>
              <span>{completionPercentage()}%</span>
            </div>
            <Progress value={completionPercentage} />
          </div>
        </CardContent>
      </Card>

      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This form collects all information required for EduCreds governance verification. 
          Quack AI will analyze your submission and generate a proposal for DAO review. 
          Once approved, your Institution Identity NFT (IIN) will be minted, granting you issuance rights.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Core institution details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="institutionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="University of Example" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="institutionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Type *</FormLabel>
                    <FormControl>
                      <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="university">University</option>
                        <option value="college">College</option>
                        <option value="training_center">Training Center</option>
                        <option value="online_platform">Online Platform</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nigeria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Official Domain *</FormLabel>
                      <FormControl>
                        <Input placeholder="example.edu" {...field} />
                      </FormControl>
                      <FormDescription>Your institution's official domain name</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.example.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your institution, its mission, programs offered, and accreditation status..."
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Minimum 50 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Registration & Accreditation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registration & Accreditation
              </CardTitle>
              <CardDescription>Legal and accreditation information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="RC123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accreditationBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accreditation Body</FormLabel>
                      <FormControl>
                        <Input placeholder="NCHE, ABET, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accreditationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accreditation Number</FormLabel>
                      <FormControl>
                        <Input placeholder="ACC123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+234 123 456 7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Address *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="123 Main Street, City, State, Country"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Representative Wallets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Representative Wallets
              </CardTitle>
              <CardDescription>
                Ethereum addresses that will represent your institution in governance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("representativeWallets").map((wallet, index) => (
                <div key={index} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`representativeWallets.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input 
                            placeholder="0x..." 
                            {...field}
                            disabled={index === 0 && user?.walletAddress ? true : false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {index === 0 && user?.walletAddress && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.setValue(`representativeWallets.${index}`, user.walletAddress || "")}
                    >
                      Use My Wallet
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWalletField(index)}
                    disabled={form.watch("representativeWallets").length === 1}
                    aria-label={`Remove wallet ${index + 1}`}
                    title={form.watch("representativeWallets").length === 1 ? "At least one wallet is required" : "Remove this wallet"}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addWalletField}>
                Add Another Wallet
              </Button>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Verification Documents
              </CardTitle>
              <CardDescription>
                Upload legal documents, accreditation certificates, and other verification materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                onUpload={handleFileUpload}
                isUploading={uploadMutation.isPending}
                acceptedFileTypes=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                maxFiles={10}
                maxFileSize={10 * 1024 * 1024}
              />

              {uploadedDocuments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Documents:</p>
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{doc.name}</span>
                          <Badge variant="secondary">{doc.type}</Badge>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Required documents: Registration Certificate, Accreditation Certificate, 
                  Identity Verification (Director/Administrator), and any other relevant legal documents.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploadMutation.isPending}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit for Governance Review
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
