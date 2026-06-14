import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Loader2,
  CheckCircle,
  Wallet,
  Calendar,
  Eye,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template | null) => void;
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isLimitExceeded: boolean;
  templatesLoading?: boolean;
  templatesError?: boolean;
}

export function TemplateSelector({
  templates,
  selectedTemplate,
  onTemplateSelect,
  form,
  onSubmit,
  isLoading,
  isLimitExceeded,
  templatesLoading,
  templatesError,
}: TemplateSelectorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "certificates",
  });

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      onTemplateSelect(template);
      form.setValue('templateId', templateId);
    }
  };

  return (
    <>
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800">
          <CardTitle className="text-2xl font-black">Template-Based Issuance</CardTitle>
          <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Select template and add credentials (1-10)</CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-10">
              
              {/* Template Selection */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tight">1. Select Template</h3>
                  {selectedTemplate && (
                    <Button type="button" variant="outline" size="sm" onClick={() => handlePreviewTemplate(selectedTemplate)} className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                      <Eye className="size-4" /> Preview
                    </Button>
                  )}
                </div>

                {templatesError && (
                  <Alert className="rounded-2xl border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 [&>svg]:text-amber-600">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="font-medium">
                      Templates couldn't be loaded right now. You can still issue using the PDF Upload tab, or try again shortly.
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={handleTemplateChange}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner font-bold">
                            <SelectValue placeholder="Search and select a template..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl p-2 border-neutral-100 dark:border-neutral-800">
                          {templates.length === 0 ? (
                            <SelectItem value="empty" disabled>{templatesLoading ? "Loading templates…" : "No templates available yet."}</SelectItem>
                          ) : (
                            templates.map((template: Template) => (
                              <SelectItem key={template.id} value={template.id} className="rounded-xl font-bold py-3">
                                {template.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Multi-Credential Fields */}
              <div className="space-y-6">
                <h3 className="text-lg font-black tracking-tight">2. Recipient Information</h3>
                {fields.map((item, index) => (
                    <div key={item.id} className="p-6 bg-neutral-50 dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-neutral-800 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-primary uppercase tracking-widest">Asset {index + 1}</span>
                            {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-500 hover:text-red-600">
                                    <Trash2 className="size-4" />
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name={`certificates.${index}.studentName`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Student Name</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.studentEmail`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.studentAddress`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Wallet Address</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl font-mono" /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.completionDate`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Completion Date</FormLabel><FormControl><Input type="date" {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.courseName`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Course Name</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.grade`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Grade</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.certificateType`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Type</FormLabel><FormControl>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="certificate">Certificate</SelectItem>
                                            <SelectItem value="diploma">Diploma</SelectItem>
                                            <SelectItem value="degree">Degree</SelectItem>
                                            <SelectItem value="transcript">Transcript</SelectItem>
                                            <SelectItem value="achievement">Achievement</SelectItem>
                                            <SelectItem value="badge">Badge</SelectItem>
                                            <SelectItem value="license">License</SelectItem>
                                            <SelectItem value="membership">Membership</SelectItem>
                                            <SelectItem value="award">Award</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.description`} render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Description</FormLabel><FormControl><Textarea {...field} className="rounded-xl" /></FormControl></FormItem>
                            )}/>
                        </div>
                    </div>
                ))}
                
{fields.length < 10 && (
                     <Button type="button" variant="outline" onClick={() => append({ studentName: "", studentAddress: "", studentEmail: "", completionDate: new Date().toISOString().split('T')[0], certificateType: 'Course Completion', courseName: '', grade: '' })} className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest w-full">
                         <Plus className="size-4 mr-2" /> Add Another Recipient
                     </Button>
                 )}
               </div>

              {/* Submit Actions */}
              <div className="flex gap-3 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="submit"
                  disabled={isLoading || isLimitExceeded}
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  {isLoading ? <Loader2 className="size-5 mr-2 animate-spin" /> : <CheckCircle className="size-5 mr-2" />}
                  Issue {fields.length} Certificates
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Add Preview Dialog here if needed... */}
    </>
  );
}
