import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Download, Users, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const bulkIssuanceSchema = z.object({
  issuanceType: z.enum(['csv', 'course', 'manual']),
  templateId: z.string().min(1, 'Template is required'),
  variantId: z.string().optional(),
  courseName: z.string().optional(),
  grade: z.string().optional(),
  completionDate: z.string().optional(),
  certificateType: z.string().optional(),
  description: z.string().optional(),
});

type BulkIssuanceForm = z.infer<typeof bulkIssuanceSchema>;

interface StudentData {
  name: string;
  email: string;
  walletAddress: string;
  grade?: string;
  completionDate?: string;
}

interface BulkIssuanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkCertificateIssuance({ open, onOpenChange }: BulkIssuanceModalProps) {
  const [step, setStep] = useState<'setup' | 'preview' | 'processing' | 'complete'>('setup');
  const [csvData, setCsvData] = useState<StudentData[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<StudentData[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch templates and variants
  const { data: templatesData } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: api.getTemplates,
    enabled: !!user,
  });

  const { data: variantsData } = useQuery({
    queryKey: ["/api/institutions", user?.id, "variants"],
    queryFn: () => api.getInstitutionVariants(user!.id),
    enabled: !!user,
  });

  const templates = templatesData?.data || [];
  const variants = variantsData?.data || [];

  const form = useForm<BulkIssuanceForm>({
    resolver: zodResolver(bulkIssuanceSchema),
    defaultValues: {
      issuanceType: 'csv',
      templateId: '',
      variantId: '',
      courseName: '',
      grade: '',
      completionDate: '',
      certificateType: '',
      description: '',
    },
  });

  const watchIssuanceType = form.watch('issuanceType');

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const students: StudentData[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const student: StudentData = {
            name: values[0] || '',
            email: values[1] || '',
            walletAddress: values[2] || '',
            grade: values[3] || '',
            completionDate: values[4] || '',
          };
          students.push(student);
        }
      }
      
      setCsvData(students);
      setSelectedStudents(students);
      toast({
        title: "CSV uploaded successfully",
        description: `${students.length} students found in the file.`,
      });
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const template = `Name,Email,Wallet Address,Grade,Completion Date
John Doe,john@example.com,0x1234...,A+,2024-01-15
Jane Smith,jane@example.com,0x5678...,B+,2024-01-15`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificate_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateStudents = (students: StudentData[]): string[] => {
    const errors: string[] = [];
    
    students.forEach((student, index) => {
      if (!student.name.trim()) {
        errors.push(`Row ${index + 1}: Student name is required`);
      }
      if (!student.email.includes('@')) {
        errors.push(`Row ${index + 1}: Valid email is required`);
      }
      if (!student.walletAddress.startsWith('0x') || student.walletAddress.length !== 42) {
        errors.push(`Row ${index + 1}: Valid wallet address is required`);
      }
    });
    
    return errors;
  };

  const handlePreview = () => {
    const formData = form.getValues();
    
    if (formData.issuanceType === 'csv') {
      const validationErrors = validateStudents(selectedStudents);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        toast({
          title: "Validation errors found",
          description: "Please fix the errors before proceeding.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setErrors([]);
    setStep('preview');
  };

  const bulkIssuanceMutation = useMutation({
    mutationFn: async () => {
      if (!user || !csvFile) throw new Error('Missing user or CSV file');
      setStep('processing');
      setProcessingProgress(0);
      setProcessedCount(0);
      setSuccessCount(0);
      const formValues = form.getValues();
      const result = await api.bulkIssueCertificates({
        institutionId: user.id,
        templateId: formValues.templateId,
        variantId: formValues.variantId,
        file: csvFile,
      });
      setJobId(result.jobId);
    },
    onError: (error: any) => {
      toast({
        title: "Bulk issuance failed",
        description: error.message || "An error occurred during bulk issuance.",
        variant: "destructive",
      });
      setStep('preview');
    },
  });

  const handleStartIssuance = () => {
    bulkIssuanceMutation.mutate();
  };

  // Poll job status
  useEffect(() => {
    if (step !== 'processing' || !jobId) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const status = await api.getBulkStatus(jobId);
        if (cancelled) return;
        setProcessedCount(status.processed);
        setSuccessCount(status.success);
        setProcessingProgress(status.progress);
        if (status.status === 'completed') {
          clearInterval(interval);
          setStep('complete');
        }
      } catch (e) {
        // stop polling on error
        clearInterval(interval);
      }
    }, 1500);
    return () => { cancelled = true; clearInterval(interval); };
  }, [step, jobId]);

  const handleDownloadZip = async () => {
    if (!jobId) return;
    const blob = await api.downloadBulkZip(jobId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates-${jobId}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    form.reset();
    setCsvData([]);
    setSelectedStudents([]);
    setCsvFile(null);
    setJobId(null);
    setErrors([]);
    setStep('setup');
    setProcessingProgress(0);
    setProcessedCount(0);
    setSuccessCount(0);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Certificate Issuance</DialogTitle>
          <DialogDescription>
            Issue certificates to multiple students at once using CSV import, course-based selection, or manual entry.
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-6">
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="issuanceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuance Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select issuance method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="csv">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              CSV/Excel Import
                            </div>
                          </SelectItem>
                          <SelectItem value="course">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Course-Based Issuance
                            </div>
                          </SelectItem>
                          <SelectItem value="manual">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Manual Student List
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificate Template *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template: any) => (
                              <SelectItem key={template.metadata.id} value={template.metadata.id}>
                                {template.metadata.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="variantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Variant</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select variant (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Default Template</SelectItem>
                            {variants.map((variant: any) => (
                              <SelectItem key={variant.id} value={variant.id}>
                                {variant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {watchIssuanceType === 'csv' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">CSV Import</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <div className="text-center space-y-4">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Upload a CSV file with student information
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Choose CSV File
                            </Button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleCSVUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={downloadCSVTemplate}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Template
                        </Button>
                        {csvData.length > 0 && (
                          <Badge variant="secondary">
                            {csvData.length} students loaded
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {watchIssuanceType === 'course' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Course-Based Issuance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="courseName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course/Program Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Computer Science Degree 2024" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="grade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grade Threshold</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., A+, Pass, 70%" 
                                  {...field} 
                                />
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
                              <FormLabel>Completion Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="certificateType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certificate Type</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Course Completion, Degree" 
                            {...field} 
                          />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Optional description..." 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>

            {errors.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">Validation Errors</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>â€¢ {error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handlePreview}
                disabled={selectedStudents.length === 0 && watchIssuanceType !== 'course'}
              >
                Preview & Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Issuance Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Students:</span>
                    <Badge variant="secondary">{selectedStudents.length}</Badge>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border rounded p-3">
                    {selectedStudents.map((student, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <span className="font-medium">{student.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{student.email}</span>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button 
                type="button" 
                onClick={handleStartIssuance}
                disabled={bulkIssuanceMutation.isPending}
              >
                Start Issuance
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Certificates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{processedCount} / {selectedStudents.length}</span>
                  </div>
                  <Progress value={processingProgress} className="w-full" />
                </div>
                
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Issuing certificates... Please wait.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {successCount} certificates issued successfully
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Issuance Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      Successfully issued {successCount} certificates!
                    </h3>
                    <p className="text-green-700">
                      All certificates have been created and are ready for students to mint.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Total Processed:</span>
                      <span className="font-medium">{processedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successful:</span>
                      <span className="font-medium text-green-600">{successCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{processedCount - successCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={handleDownloadZip}>
                <Download className="w-4 h-4 mr-2" />
                Download ZIP
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
