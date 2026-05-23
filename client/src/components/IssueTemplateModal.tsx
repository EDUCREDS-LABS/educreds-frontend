import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const issueSchema = z.object({
  recipientName: z.string().min(2, "Name is required"),
  recipientWallet: z.string().min(42, "Valid wallet address required"),
  courseName: z.string().min(2, "Course name is required"),
  grade: z.string().optional(),
});

interface IssueTemplateModalProps {
  templateId: string;
  templateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IssueTemplateModal: React.FC<IssueTemplateModalProps> = ({ templateId, templateName, open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      recipientName: '',
      recipientWallet: '',
      courseName: '',
      grade: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.issueFromTemplate({
      templateId,
      ...data,
      completionDate: new Date().toISOString(),
      certificateType: 'Academic',
    }),
    onSuccess: (result) => {
      toast({
        title: result.onChainStatus === 'minted' ? "✅ Success" : "⏳ Pending",
        description: result.onChainStatus === 'minted' 
            ? 'Certificate issued and minted successfully!' 
            : 'Issuance initiated. Please confirm in your wallet.',
      });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Issuance failed',
        variant: 'destructive',
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Certificate: {templateName}</DialogTitle>
          <DialogDescription>Fill in the details to issue this credential.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="recipientName" render={({ field }) => (
              <FormItem><FormLabel>Student Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="recipientWallet" render={({ field }) => (
              <FormItem><FormLabel>Student Wallet Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="courseName" render={({ field }) => (
              <FormItem><FormLabel>Course Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="grade" render={({ field }) => (
              <FormItem><FormLabel>Grade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Processing...' : 'Issue Certificate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
