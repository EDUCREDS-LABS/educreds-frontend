import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Plus,
  ShoppingCart,
  Upload,
  Wallet,
  Calendar,
  FileUp,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Validation schemas for issuance forms
 */
const mandatoryFieldsSchema = z.object({
  recipientWallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Valid Ethereum wallet address required')
    .toLowerCase(),
  recipientName: z.string().min(2, 'Name must be at least 2 characters'),
  completionDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: 'Valid completion date required',
  }),
  certificateType: z
    .string()
    .min(1, 'Certificate type is required')
    .max(100, 'Certificate type too long'),
});

const legacyPdfSchema = mandatoryFieldsSchema.extend({
  pdfFile: z
    .instanceof(File)
    .refine((file) => file.type === 'application/pdf', 'PDF file required')
    .refine((file) => file.size <= 10 * 1024 * 1024, 'PDF must be under 10MB'),
  courseName: z.string().optional(),
  grade: z.string().optional(),
  description: z.string().optional(),
});

const templateBasedSchema = mandatoryFieldsSchema.extend({
  templateId: z.string().min(1, 'Select a template'),
  courseId: z.string().optional(),
  grade: z.string().optional(),
  additionalData: z.record(z.string()).optional(),
});

type LegacyPdfFormData = z.infer<typeof legacyPdfSchema>;
type TemplateBasedFormData = z.infer<typeof templateBasedSchema>;

interface IssuanceResponse {
  certificateId: string;
  txHash?: string;
  message: string;
  onChainStatus: 'pending' | 'confirmed' | 'failed';
}

interface Template {
  id: string;
  name: string;
  category: 'created' | 'purchased' | 'uploaded';
  thumbnail?: string;
  previewUrl?: string;
}

interface MarketplaceTemplate extends Template {
  price?: number;
  designer?: string;
  rating?: number;
}

/**
 * QuickIssuance Component
 * 
 * Enterprise-grade single certificate issuance interface supporting:
 * - Legacy PDF upload (static background certificates)
 * - Template-based issuance (with placeholder filling)
 * - Marketplace template integration
 * - Comprehensive validation and error handling
 */
export default function QuickIssuance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeMode, setActiveMode] = useState<'legacy' | 'template'>('template');
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Queries
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['/templates/specs'],
    queryFn: () => api.getTemplateSpecs(),
  });

  const { data: subscription } = useQuery({
    queryKey: ['/api/subscription/current'],
    queryFn: () => api.getCurrentSubscription(),
  });

  const templates = (templatesData as any)?.templates || [];
  const planId = (subscription as any)?.subscription?.planId || 'starter';
  const planCertificateLimit =
    planId === 'pro'
      ? 1000
      : planId === 'enterprise'
      ? -1
      : 200;
  const certificatesUsed = (subscription as any)?.usage?.certificatesThisMonth || 0;
  const certificateLimit = planCertificateLimit === -1 ? certificatesUsed : planCertificateLimit;
  const certificatesRemaining = planCertificateLimit === -1 ? Infinity : Math.max(0, planCertificateLimit - certificatesUsed);
  const usagePercentage =
    planCertificateLimit === -1 ? 0 : (certificatesUsed / Math.max(planCertificateLimit, 1)) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isLimitExceeded = certificatesUsed >= certificateLimit;

  // Forms
  const legacyForm = useForm<LegacyPdfFormData>({
    resolver: zodResolver(legacyPdfSchema),
    defaultValues: {
      recipientWallet: '',
      recipientName: '',
      completionDate: new Date().toISOString().split('T')[0],
      certificateType: 'Course Completion',
      courseName: '',
      grade: '',
      description: '',
    },
  });

  const templateForm = useForm<TemplateBasedFormData>({
    resolver: zodResolver(templateBasedSchema),
    defaultValues: {
      recipientWallet: '',
      recipientName: '',
      completionDate: new Date().toISOString().split('T')[0],
      certificateType: 'Course Completion',
      templateId: '',
      courseId: '',
      grade: '',
      additionalData: {},
    },
  });

  // Mutations
  const legacyIssueMutation = useMutation({
    mutationFn: async (data: LegacyPdfFormData) => {
      const formData = new FormData();
      formData.append('certificateFile', data.pdfFile);
      formData.append('studentWalletAddress', data.recipientWallet);
      formData.append('studentName', data.recipientName);
      formData.append('completionDate', data.completionDate);
      formData.append('certificateType', data.certificateType);
      formData.append('courseName', data.courseName || '');
      formData.append('grade', data.grade || '');

      return api.issueCertificate(formData);
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Certificate issued successfully. Status: ${data.onChainStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      legacyForm.reset();
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue certificate',
        variant: 'destructive',
      });
    },
  });

  const templateIssueMutation = useMutation({
    mutationFn: async (data: TemplateBasedFormData) => {
      return api.issueFromTemplate({
        templateId: data.templateId,
        recipientWallet: data.recipientWallet,
        recipientName: data.recipientName,
        completionDate: data.completionDate,
        certificateType: data.certificateType,
        courseId: data.courseId,
        grade: data.grade,
        additionalData: data.additionalData,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Certificate issued successfully. Status: ${data.onChainStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      templateForm.reset();
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue certificate',
        variant: 'destructive',
      });
    },
  });

  const handleLegacySubmit = legacyForm.handleSubmit((data) => {
    if (isLimitExceeded) {
      toast({
        title: 'Certificate Limit Exceeded',
        description: 'Upgrade your subscription to issue more certificates',
        variant: 'destructive',
      });
      return;
    }
    legacyIssueMutation.mutate(data);
  });

  const handleTemplateSubmit = templateForm.handleSubmit((data) => {
    if (isLimitExceeded) {
      toast({
        title: 'Certificate Limit Exceeded',
        description: 'Upgrade your subscription to issue more certificates',
        variant: 'destructive',
      });
      return;
    }
    templateIssueMutation.mutate(data);
  });

  const handleBulkIssuance = useCallback(() => {
    setLocation('/bulk-issuance');
  }, [setLocation]);

  const handleManageSpecs = useCallback(() => {
    setLocation('/institution/manage-specs');
  }, [setLocation]);

  const handleMarketplaceSelect = useCallback((template: MarketplaceTemplate) => {
    setSelectedTemplate(template);
    templateForm.setValue('templateId', template.id);
    setShowMarketplace(false);
    toast({
      title: 'Template Selected',
      description: `${template.name} selected for issuance`,
    });
  }, [templateForm, toast]);

  const isLoading =
    legacyIssueMutation.isPending ||
    templateIssueMutation.isPending ||
    templatesLoading;

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Issue Certificate</h1>
          <p className="text-neutral-600 mt-2">
            Issue single or bulk certificates with flexible template options
          </p>
        </div>

        {/* Usage Statistics */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Monthly Usage</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {certificatesUsed}{" "}
                    {planCertificateLimit === -1 ? "" : <>/ {planCertificateLimit}</>}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 capitalize">
                    Current plan: {planId}
                  </p>
                </div>
                {planCertificateLimit !== -1 && isNearLimit && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {certificatesRemaining} Remaining
                  </Badge>
                )}
                {planCertificateLimit !== -1 && isLimitExceeded && (
                  <Badge className="bg-red-100 text-red-800">Limit Exceeded</Badge>
                )}
              </div>
              {planCertificateLimit !== -1 && (
                <>
                  <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
                  {isNearLimit && !isLimitExceeded && (
                    <p className="text-xs text-yellow-700">
                      Approaching your monthly limit. Upgrade to continue issuing.
                    </p>
                  )}
                  {isLimitExceeded && (
                    <p className="text-xs text-red-700">
                      You've reached your monthly certificate limit. Upgrade your subscription.
                    </p>
                  )}
                </>
              )}
              {planCertificateLimit === -1 && (
                <p className="text-xs text-emerald-700">
                  Enterprise plan: certificate issuance is effectively unlimited (fair use).
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleBulkIssuance}
            variant="outline"
            className="h-auto p-4 flex-col items-start justify-start space-y-2 hover:bg-blue-50"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-neutral-900">Bulk Issuance</span>
            </div>
            <span className="text-xs text-neutral-600">Issue multiple certificates</span>
          </Button>

          <Button
            onClick={handleManageSpecs}
            variant="outline"
            className="h-auto p-4 flex-col items-start justify-start space-y-2 hover:bg-purple-50"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-neutral-900">Manage Specs</span>
            </div>
            <span className="text-xs text-neutral-600">View all your templates</span>
          </Button>

          <Button
            onClick={() => setShowMarketplace(!showMarketplace)}
            variant="outline"
            className="h-auto p-4 flex-col items-start justify-start space-y-2 hover:bg-green-50"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-neutral-900">Marketplace</span>
            </div>
            <span className="text-xs text-neutral-600">Browse & buy templates</span>
          </Button>
        </div>

        {/* Main Issuance Interface */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Single Certificate Issuance</CardTitle>
            <CardDescription>
              Choose your issuance method: legacy PDF or template-based
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeMode}
              onValueChange={(value) => setActiveMode(value as 'legacy' | 'template')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="template" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Template-Based</span>
                  <span className="sm:hidden">Template</span>
                </TabsTrigger>
                <TabsTrigger value="legacy" className="flex items-center gap-2">
                  <FileUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Legacy PDF</span>
                  <span className="sm:hidden">PDF</span>
                </TabsTrigger>
              </TabsList>

              {/* Template-Based Tab */}
              <TabsContent value="template" className="space-y-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Select a template from your specs or marketplace. Form data will be
                    automatically populated into the template.
                  </AlertDescription>
                </Alert>

                <Form {...templateForm}>
                  <form
                    onSubmit={handleTemplateSubmit}
                    className="space-y-6"
                  >
                    {/* Template Selection */}
                    <FormField
                      control={templateForm.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Select Template
                          </FormLabel>
                          <FormDescription>
                            Choose from your created, purchased, or marketplace templates
                          </FormDescription>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Search and select a template..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {templatesLoading ? (
                                <SelectItem value="loading" disabled>
                                  Loading templates...
                                </SelectItem>
                              ) : templates.length === 0 ? (
                                <SelectItem value="empty" disabled>
                                  No templates found. Browse marketplace.
                                </SelectItem>
                              ) : (
                                templates.map((template: Template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    <div className="flex items-center gap-2">
                                      {template.category === 'created' && (
                                        <Badge variant="outline" className="text-xs">
                                          Created
                                        </Badge>
                                      )}
                                      {template.category === 'purchased' && (
                                        <Badge variant="outline" className="text-xs bg-green-50">
                                          Purchased
                                        </Badge>
                                      )}
                                      {template.category === 'uploaded' && (
                                        <Badge variant="outline" className="text-xs bg-blue-50">
                                          Uploaded
                                        </Badge>
                                      )}
                                      <span>{template.name}</span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mandatory Fields Section */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                        <span className="inline-block w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                          *
                        </span>
                        Mandatory Information
                      </h3>

                      <FormField
                        control={templateForm.control}
                        name="recipientWallet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Recipient Wallet Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                  {...field}
                                  placeholder="0x..."
                                  className="pl-10 h-11 font-mono text-sm"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              Ethereum address where certificate will be issued
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Recipient Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="John Doe"
                                className="h-11"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Full name as it will appear on certificate
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={templateForm.control}
                          name="completionDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Completion Date
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                  <Input
                                    {...field}
                                    type="date"
                                    className="pl-10 h-11"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={templateForm.control}
                          name="certificateType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Certificate Type
                              </FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Course Completion">
                                    Course Completion
                                  </SelectItem>
                                  <SelectItem value="Degree">Degree</SelectItem>
                                  <SelectItem value="Diploma">Diploma</SelectItem>
                                  <SelectItem value="Certification">Certification</SelectItem>
                                  <SelectItem value="Achievement">Achievement</SelectItem>
                                  <SelectItem value="Participation">Participation</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold text-neutral-900">Optional Information</h3>

                      <FormField
                        control={templateForm.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Grade / Score</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="A, 4.0 GPA, 95%, etc."
                                className="h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Course ID</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="COMP101, BIO202, etc."
                                className="h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-6 border-t">
                      <Button
                        type="submit"
                        disabled={isLoading || isLimitExceeded}
                        className="flex-1 h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Issuing Certificate...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Issue Certificate
                          </>
                        )}
                      </Button>
                      <Button type="reset" variant="outline" className="h-11">
                        Clear
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Legacy PDF Tab */}
              <TabsContent value="legacy" className="space-y-6">
                <Alert className="border-amber-200 bg-amber-50">
                  <FileUp className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Upload a PDF certificate template. Student information will be embedded
                    into the PDF before issuance.
                  </AlertDescription>
                </Alert>

                <Form {...legacyForm}>
                  <form
                    onSubmit={handleLegacySubmit}
                    className="space-y-6"
                  >
                    {/* PDF Upload */}
                    <FormField
                      control={legacyForm.control}
                      name="pdfFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            PDF Certificate Template
                          </FormLabel>
                          <FormDescription>
                            Upload your certificate background PDF (max 10MB)
                          </FormDescription>
                          <FormControl>
                            <div className="relative">
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    field.onChange(file);
                                  }
                                }}
                                className="hidden"
                                id="pdf-input"
                              />
                              <label
                                htmlFor="pdf-input"
                                className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                              >
                                <div className="text-center">
                                  <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                  <p className="text-sm font-medium text-neutral-900">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs text-neutral-600 mt-1">
                                    PDF files only, up to 10MB
                                  </p>
                                </div>
                              </label>
                              {field.value && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-green-800">
                                    {field.value.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mandatory Fields */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                        <span className="inline-block w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                          *
                        </span>
                        Mandatory Information
                      </h3>

                      <FormField
                        control={legacyForm.control}
                        name="recipientWallet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Recipient Wallet Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                  {...field}
                                  placeholder="0x..."
                                  className="pl-10 h-11 font-mono text-sm"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              Ethereum address for certificate issuance
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={legacyForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Recipient Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="John Doe"
                                className="h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={legacyForm.control}
                          name="completionDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Completion Date
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                  <Input
                                    {...field}
                                    type="date"
                                    className="pl-10 h-11"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={legacyForm.control}
                          name="certificateType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                Certificate Type
                              </FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Course Completion">
                                    Course Completion
                                  </SelectItem>
                                  <SelectItem value="Degree">Degree</SelectItem>
                                  <SelectItem value="Diploma">Diploma</SelectItem>
                                  <SelectItem value="Certification">Certification</SelectItem>
                                  <SelectItem value="Achievement">Achievement</SelectItem>
                                  <SelectItem value="Participation">Participation</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold text-neutral-900">Optional Information</h3>

                      <FormField
                        control={legacyForm.control}
                        name="courseName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Course Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., Web Development 101"
                                className="h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={legacyForm.control}
                        name="grade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Grade / Score</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="A, 4.0 GPA, 95%, etc."
                                className="h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={legacyForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Additional details about the certificate..."
                                className="min-h-[100px] resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Upload Progress */}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="space-y-2 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-900">
                            Uploading...
                          </span>
                          <span className="text-sm text-neutral-600">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-6 border-t">
                      <Button
                        type="submit"
                        disabled={isLoading || isLimitExceeded}
                        className="flex-1 h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Issuing Certificate...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Issue Certificate
                          </>
                        )}
                      </Button>
                      <Button type="reset" variant="outline" className="h-11">
                        Clear
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-2">Template-Based Benefits</h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Auto-fill placeholders with student data</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Consistent branding across certificates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Reuse across multiple issuances</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-neutral-900 mb-2">Legacy PDF Benefits</h3>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Upload your existing certificate designs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Maintain complete design control</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Instant blockchain verification</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}
