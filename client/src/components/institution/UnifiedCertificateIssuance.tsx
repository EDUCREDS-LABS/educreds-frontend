import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { FileText, Upload, Users, Download, Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const singleCertSchema = z.object({
  studentName: z.string().min(2, "Name required"),
  studentEmail: z.string().email("Valid email required"),
  studentAddress: z.string().min(42).max(42),
  courseName: z.string().min(2, "Course name required"),
  grade: z.string().min(1, "Grade required"),
  completionDate: z.string().min(1, "Date required"),
  certificateType: z.string().min(1, "Type required"),
  description: z.string().optional(),
});

type SingleCertForm = z.infer<typeof singleCertSchema>;

export default function UnifiedCertificateIssuance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("single");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingIssuances, setPendingIssuances] = useState<any[]>([]);
  const [signingAll, setSigningAll] = useState(false);

  const form = useForm<SingleCertForm>({
    resolver: zodResolver(singleCertSchema),
    defaultValues: {
      studentName: "",
      studentEmail: "",
      studentAddress: "",
      courseName: "",
      grade: "",
      completionDate: "",
      certificateType: "",
      description: "",
    },
  });

  const { data: templatesData } = useQuery({
    queryKey: ["/templates"],
  });

  const templates = (templatesData as any)?.templates || [];

  const issueSingleMutation = useMutation({
    mutationFn: async (data: SingleCertForm) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      return api.issueCertificate(formData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Certificate issued successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkIssueMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.bulkIssueCertificates(formData);
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Bulk Issue Complete", 
        description: `Minted ${data.successful || 0} certificates. ${
          data.pending > 0 ? `${data.pending} pending wallet signature.` : ''
        }` 
      });
      const pending = Array.isArray(data?.results)
        ? data.results
            .filter((item: any) => item?.walletDirectRequired || item?.status === "pending_wallet_signature")
            .map((item: any, index: number) => ({
              id: item?.issuanceRequestId || item?.certificateId || `pending-${index}`,
              recipientName: item?.recipient?.name || "Unknown",
              recipientWallet: item?.recipient?.wallet || "Unknown",
              status: "pending" as const,
              issuanceRequestId: item?.issuanceRequestId,
              transactionData: item?.transactionData,
            }))
        : [];
      setPendingIssuances(pending);
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
      setBulkFile(null);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({ title: "Bulk Issue Failed", description: error.message, variant: "destructive" });
    },
  });

  const signPendingIssuance = useCallback(async (issuance: any) => {
    if (!issuance?.issuanceRequestId || !issuance?.transactionData) {
      return;
    }
    try {
      await api.confirmWalletDirectIssuance({
        issuanceRequestId: issuance.issuanceRequestId,
        transactionData: issuance.transactionData,
        walletDirectRequired: true,
      });
      setPendingIssuances((prev) =>
        prev.map((item) => (item.id === issuance.id ? { ...item, status: "minted" } : item)),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPendingIssuances((prev) =>
        prev.map((item) => (item.id === issuance.id ? { ...item, status: "failed", error: message } : item)),
      );
    }
  }, []);

  const signAllPending = useCallback(async () => {
    if (pendingIssuances.length === 0) return;
    setSigningAll(true);
    for (const issuance of pendingIssuances) {
      if (issuance.status !== "pending") continue;
      await signPendingIssuance(issuance);
    }
    setSigningAll(false);
  }, [pendingIssuances, signPendingIssuance]);

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setBulkFile(file);
    } else {
      toast({ title: "Invalid File", description: "Please upload a CSV file", variant: "destructive" });
    }
  };

  const handleBulkSubmit = () => {
    if (bulkFile) {
      bulkIssueMutation.mutate(bulkFile);
    }
  };

  const onSubmit = (data: SingleCertForm) => {
    issueSingleMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Issue Certificates</h2>
        <p className="text-neutral-600">Choose your preferred method to issue certificates</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Single
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Template
          </TabsTrigger>
        </TabsList>

        {/* Single Certificate */}
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Issue Single Certificate</CardTitle>
              <CardDescription>Create and issue a certificate for one student</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="student@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="studentAddress"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Wallet Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="0x..." {...field} className="font-mono text-sm" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="courseName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Computer Science Degree" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade *</FormLabel>
                          <FormControl>
                            <Input placeholder="A+, Distinction, 85%" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="completionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completion Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="certificateType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="certificate">Certificate</SelectItem>
                              <SelectItem value="diploma">Diploma</SelectItem>
                              <SelectItem value="bachelors">Bachelors</SelectItem>
                              <SelectItem value="masters">Masters</SelectItem>
                              <SelectItem value="phd">PhD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional information..." {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                      Clear
                    </Button>
                    <Button type="submit" disabled={issueSingleMutation.isPending}>
                      {issueSingleMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Issuing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Issue Certificate
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Certificate Issuance</CardTitle>
              <CardDescription>Upload a CSV file to issue multiple certificates at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => window.open('/templates/certificate-template.csv', '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV Template
                  </Button>
                  <p className="text-sm text-neutral-600">
                    Download the template to see required format
                  </p>
                </div>

                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8">
                  <div className="text-center space-y-4">
                    {bulkFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-medium">{bulkFile.name}</span>
                        </div>
                        <p className="text-sm text-neutral-600">
                          File size: {(bulkFile.size / 1024).toFixed(2)} KB
                        </p>
                        {uploadProgress > 0 && (
                          <div className="space-y-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-sm text-neutral-600">{uploadProgress}% uploaded</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-neutral-400 mx-auto" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">Upload CSV File</p>
                          <p className="text-sm text-neutral-600">Drag and drop or click to browse</p>
                        </div>
                      </>
                    )}
                    
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkFileChange}
                      className="hidden"
                      id="bulk-upload"
                    />
                    <label htmlFor="bulk-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                  </div>
                </div>

                {bulkFile && (
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setBulkFile(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkSubmit} disabled={bulkIssueMutation.isPending}>
                      {bulkIssueMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Issue Certificates
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Headers: studentName, studentEmail, studentAddress, courseName, grade, completionDate, certificateType</li>
                  <li>Wallet addresses must be valid Ethereum addresses (42 characters)</li>
                  <li>Dates should be in YYYY-MM-DD format</li>
                  <li>Maximum 100 certificates per upload</li>
                </ul>
              </div>

              {pendingIssuances.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-amber-900">Pending Wallet Signatures</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signAllPending}
                      disabled={signingAll}
                    >
                      {signingAll ? "Signing..." : "Sign All"}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {pendingIssuances.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white border rounded-md p-3"
                      >
                        <div className="text-sm">
                          <div className="font-medium text-neutral-900">{item.recipientName}</div>
                          <div className="text-neutral-600">{item.recipientWallet}</div>
                          {item.error && <div className="text-red-600 mt-1">{item.error}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              item.status === "minted"
                                ? "bg-green-100 text-green-800"
                                : item.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }
                          >
                            {item.status}
                          </Badge>
                          {item.status === "pending" && (
                            <Button size="sm" onClick={() => signPendingIssuance(item)}>
                              Sign
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Based */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Template-Based Issuance</CardTitle>
              <CardDescription>Use pre-designed templates for certificate issuance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template: any) => (
                    <div key={template.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-neutral-900">{template.name}</h4>
                          <p className="text-sm text-neutral-600">{template.type}</p>
                        </div>
                        {template.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-800">Approved</Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 mb-4">
                        Used {template.usageCount || 0} times
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No templates available</h3>
                  <p className="text-neutral-600 mb-4">Create your first template to get started</p>
                  <Button variant="outline">
                    Create Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
