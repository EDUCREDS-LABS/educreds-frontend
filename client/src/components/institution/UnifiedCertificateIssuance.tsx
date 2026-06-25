// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { FileText, Upload, Users, Download, Zap, CheckCircle, Loader2, Plus, Trash2, Database, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

const multiCertSchema = z.object({
  certificates: z.array(singleCertSchema).min(1).max(10),
});

type MultiCertForm = z.infer<typeof multiCertSchema>;

export default function UnifiedCertificateIssuance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("multi");

  const form = useForm<MultiCertForm>({
    resolver: zodResolver(multiCertSchema),
    defaultValues: {
      certificates: [
        {
          studentName: "",
          studentEmail: "",
          studentAddress: "",
          courseName: "",
          grade: "",
          completionDate: new Date().toISOString().split('T')[0],
          certificateType: "certificate",
          description: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "certificates",
  });

  const issueMultiMutation = useMutation({
    mutationFn: async (data: MultiCertForm) => {
        return api.issueMultipleCertificates(data.certificates);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Certificates issued successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/institution"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: MultiCertForm) => {
    issueMultiMutation.mutate(data);
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-neutral-900 dark:text-white">Issuance Protocol.</h1>
        <p className="text-neutral-500 font-medium mt-2">Manage cluster-based certificate issuance and cryptographic batch registry.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl">
          <TabsTrigger value="multi" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em]">Multi-Issue (1-10)</TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-xl font-black text-[10px] uppercase tracking-[0.2em]">Bulk CSV/Template</TabsTrigger>
        </TabsList>

        <TabsContent value="multi">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {fields.map((field, index) => (
                <Card key={field.id} className="border-none shadow-xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[32px] overflow-hidden bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between bg-neutral-50 dark:bg-neutral-800 p-6 border-b border-neutral-100 dark:border-neutral-700">
                        <CardTitle className="text-lg font-black flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                {index + 1}
                            </div>
                            Credential Asset {index + 1}
                        </CardTitle>
                        {fields.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="size-4" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name={`certificates.${index}.studentName`} render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Student Name</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name={`certificates.${index}.studentEmail`} render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name={`certificates.${index}.studentAddress`} render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Wallet Address</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl font-mono" /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name={`certificates.${index}.courseName`} render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Course</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl" /></FormControl></FormItem>
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
                    </CardContent>
                </Card>
              ))}
              
              <div className="flex gap-4">
                  {fields.length < 10 && (
                    <Button type="button" variant="outline" onClick={() => append({ studentName: "", studentEmail: "", studentAddress: "", courseName: "", grade: "", completionDate: new Date().toISOString().split('T')[0], certificateType: "certificate", description: "" })} className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest">
                        <Plus className="size-4 mr-2" /> Add Another Credential
                    </Button>
                  )}
                  <Button type="submit" className="h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white ml-auto" disabled={issueMultiMutation.isPending}>
                    {issueMultiMutation.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Zap className="size-4 mr-2" />}
                    Issue All ({fields.length})
                  </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="bulk">
          {/* Keep existing bulk content here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
