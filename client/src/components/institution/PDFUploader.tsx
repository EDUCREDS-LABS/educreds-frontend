import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  FileUp,
  Loader2,
  CheckCircle,
  Upload,
  X,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from "@/lib/utils";

// ── Custom fields editor ──────────────────────────────────────────────────────
function CustomFieldsEditor({ form, index }: { form: UseFormReturn<any>; index: number }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `certificates.${index}.customFields`,
  });
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Custom Fields</span>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={() => append({ key: '', value: '' })}>
          <Plus className="size-3" /> Add field
        </Button>
      </div>
      {fields.map((f, fi) => (
        <div key={f.id} className="flex gap-2 items-center">
          <Input placeholder="Field name" {...form.register(`certificates.${index}.customFields.${fi}.key`)} className="h-9 rounded-lg text-sm flex-1" />
          <Input placeholder="Value" {...form.register(`certificates.${index}.customFields.${fi}.value`)} className="h-9 rounded-lg text-sm flex-1" />
          <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 text-neutral-400 hover:text-red-500" onClick={() => remove(fi)}>
            <X className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

interface PDFUploaderProps {
  form: UseFormReturn<any>;
  onSubmit: () => void;
  isLoading: boolean;
  isLimitExceeded: boolean;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
}

export function PDFUploader({
  form,
  onSubmit,
  isLoading,
  isLimitExceeded,
  uploadProgress,
  setUploadProgress,
}: PDFUploaderProps) {
  const pdfFile = form.watch('pdfFile');
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "certificates",
  });

  // Ensure fields are initialized if empty
  useEffect(() => {
    if (fields.length === 0) {
      append({ 
        studentName: "", 
        studentAddress: "", 
        studentEmail: "",
        completionDate: new Date().toISOString().split('T')[0], 
        certificateType: 'Course Completion',
        courseName: '',
        grade: '',
        description: ''
      });
    }
  }, [fields.length, append]);

  return (
    <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
      <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800">
        <CardTitle className="text-2xl font-black">PDF Asset Issuance</CardTitle>
        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-primary">Upload PDF (optional) and add recipients (1-10)</CardDescription>
      </CardHeader>
      <CardContent className="p-10">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-10">
            {/* PDF Upload Section */}
            <div className="space-y-6">
                <h3 className="text-lg font-black tracking-tight">1. Upload Certificate PDF <span className="text-neutral-400 font-medium text-sm">(optional)</span></h3>
                <FormField
                    control={form.control}
                    name="pdfFile"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <div className="relative">
                            <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                field.onChange(file);
                                setUploadProgress(0);
                                }
                            }}
                            className="hidden"
                            id="pdf-upload-input"
                            />
                            <label
                            htmlFor="pdf-upload-input"
                            className="flex flex-col items-center justify-center w-full px-6 py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                            >
                            {!pdfFile ? (
                                <div className="text-center">
                                <div className="size-16 mx-auto mb-4 rounded-full bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
                                    <Upload className="size-8 text-neutral-400 group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-sm font-black text-neutral-900 dark:text-neutral-100">Click to upload or drag and drop</p>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">PDF files only, maximum 10MB</p>
                                </div>
                            ) : (
                                <div className="w-full flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl">
                                    <FileText className="size-8 text-emerald-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">{pdfFile.name}</p>
                                        <p className="text-[10px] text-emerald-700 font-bold uppercase">{(pdfFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); field.onChange(null); }}>
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            )}
                            </label>
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <Separator />

            {/* Recipient Information */}
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
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Student Name</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.studentEmail`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email</FormLabel><FormControl><Input type="email" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.studentAddress`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Wallet Address <span className="normal-case font-normal text-neutral-400">(optional if email provided)</span></FormLabel>
                                  <FormControl><Input {...field} placeholder="0x… or leave blank" className="h-12 rounded-xl font-mono" /></FormControl>
                                  <FormMessage />
                                  <p className="text-[10px] text-neutral-400 mt-1">If omitted, an embedded wallet is auto-created from the student's email and EDU-ID.</p>
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.completionDate`} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Completion Date</FormLabel><FormControl><Input type="date" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
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
                                        </SelectContent>                                    </Select>
                                </FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name={`certificates.${index}.description`} render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Description</FormLabel><FormControl><Textarea {...field} className="rounded-xl" /></FormControl></FormItem>
                            )}/>
                        </div>
                        {/* Custom fields */}
                        <CustomFieldsEditor form={form} index={index} />
                    </div>
                ))}
                
{fields.length < 10 && (
                   <Button type="button" variant="outline" onClick={() => append({ studentName: "", studentAddress: "", studentEmail: "", completionDate: new Date().toISOString().split('T')[0], certificateType: 'Course Completion', courseName: '', grade: '', description: '' })} className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest w-full">
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
  );
}
