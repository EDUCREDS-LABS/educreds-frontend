/**
 * Credential Design — /institution/credential-design
 * Configure certificate PDF templates: browse templates, upload custom layouts,
 * configure field mappings, and preview with sample data.
 * 
 * This is SEPARATE from White Label (verification card branding) and
 * SEPARATE from Shareable Badges (blockchain/NFT representations).
 */
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Upload, Eye, Check, LayoutTemplate, Palette, Settings,
  ChevronRight, Download, Image as ImageIcon, X, AlertCircle, Save,
  RotateCcw, Shield, Award, Calendar, User, QrCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import type { CredentialBranding } from "@/components/institution/BadgeCustomizationPanel";

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'training' | 'corporate' | 'workshop' | 'custom';
  thumbnail?: string;
  isDefault?: boolean;
  isCustom?: boolean;
}

const SAMPLE_DATA = {
  studentName: "John Doe",
  credentialTitle: "Bachelor of Science in Computer Science",
  institutionName: "Sample University",
  issueDate: "November 11, 2025",
  credentialId: "EDU-2025-001234",
  program: "Computer Science",
  grade: "First Class Honours",
  duration: "4 years",
};

const BUILTIN_TEMPLATES: CertificateTemplate[] = [
  {
    id: "classic",
    name: "Classic Academic",
    description: "Formal academic style with ornamental border. Best for university degrees and diplomas.",
    category: "academic",
    isDefault: true,
  },
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean, minimal design with clear typography. Best for professional and technical credentials.",
    category: "training",
    isDefault: false,
  },
  {
    id: "compact",
    name: "Compact Badge",
    description: "Card-style layout with badge. Best for short courses, workshops, and micro-credentials.",
    category: "workshop",
    isDefault: false,
  },
];

export default function CredentialDesignPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("classic");
  const [activeTab, setActiveTab] = useState<string>("templates");
  const [customPdfFile, setCustomPdfFile] = useState<File | null>(null);
  const [customPdfPreview, setCustomPdfPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: branding, isLoading } = useQuery<CredentialBranding>({
    queryKey: ["institution-branding"],
    queryFn: async () => {
      const res = await fetch(`${API_CONFIG.CERT}/api/institutions/me/branding`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 120_000,
  });

  useEffect(() => {
    if (branding?.pdfLayout) {
      setSelectedTemplate(branding.pdfLayout);
    }
  }, [branding]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`${API_CONFIG.CERT}/api/institutions/me/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ pdfLayout: templateId }),
      });
      if (!res.ok) throw new Error("Failed to save template selection");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Template saved", description: "Your default certificate template has been updated." });
      qc.invalidateQueries({ queryKey: ["institution-branding"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleCustomPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "PDF must be under 10MB.", variant: "destructive" });
      return;
    }
    setCustomPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => setCustomPdfPreview(reader.result as string);
    reader.readAsDataURL(file);
    toast({ title: "PDF uploaded", description: "Custom template uploaded successfully." });
  };

  function TemplatePreviewCard({ template, isSelected }: { template: CertificateTemplate; isSelected: boolean }) {
    const renderPreview = () => {
      switch (template.id) {
        case 'classic':
          return (
            <div className="relative w-full aspect-[1.4] bg-amber-50 rounded-lg border-2 border-amber-200 overflow-hidden">
              <div className="absolute inset-2 border border-amber-300/50 rounded-md" />
              <div className="absolute inset-3 border border-amber-400/30 rounded-sm" />
              <div className="absolute top-6 left-0 right-0 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mb-1">
                  <Shield className="w-5 h-5 text-amber-700" />
                </div>
                <div className="text-[7px] font-bold text-amber-800 uppercase tracking-wider">Certificate</div>
              </div>
              <div className="absolute top-20 left-4 right-4 space-y-2">
                <div className="h-2 bg-amber-200/50 rounded w-3/4 mx-auto" />
                <div className="h-1.5 bg-amber-200/30 rounded w-1/2 mx-auto" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                <div className="text-center">
                  <div className="w-12 h-0.5 bg-amber-400/40 mb-1" />
                  <div className="text-[5px] text-amber-700/70">Registrar</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-0.5 bg-amber-400/40 mb-1" />
                  <div className="text-[5px] text-amber-700/70">Date</div>
                </div>
              </div>
            </div>
          );
        case 'modern':
          return (
            <div className="relative w-full aspect-[1.4] bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-6 bg-slate-900 flex items-center px-2">
                <span className="text-[6px] font-semibold text-white">Institution</span>
              </div>
              <div className="absolute top-10 left-3 right-3">
                <div className="text-[7px] font-bold text-slate-900 uppercase tracking-wide mb-2">Credential</div>
                <div className="space-y-1">
                  <div className="h-1.5 bg-slate-200 rounded w-16" />
                  <div className="h-1.5 bg-slate-200 rounded w-10" />
                </div>
                <div className="mt-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[5px] font-medium text-emerald-700">Verified</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            </div>
          );
        case 'compact':
          return (
            <div className="relative w-full aspect-[1.4] bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              <div className="absolute inset-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="absolute top-6 left-2 right-2 text-center">
                  <div className="text-[6px] font-bold text-slate-900">Credential</div>
                  <div className="text-[5px] text-slate-500 mt-0.5">Student</div>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <div className="bg-slate-50 rounded px-1 py-0.5">
                      <div className="text-[4px] text-slate-400 uppercase">Date</div>
                      <div className="text-[5px] font-medium text-slate-700">2025</div>
                    </div>
                    <div className="bg-slate-50 rounded px-1 py-0.5">
                      <div className="text-[4px] text-slate-400 uppercase">Type</div>
                      <div className="text-[5px] font-medium text-slate-700">Course</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        default:
          return (
            <div className="relative w-full aspect-[1.4] bg-neutral-100 rounded-lg border border-neutral-200 overflow-hidden flex items-center justify-center">
              <FileText className="w-10 h-10 text-neutral-400" />
            </div>
          );
      }
    };

    return (
      <Card
        className={`cursor-pointer transition-all ${
          isSelected ? 'border-primary ring-2 ring-primary shadow-lg' : 'hover:border-primary/50 hover:shadow-md'
        }`}
        onClick={() => setSelectedTemplate(template.id)}
      >
        <CardContent className="p-4 space-y-3">
          {renderPreview()}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="size-4 text-primary" />
              <h4 className="font-semibold text-sm">{template.name}</h4>
            </div>
            {isSelected && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none">
                Selected
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
            {template.isDefault && <Badge className="text-[10px] bg-primary/10 text-primary">Default</Badge>}
          </div>
        </CardContent>
      </Card>
    );
  }

  function CertificatePreview() {
    if (selectedTemplate === 'classic') {
      return (
        <div className="p-6 bg-amber-50 rounded-lg border-2 border-amber-200 relative" style={{ aspectRatio: '1.4' }}>
          <div className="absolute inset-4 border border-amber-300/50 rounded-md" />
          <div className="absolute inset-6 border border-amber-400/30 rounded-sm" />
          <div className="text-center pt-4">
            <Shield className="w-8 h-8 text-amber-700 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-amber-800 uppercase tracking-wider">Certificate of Achievement</h2>
          </div>
          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-amber-700">This is to certify that</p>
            <p className="text-xl font-bold text-amber-900">{SAMPLE_DATA.studentName}</p>
            <p className="text-sm text-amber-700">has successfully completed</p>
            <p className="text-lg font-bold text-amber-900">{SAMPLE_DATA.credentialTitle}</p>
            <p className="text-sm text-amber-700">issued by</p>
            <p className="text-base font-semibold text-amber-800">{SAMPLE_DATA.institutionName}</p>
            <p className="text-sm text-amber-700">on {SAMPLE_DATA.issueDate}</p>
          </div>
          <div className="absolute bottom-8 left-8 right-8 flex justify-between">
            <div className="text-center">
              <div className="w-20 h-0.5 bg-amber-400 mb-1" />
              <p className="text-xs text-amber-700">Registrar</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-0.5 bg-amber-400 mb-1" />
              <p className="text-xs text-amber-700">Date</p>
            </div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-xs text-amber-600 font-mono">ID: {SAMPLE_DATA.credentialId}</p>
          </div>
        </div>
      );
    }

    if (selectedTemplate === 'modern') {
      return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm relative" style={{ aspectRatio: '1.4' }}>
          <div className="h-10 bg-slate-900 flex items-center px-4">
            <Award className="w-5 h-5 text-white mr-2" />
            <span className="text-sm font-semibold text-white">{SAMPLE_DATA.institutionName}</span>
          </div>
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-4">{SAMPLE_DATA.credentialTitle}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{SAMPLE_DATA.studentName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{SAMPLE_DATA.issueDate}</span>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Verified on EduCreds</span>
            </div>
            <div className="absolute bottom-4 right-4">
              <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
                <QrCode className="w-8 h-8 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900" />
          <div className="absolute bottom-4 left-4">
            <p className="text-xs text-slate-400 font-mono">ID: {SAMPLE_DATA.credentialId}</p>
          </div>
        </div>
      );
    }

    if (selectedTemplate === 'compact') {
      return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-4 relative" style={{ aspectRatio: '1.4' }}>
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 h-full">
            <div className="flex justify-center -mt-2">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-center mt-2">
              <h3 className="text-base font-bold text-slate-900">{SAMPLE_DATA.credentialTitle}</h3>
              <p className="text-sm text-slate-500 mt-1">Issued to {SAMPLE_DATA.studentName}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-400 uppercase">Date</div>
                  <div className="text-sm font-medium text-slate-700">{SAMPLE_DATA.issueDate}</div>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-400 uppercase">ID</div>
                  <div className="text-xs font-medium text-slate-700">{SAMPLE_DATA.credentialId}</div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-xs text-primary font-medium">educreds.io/verify</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-[24px]" />
        <Skeleton className="h-48 rounded-[24px]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="size-4 text-primary" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Institution</p>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Credential Design</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Design how your academic certificates look when downloaded as PDFs.
          </p>
        </div>
        <Button
          className="rounded-xl h-9 gap-2 shrink-0"
          onClick={() => saveTemplateMutation.mutate(selectedTemplate)}
          disabled={saveTemplateMutation.isPending}
        >
          {saveTemplateMutation.isPending ? (
            <RotateCcw className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {saved ? "Saved" : "Save Template"}
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Three Separate Features</p>
          <p className="mt-1">
            <strong>Credential Design</strong> controls PDF certificate appearance (this page). 
            <strong>White Label</strong> customizes verification cards. 
            <strong>Shareable Badges</strong> are blockchain/NFT representations.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Upload</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5" />
                Choose a Template
              </CardTitle>
              <CardDescription>
                Select from EduCreds built-in templates. This controls how your downloadable PDF certificates look.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {BUILTIN_TEMPLATES.map((template) => (
                  <TemplatePreviewCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate === template.id}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Upload Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Custom Template
              </CardTitle>
              <CardDescription>
                Upload your own PDF certificate layout. Field mapping configuration coming soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF Template</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  Upload your institution&apos;s existing certificate PDF. We&apos;ll use it as the base for generating credentials.
                  Maximum file size: 10MB.
                </p>
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleCustomPdfUpload}
                  className="hidden"
                />
                <Button onClick={() => fileRef.current?.click()} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Select PDF File
                </Button>
              </div>

              {customPdfFile && (
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium">{customPdfFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(customPdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomPdfFile(null);
                        setCustomPdfPreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Certificate Preview
              </CardTitle>
              <CardDescription>
                Preview how your certificate will look with sample data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <CertificatePreview />
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing preview with sample data. Actual certificates will use real student and credential information.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Field Mapping Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Field Mapping
          </CardTitle>
          <CardDescription>
            Configure how credential data maps to certificate fields. (Coming in a future update)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Field Mapping Coming Soon</p>
              <p className="mt-1">
                Advanced field mapping will allow you to customize exactly where each piece of credential data 
                appears on your certificate, including font sizes, colors, and positions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
