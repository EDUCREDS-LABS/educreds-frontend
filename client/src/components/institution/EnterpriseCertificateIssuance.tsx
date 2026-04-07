import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  ShieldCheck,
  Zap,
  Globe,
  Database,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TemplateSelector } from './TemplateSelector';
import { PDFUploader } from './PDFUploader';
import { BulkCSVUploader } from './BulkCSVUploader';
import { WalletConnectPanel } from './WalletConnectPanel';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';

// Validation schemas
const baseFieldsSchema = z.object({
  recipientWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Valid Ethereum wallet address required').toLowerCase(),
  recipientName: z.string().min(2, 'Name must be at least 2 characters'),
  completionDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), { message: 'Valid completion date required' }),
  certificateType: z.string().min(1, 'Certificate type is required').max(100, 'Certificate type too long'),
});

const pdfIssuanceSchema = baseFieldsSchema.extend({
  pdfFile: z.instanceof(File).refine((file) => file.type === 'application/pdf', 'PDF file required').refine((file) => file.size <= 10 * 1024 * 1024, 'PDF must be under 10MB'),
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

export function EnterpriseCertificateIssuance() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected: isWalletConnected } = useWallet();

  const [activeMethod, setActiveMethod] = useState<'template' | 'pdf' | 'bulk'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: templatesData, isLoading: templatesLoading } = useQuery({ queryKey: ['/templates/specs'], queryFn: () => api.getTemplateSpecs() });
  const { data: subscription } = useQuery({ queryKey: ['/api/subscription/current'], queryFn: () => api.getCurrentSubscription() });
  const { data: certificatesData } = useQuery({ queryKey: ['/api/certificates/institution'], queryFn: () => api.getCertificates() });

  const templates = (templatesData as any)?.templates || [];
  const allCertificates = (certificatesData as any)?.certificates || [];

  const planId = (subscription as any)?.subscription?.planId || 'starter';
  const certificatesUsed = (subscription as any)?.usage?.certificatesThisMonth || 0;
  const planCertificateLimit = planId === 'pro' ? 1000 : planId === 'enterprise' ? -1 : 200;
  
  const stats = {
    totalIssued: allCertificates.length,
    thisMonth: certificatesUsed,
    remaining: planCertificateLimit === -1 ? '∞' : Math.max(0, planCertificateLimit - certificatesUsed),
    successRate: 100,
  };

  const isLimitExceeded = planCertificateLimit !== -1 && certificatesUsed >= planCertificateLimit;

  const pdfForm = useForm<PDFIssuanceFormData>({
    resolver: zodResolver(pdfIssuanceSchema),
    defaultValues: { recipientWallet: '', recipientName: '', completionDate: new Date().toISOString().split('T')[0], certificateType: 'Course Completion', courseName: '', grade: '', description: '' },
  });

  const templateForm = useForm<TemplateIssuanceFormData>({
    resolver: zodResolver(templateIssuanceSchema),
    defaultValues: { recipientWallet: '', recipientName: '', completionDate: new Date().toISOString().split('T')[0], certificateType: 'Course Completion', templateId: '', courseId: '', grade: '', additionalData: {} },
  });

  const pdfIssueMutation = useMutation({
    mutationFn: (data: PDFIssuanceFormData) => {
      const fd = new FormData();
      fd.append('certificateFile', data.pdfFile);
      fd.append('studentWalletAddress', data.recipientWallet);
      fd.append('studentName', data.recipientName);
      fd.append('completionDate', data.completionDate);
      fd.append('certificateType', data.certificateType);
      fd.append('courseName', data.courseName || '');
      fd.append('grade', data.grade || '');
      fd.append('description', data.description || '');
      return api.issueCertificate(fd);
    },
    onSuccess: () => {
      toast({ title: "Issuance successful", description: "Certificate anchored on blockchain." });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      pdfForm.reset();
    },
  });

  const templateIssueMutation = useMutation({
    mutationFn: (data: TemplateIssuanceFormData) => api.issueFromTemplate(data),
    onSuccess: () => {
      toast({ title: "Issuance successful", description: "Template-based credential minted." });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      templateForm.reset();
    },
  });

  const handlePDFSubmit = pdfForm.handleSubmit((data) => {
    if (isLimitExceeded) { toast({ title: "Limit Reached", variant: "destructive" }); return; }
    pdfIssueMutation.mutate(data);
  });

  const handleTemplateSubmit = templateForm.handleSubmit((data) => {
    if (isLimitExceeded) { toast({ title: "Limit Reached", variant: "destructive" }); return; }
    templateIssueMutation.mutate(data);
  });

  return (
    <div className="space-y-12 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Zap className="size-4" />
            High-Velocity Issuance
          </div>
          <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
            Credential <span className="text-primary">Generation</span>.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg font-medium leading-relaxed">
            Mint cryptographic academic achievements. Leverage institutional templates or legacy PDF assets for secure, on-chain distribution.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-12 rounded-xl border-neutral-200 dark:border-neutral-800 font-bold px-6" onClick={() => setLocation('/institution/certificates')}>
            <Eye className="size-4 mr-2" />
            Registry Archive
          </Button>
          <Button className="h-12 rounded-xl font-bold px-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xl" onClick={() => setLocation('/marketplace')}>
            <ShoppingCart className="size-4 mr-2" />
            Get Templates
          </Button>
        </div>
      </div>

      <WalletConnectPanel />

      {/* Stats Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Lifetime Issued", value: stats.totalIssued, icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Active Period", value: stats.thisMonth, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Success Audit", value: `${stats.successRate}%`, icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Node Capacity", value: stats.remaining, icon: Database, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] group overflow-hidden transition-all hover:shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{s.label}</p>
                <div className={cn("size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", s.bg, s.color)}>
                  <s.icon className="size-5" />
                </div>
              </div>
              <p className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLimitExceeded && (
        <Alert variant="destructive" className="rounded-3xl p-6 shadow-xl shadow-red-500/10 border-red-200 dark:border-red-900/50">
          <AlertCircle className="size-5" />
          <AlertTitle className="font-black text-lg">Capacity Limit Reached</AlertTitle>
          <AlertDescription className="font-medium opacity-80">Infrastructure nodes on your current plan have reached the maximum issuance threshold. Upgrade your protocol for unlimited capacity.</AlertDescription>
        </Alert>
      )}

      {/* Main Workflow Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight dark:text-neutral-100">Issuance Protocol</CardTitle>
                <CardDescription className="font-medium">Configure achievement parameters for decentralized verification.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <Tabs value={activeMethod} onValueChange={(v: any) => setActiveMethod(v)} className="space-y-10">
                <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl h-16 w-full gap-2">
                  {[
                    { id: 'template', label: 'Template Workflow', icon: LayoutTemplate },
                    { id: 'pdf', label: 'PDF Asset', icon: FileUp },
                    { id: 'bulk', label: 'Bulk Cluster', icon: Users },
                  ].map(m => (
                    <TabsTrigger 
                      key={m.id} 
                      value={m.id} 
                      className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest h-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-primary data-[state=active]:shadow-lg gap-2"
                    >
                      <m.icon className="size-4" />
                      <span className="hidden sm:inline">{m.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="template" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <TemplateSelector
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={setSelectedTemplate}
                    form={templateForm}
                    onSubmit={handleTemplateSubmit}
                    isLoading={templateIssueMutation.isPending}
                    isLimitExceeded={isLimitExceeded || !isWalletConnected}
                  />
                </TabsContent>

                <TabsContent value="pdf" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <PDFUploader
                    form={pdfForm}
                    onSubmit={handlePDFSubmit}
                    isLoading={pdfIssueMutation.isPending}
                    isLimitExceeded={isLimitExceeded || !isWalletConnected}
                    uploadProgress={uploadProgress}
                    setUploadProgress={setUploadProgress}
                  />
                </TabsContent>

                <TabsContent value="bulk" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <BulkCSVUploader
                    templates={templates}
                    isLimitExceeded={isLimitExceeded || !isWalletConnected}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl shadow-neutral-200/20 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] p-2">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">
                <Info className="size-3" /> Integrity Check
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">Compliance Audit</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium leading-relaxed">Ensure all issuance data matches official institutional records for successful on-chain anchoring.</p>
              <div className="space-y-4">
                {[
                  { label: "Valid Recipient Wallet", status: "Required" },
                  { label: "Institutional Signature", status: "Active" },
                  { label: "Metadata Consistency", status: "Verified" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">{item.label}</span>
                    <span className="text-[9px] font-black uppercase text-primary tracking-widest">{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="p-8 bg-neutral-900 dark:bg-black rounded-[40px] shadow-2xl text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Globe className="size-24 rotate-12" /></div>
            <div className="space-y-4 relative z-10">
              <h4 className="text-2xl font-black tracking-tight leading-tight">Global Interoperability.</h4>
              <p className="text-neutral-400 text-sm font-medium leading-relaxed">Issued credentials follow the W3C Verifiable Credentials standard, ensuring they are recognized by all compliant wallets and systems.</p>
            </div>
            <Button variant="outline" className="w-full h-12 rounded-xl border-neutral-700 hover:bg-neutral-800 font-black text-[10px] uppercase tracking-widest relative z-10">View Technical Specs</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
