
import React, { Suspense, useState } from 'react';
import { ErrorBoundary } from '@/components/modern/ErrorBoundary';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Building,
  Shield,
  Loader2,
  ArrowRight,
  Info,
  ShieldCheck,
  Cpu,
  Lock,
  Landmark,
  Database,
  Trash2,
  Mail,
  MapPin,
  Phone,
  Globe,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

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
  description: z.string().min(50, "Description must be at least 50 characters"),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

const GovernanceVerification: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ type: string; url: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDocType, setPendingDocType] = useState<string>('registration_certificate');

  const REQUIRED_DOC_TYPES = ['registration_certificate', 'accreditation_letter', 'domain_proof'];
  const uploadedTypes = uploadedDocuments.map(d => d.type);
  const requiredDocsMet = REQUIRED_DOC_TYPES.every(t => uploadedTypes.includes(t));

  const DOC_TYPE_LABELS: Record<string, string> = {
    registration_certificate: 'Certificate of Registration / Incorporation',
    accreditation_letter: 'Academic Accreditation Letter',
    domain_proof: 'Institutional Email Domain Proof',
    audit_report: 'Audit Report (last 2 years)',
    government_recognition: 'Government Recognition Letter',
    quality_assurance: 'Quality Assurance Certificate',
    governance_charter: 'Board/Governance Charter',
    partnership_letters: 'Partnership Letters',
    enrollment_statistics: 'Student Enrollment Statistics',
    other: 'Other Supporting Document',
  };

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      institutionName: user?.name || "",
      institutionType: "university",
      country: "",
      domain: "",
      website: "",
      registrationNumber: "",
      accreditationBody: "",
      accreditationNumber: "",
      contactEmail: user?.email || "",
      contactPhone: "",
      address: "",
      description: "",
    },
  });

  const { data: existingProposal, isLoading: proposalLoading } = useQuery({
    queryKey: ["/governance/proposals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      try {
        const proposals = await api.governance.getAllProposals();
        return proposals.find((p: any) => p.institutionId === user?.id && ["PENDING", "ACTIVE"].includes(p.state));
      } catch { return null; }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.uploadVerificationDocuments(formData),
    onSuccess: (data) => {
      const documents = data.documents || [];
      setUploadedDocuments(prev => [...prev, ...documents.map((d: any) => ({ type: d.type, url: d.url, name: d.originalName || d.name }))]);
      toast({ title: "Assets secured", description: "Verification materials uploaded." });
    },
  });

  const submitProposalMutation = useMutation({
    mutationFn: (data: VerificationFormData) => api.governance.createProposal({
      ...data,
      institution_name: data.institutionName,
      institution_type: data.institutionType,
      registration_number: data.registrationNumber,
      accreditation_body: data.accreditationBody,
      accreditation_number: data.accreditationNumber,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      institution_documents: uploadedDocuments.map(d => d.url),
      wallet_address: user?.walletAddress,
      institutionId: user?.id,
    }),
    onSuccess: () => {
      toast({ title: "Node Request Initiated", description: "Proposal submitted for consensus review." });
      queryClient.invalidateQueries({ queryKey: ["/governance/proposals"] });
      form.reset();
      setUploadedDocuments([]);
    },
  });

  const onSubmit = async (data: VerificationFormData) => {
    if (uploadedDocuments.length === 0) {
      toast({ title: "Missing Assets", description: "Upload verification documents to continue.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitProposalMutation.mutateAsync(data);
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message || "Protocol rejection. Check network status.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionValue = () => {
    const watchedFields = [
      form.watch("institutionName"),
      form.watch("country"),
      form.watch("domain"),
      form.watch("registrationNumber"),
      form.watch("contactEmail"),
      form.watch("address"),
      form.watch("description"),
      uploadedDocuments.length > 0,
    ];
    return Math.round((watchedFields.filter(Boolean).length / watchedFields.length) * 100);
  };

  if (proposalLoading) {
    return <div className="max-w-4xl mx-auto py-12"><Skeleton className="h-[600px] rounded-[40px]" /></div>;
  }

  if (existingProposal) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-10">
        <div className="text-center space-y-4">
          <div className="size-20 bg-blue-50 dark:bg-blue-950/30 rounded-[32px] flex items-center justify-center text-primary mx-auto shadow-xl shadow-primary/10">
            <ShieldCheck className="size-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Active Protocol Review.</h1>
          <p className="text-neutral-500 text-lg font-medium">Your institutional verification proposal is currently undergoing decentralized consensus audit.</p>
        </div>

        <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden">
          <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black">Node Status Registry</CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-[0.2em] text-primary">Consensus Review</CardDescription>
              </div>
              <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase">Reviewing</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Proposal ID</p>
                <p className="font-mono text-xs font-bold text-neutral-600 truncate">{existingProposal.proposal_id || "ID-UNASSIGNED"}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Legitimacy Score</p>
                <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{existingProposal.legitimacy_score || 0}%</p>
              </div>
            </div>
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-[32px] border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="size-10 bg-white dark:bg-neutral-900 rounded-xl flex items-center justify-center shadow-sm">
                  <Database className="size-5 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Recommended Network Action</p>
                  <p className="text-xs text-neutral-500 font-medium">{existingProposal.recommended_action || "Pending AI Analysis..."}</p>
                </div>
              </div>
            </div>
            <Button className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-neutral-900 dark:bg-neutral-900 text-white dark:text-white" onClick={() => window.location.href = "/compliance/enterprise-overview"}>
              Return to Overview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-16">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
            <Landmark className="size-4" />
            Strategic Enrollment
          </div>
          <h1 className="text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter leading-none">
            Institutional <span className="text-primary">Onboarding</span>.
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg font-medium leading-relaxed">
            Register your institution on EduCreds. Submit your institutional details and supporting documents. Once verified, your institution will receive its EduCreds trust certification and can begin issuing credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-10">
          <Form {...form}>
            <form onSubmit={(e) => {
              form.handleSubmit(onSubmit)(e);
              const errors = form.formState.errors;
              if (Object.keys(errors).length > 0) {
                toast({ title: "Validation Error", description: "Please check the form for missing or invalid fields.", variant: "destructive" });
              }
            }} className="space-y-12">
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">01</div>
                  <h3 className="text-2xl font-black tracking-tight dark:text-neutral-100">Core Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="institutionName" render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Legal Entity Name</FormLabel>
                      <FormControl><Input placeholder="University of Excellence" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="institutionType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Classification</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-14 w-full rounded-2xl border-none bg-neutral-50 dark:bg-neutral-900 px-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="university">Research University</option>
                          <option value="college">Technical College</option>
                          <option value="training_center">Vocational Center</option>
                          <option value="online_platform">LMS Provider</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Primary Jurisdiction</FormLabel>
                      <FormControl><Input placeholder="Nigeria" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">02</div>
                  <h3 className="text-2xl font-black tracking-tight dark:text-neutral-100">Digital Presence</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="domain" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Institutional Domain</FormLabel>
                      <FormControl><Input placeholder="excellence.edu.ng" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Official Website (Optional)</FormLabel>
                      <FormControl><Input placeholder="https://excellence.edu.ng" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">03</div>
                  <h3 className="text-2xl font-black tracking-tight dark:text-neutral-100">Contact & Logistics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="contactEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Verification Email</FormLabel>
                      <FormControl><Input placeholder="admin@excellence.edu.ng" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Contact Phone (Optional)</FormLabel>
                      <FormControl><Input placeholder="+234 800 123 4567" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Physical Head Office Address</FormLabel>
                      <FormControl><Input placeholder="123 Excellence Way, Victoria Island, Lagos" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">04</div>
                  <h3 className="text-2xl font-black tracking-tight dark:text-neutral-100">Accreditation & Authority</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Registration ID</FormLabel>
                      <FormControl><Input placeholder="RC-9922881" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="accreditationBody" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Accreditation Body</FormLabel>
                      <FormControl><Input placeholder="Ministry of Education" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="accreditationNumber" render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Accreditation ID (Optional)</FormLabel>
                      <FormControl><Input placeholder="ACC-123456" className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">05</div>
                  <h3 className="text-2xl font-black tracking-tight dark:text-neutral-100">Operational Summary</h3>
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Institutional Mission</FormLabel>
                    <FormControl><Textarea rows={5} placeholder="Describe your institutional mission and accreditation status..." className="rounded-[24px] bg-neutral-50 dark:bg-neutral-900 border-none shadow-inner p-6 resize-none" {...field} /></FormControl>
                    <FormDescription className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-2">Minimum 50 characters for AI analysis</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">06</div>
                  <h3 className="text-2xl font-black tracking-tight dark:text-neutral-100">Required Verification Documents</h3>
                </div>

                {/* Document requirements card */}
                <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800 space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3">Required (must upload all 3)</p>
                    <div className="space-y-2">
                      {[
                        { type: 'registration_certificate', label: 'Certificate of Registration / Incorporation' },
                        { type: 'accreditation_letter', label: 'Academic Accreditation Letter (NCHE, UNCHE, or equivalent)' },
                        { type: 'domain_proof', label: 'Institutional Email Domain Proof (DNS record or official letter)' },
                      ].map(({ type, label }) => {
                        const uploaded = uploadedTypes.includes(type);
                        return (
                          <div key={type} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800">
                            {uploaded
                              ? <CheckCircle className="size-4 text-green-500 flex-shrink-0" />
                              : <div className="size-4 rounded-full border-2 border-neutral-300 flex-shrink-0" />}
                            <span className={`text-sm font-medium ${uploaded ? 'text-green-700 dark:text-green-400 line-through opacity-60' : 'text-neutral-700 dark:text-neutral-300'}`}>
                              📄 {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Recommended (improves PoIC score)</p>
                    <div className="space-y-1 text-sm text-neutral-500 font-medium pl-2">
                      <p>📄 Audit Report (last 2 years)</p>
                      <p>📄 Government Recognition Letter</p>
                      <p>📄 Quality Assurance Certificate</p>
                      <p>📄 Board/Governance Charter</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">Optional (additional trust signals)</p>
                    <div className="space-y-1 text-sm text-neutral-400 font-medium pl-2">
                      <p>📄 Partnership Letters</p>
                      <p>📄 Student Enrollment Statistics</p>
                      <p>📄 Facilities/Infrastructure evidence</p>
                    </div>
                  </div>
                </div>

                {/* Document type selector + upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Document Type</label>
                      <select
                        value={pendingDocType}
                        onChange={(e) => setPendingDocType(e.target.value)}
                        className="flex h-12 w-full rounded-2xl border-none bg-neutral-50 dark:bg-neutral-900 px-4 text-sm font-bold shadow-inner outline-none"
                      >
                        {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-[32px] bg-neutral-50/50 dark:bg-neutral-900/50 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <FileUpload onUpload={(files) => {
                      const fd = new FormData();
                      files.forEach((f) => {
                        fd.append('documents', f);
                        fd.append('type', pendingDocType);
                      });
                      uploadMutation.mutate(fd);
                    }} isUploading={uploadMutation.isPending} acceptedFileTypes=".pdf,.jpg,.jpeg,.png" maxFiles={1} />
                  </div>
                </div>

                {/* Uploaded documents list */}
                {uploadedDocuments.length > 0 && (
                  <div className="grid gap-3">
                    {uploadedDocuments.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary"><FileText className="size-5" /></div>
                          <div>
                            <p className="text-sm font-bold dark:text-neutral-200">{doc.name}</p>
                            <Badge variant="secondary" className="text-[8px] font-black uppercase px-2 h-4">
                              {DOC_TYPE_LABELS[doc.type] || doc.type}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-500" onClick={() => setUploadedDocuments(prev => prev.filter((_, idx) => idx !== i))}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Required docs progress indicator */}
                <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-[24px] border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Required Documents Progress</p>
                    <p className="text-xs font-black text-neutral-700 dark:text-neutral-300">
                      {REQUIRED_DOC_TYPES.filter(t => uploadedTypes.includes(t)).length}/{REQUIRED_DOC_TYPES.length} required
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${(REQUIRED_DOC_TYPES.filter(t => uploadedTypes.includes(t)).length / REQUIRED_DOC_TYPES.length) * 100}%` }}
                    />
                  </div>
                  {!requiredDocsMet && (
                    <p className="text-xs text-amber-500 font-medium mt-2">
                      ⚠️ Upload all 3 required documents to enable submission.
                    </p>
                  )}
                </div>
              </section>

              <div className="pt-8 flex justify-end gap-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold text-neutral-400" onClick={() => window.history.back()}>Discard Application</Button>
                <Button type="submit" disabled={isSubmitting || !requiredDocsMet} className="h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                  {isSubmitting ? <Loader2 className="size-5 mr-2 animate-spin" /> : <Shield className="size-5 mr-2" />}
                  {requiredDocsMet ? 'Submit for Review' : 'Upload Required Documents First'}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl shadow-neutral-200/40 dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Protocol Readiness</p>
              <CardTitle className="text-xl font-black tracking-tight">Application Health</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black tracking-tighter">{completionValue()}%</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">Complete</span>
                </div>
                <Progress value={completionValue()} className="h-3 bg-neutral-100 dark:bg-neutral-800" />
              </div>
              <div className="space-y-4 pt-4">
                {[
                  { label: "Identity Data", met: !!form.watch("institutionName") },
                  { label: "Authority Proof", met: uploadedDocuments.length > 0 },
                  { label: "Domain Verification", met: !!form.watch("domain") },
                  { label: "Compliance Summary", met: (form.watch("description")?.length || 0) >= 50 },
                ].map((step, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-bold">
                    <span className={step.met ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400"}>{step.label}</span>
                    {step.met ? <CheckCircle className="size-4 text-green-500" /> : <div className="size-4 rounded-full border-2 border-neutral-200" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="p-8 bg-primary rounded-[40px] shadow-2xl shadow-primary/20 text-white space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Lock className="size-24 rotate-12" /></div>
            <div className="space-y-4 relative z-10">
              <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md"><Shield className="size-6" /></div>
              <h4 className="text-2xl font-black tracking-tight leading-tight">Data Sovereignty Guaranteed.</h4>
              <p className="text-primary-foreground/70 text-sm font-medium leading-relaxed">Your information is processed by Educreds Trust Agent for consensus scoring only. All sensitive documents are encrypted at rest.</p>
            </div>
            <Button className="w-full h-12 bg-white text-primary hover:bg-neutral-100 rounded-xl font-black text-[10px] uppercase tracking-widest relative z-10">Read Privacy Protocol</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PoICSubmissionPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <GovernanceVerification />
      </Suspense>
    </ErrorBoundary>
  );
};

export default PoICSubmissionPage;
