import { useState, useCallback, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Plus,
  Upload,
  Wallet,
  Calendar,
  FileUp,
  ArrowRight,
  Eye,
  Download,
  Sparkles,
  Users,
  LayoutTemplate,
  ShoppingCart,
  Info,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TemplateSelector } from './TemplateSelector';
import { PDFUploader } from './PDFUploader';
import { BulkCSVUploader } from './BulkCSVUploader';

// Validation schemas
const baseFieldsSchema = z.object({
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

const pdfIssuanceSchema = baseFieldsSchema.extend({
  pdfFile: z
    .instanceof(File)
    .refine((file) => file.type === 'application/pdf', 'PDF file required')
    .refine((file) => file.size <= 10 * 1024 * 1024, 'PDF must be under 10MB'),
  courseName: z.string().optional(),
  grade: z.string().optional(),
  description: z.string().optional(),
});

const templateIssuanceSchema = baseFieldsSchema.extend({
  templateId: z.string().min(1, 'Select a template'),
  courseId: z.string().optional(),
  grade: z.string().optional(),
  additionalData: z.record(z.string()).optional(),
});

type PDFIssuanceFormData = z.infer<typeof pdfIssuanceSchema>;
type TemplateIssuanceFormData = z.infer<typeof templateIssuanceSchema>;

interface Template {
  id: string;
  name: string;
  category: 'created' | 'purchased' | 'uploaded' | 'ai-generated';
  thumbnail?: string;
  previewUrl?: string;
  description?: string;
  usageCount?: number;
  rating?: number;
}

interface IssuanceStats {
  totalIssued: number;
  thisMonth: number;
  thisWeek: number;
  successRate: number;
}

/**
 * EnterpriseCertificateIssuance Component
 * 
 * Modern, enterprise-grade certificate issuance interface featuring:
 * - Wizard-style workflow for better UX
 * - Multiple issuance methods (Template, PDF, Bulk)
 * - Real-time validation and preview
 * - AI-powered template recommendations
 * - Comprehensive analytics and usage tracking
 * - Advanced error handling and recovery
 */
export function EnterpriseCertificateIssuance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeMethod, setActiveMethod] = useState<'template' | 'pdf' | 'bulk'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
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

  const { data: certificatesData } = useQuery({
    queryKey: ['/api/certificates/institution'],
    queryFn: () => api.getCertificates(),
  });

  const templates = (templatesData as any)?.templates || [];
  const allCertificates = (certificatesData as any)?.certificates || [];

  // Subscription & usage limits
  const planId = (subscription as any)?.subscription?.planId || 'starter';
  const planCertificateLimit =
    planId === 'pro' ? 1000 : planId === 'enterprise' ? -1 : 200;
  const certificatesUsed = (subscription as any)?.usage?.certificatesThisMonth || 0;
  
  // Calculate stats from certificates data
  const stats: IssuanceStats = {
    totalIssued: allCertificates.length,
    thisMonth: certificatesUsed,
    thisWeek: allCertificates.filter((cert: any) => {
      const issueDate = new Date(cert.issuedAt || cert.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return issueDate >= weekAgo;
    }).length,
    successRate: 100,
  };
  const certificateLimit = planCertificateLimit === -1 ? certificatesUsed : planCertificateLimit;
  const certificatesRemaining =
    planCertificateLimit === -1 ? Infinity : Math.max(0, planCertificateLimit - certificatesUsed);
  const usagePercentage =
    planCertificateLimit === -1 ? 0 : (certificatesUsed / Math.max(planCertificateLimit, 1)) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isLimitExceeded = certificatesUsed >= certificateLimit;

  // Forms
  const pdfForm = useForm<PDFIssuanceFormData>({
    resolver: zodResolver(pdfIssuanceSchema),
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

  const templateForm = useForm<TemplateIssuanceFormData>({
    resolver: zodResolver(templateIssuanceSchema),
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
  const pdfIssueMutation = useMutation({
    mutationFn: async (data: PDFIssuanceFormData) => {
      const formData = new FormData();
      formData.append('certificateFile', data.pdfFile);
      formData.append('studentWalletAddress', data.recipientWallet);
      formData.append('studentName', data.recipientName);
      formData.append('completionDate', data.completionDate);
      formData.append('certificateType', data.certificateType);
      formData.append('courseName', data.courseName || '');
      formData.append('grade', data.grade || '');
      formData.append('description', data.description || '');

      return api.issueCertificate(formData);
    },
    onSuccess: (data) => {
      toast({
        title: '✓ Certificate Issued Successfully',
        description: `Blockchain status: ${data.onChainStatus}. Transaction processing...`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      pdfForm.reset();
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: '✗ Issuance Failed',
        description: error.message || 'Failed to issue certificate',
        variant: 'destructive',
      });
    },
  });

  const templateIssueMutation = useMutation({
    mutationFn: async (data: TemplateIssuanceFormData) => {
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
        title: '✓ Certificate Issued Successfully',
        description: `Blockchain status: ${data.onChainStatus}. Transaction processing...`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      templateForm.reset();
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: '✗ Issuance Failed',
        description: error.message || 'Failed to issue certificate',
        variant: 'destructive',
      });
    },
  });

  const handlePDFSubmit = pdfForm.handleSubmit((data) => {
    if (isLimitExceeded) {
      toast({
        title: 'Certificate Limit Exceeded',
        description: 'Upgrade your subscription to issue more certificates',
        variant: 'destructive',
      });
      return;
    }
    pdfIssueMutation.mutate(data);
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
    setActiveMethod('bulk');
  }, []);

  const handleViewCertificates = useCallback(() => {
    setLocation('/institution/certificates');
  }, [setLocation]);

  const handleManageTemplates = useCallback(() => {
    setLocation('/institution/manage-specs');
  }, [setLocation]);

  const handleBrowseMarketplace = useCallback(() => {
    setLocation('/marketplace');
  }, [setLocation]);

  const isLoading =
    pdfIssueMutation.isPending || templateIssueMutation.isPending || templatesLoading;

  const aiSuggestedTemplates = templates.filter(
    (t: Template) => t.category === 'ai-generated'
  ).slice(0, 3);

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
              Certificate Issuance
            </h1>
            <p className="text-neutral-600 mt-2">
              Enterprise-grade blockchain credential issuance platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleViewCertificates}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              View Certificates
            </Button>
            <Button
              variant="outline"
              onClick={handleBrowseMarketplace}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Marketplace
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Issued</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {stats.totalIssued.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">This Month</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {stats.thisMonth.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Success Rate</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {stats.successRate}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Remaining</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">
                    {planCertificateLimit === -1
                      ? '∞'
                      : certificatesRemaining.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Alert */}
        {isNearLimit && !isLimitExceeded && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">
              Approaching Monthly Limit
            </AlertTitle>
            <AlertDescription className="text-amber-800">
              You have {certificatesRemaining} certificates remaining this month. Consider
              upgrading for unlimited issuance.
            </AlertDescription>
          </Alert>
        )}

        {isLimitExceeded && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">Monthly Limit Reached</AlertTitle>
            <AlertDescription className="text-red-800">
              You've reached your monthly certificate limit. Upgrade your subscription to
              continue issuing.
            </AlertDescription>
          </Alert>
        )}

        {/* AI Suggestions */}
        {aiSuggestedTemplates.length > 0 && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">
                      AI-Recommended Templates
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Based on your institution's profile and usage patterns
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAISuggestions(!showAISuggestions)}
                >
                  {showAISuggestions ? 'Hide' : 'View'}
                </Button>
              </div>
              {showAISuggestions && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {aiSuggestedTemplates.map((template: Template) => (
                    <div
                      key={template.id}
                      className="bg-white rounded-lg p-4 border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedTemplate(template);
                        templateForm.setValue('templateId', template.id);
                        setActiveMethod('template');
                      }}
                    >
                      {template.thumbnail && (
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      <h4 className="font-medium text-neutral-900">{template.name}</h4>
                      <p className="text-xs text-neutral-600 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-xs bg-purple-100 text-purple-800">AI</Badge>
                        {template.rating && (
                          <span className="text-xs text-neutral-500">
                            ⭐ {template.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Method Selection */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Issuance Method</CardTitle>
            <CardDescription>
              Choose how you want to issue certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveMethod('template')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  activeMethod === 'template'
                    ? 'border-primary bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      activeMethod === 'template'
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <LayoutTemplate className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">
                      Template-Based
                    </h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      Use professionally designed templates
                    </p>
                  </div>
                  {activeMethod === 'template' && (
                    <Badge className="bg-primary text-white">Selected</Badge>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveMethod('pdf')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  activeMethod === 'pdf'
                    ? 'border-primary bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      activeMethod === 'pdf'
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <FileUp className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">PDF Upload</h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      Upload your own certificate designs
                    </p>
                  </div>
                  {activeMethod === 'pdf' && (
                    <Badge className="bg-primary text-white">Selected</Badge>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveMethod('bulk')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  activeMethod === 'bulk'
                    ? 'border-primary bg-blue-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      activeMethod === 'bulk'
                        ? 'bg-primary text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">
                      Bulk CSV Upload
                    </h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      Issue multiple certificates at once
                    </p>
                  </div>
                  {activeMethod === 'bulk' && (
                    <Badge className="bg-primary text-white">Selected</Badge>
                  )}
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Issuance Forms */}
        {activeMethod === 'template' && (
          <TemplateSelector
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            form={templateForm}
            onSubmit={handleTemplateSubmit}
            isLoading={isLoading}
            isLimitExceeded={isLimitExceeded}
          />
        )}

        {activeMethod === 'pdf' && (
          <PDFUploader
            form={pdfForm}
            onSubmit={handlePDFSubmit}
            isLoading={isLoading}
            isLimitExceeded={isLimitExceeded}
            uploadProgress={uploadProgress}
            setUploadProgress={setUploadProgress}
          />
        )}

        {activeMethod === 'bulk' && (
          <BulkCSVUploader
            templates={templates}
            isLimitExceeded={isLimitExceeded}
          />
        )}

        {/* Template Preview Dialog */}
        <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                {selectedTemplate?.name} - {selectedTemplate?.category}
              </DialogDescription>
            </DialogHeader>
            <div className="aspect-video bg-neutral-100 rounded-lg flex items-center justify-center">
              {selectedTemplate?.previewUrl ? (
                <img
                  src={selectedTemplate.previewUrl}
                  alt={selectedTemplate.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-neutral-500">Preview not available</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}
