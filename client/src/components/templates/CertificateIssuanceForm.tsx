import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Template, TemplateField } from '../../../shared/types/template';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';

interface CertificateIssuanceFormProps {
  template: Template;
  institutionId: string;
  variantId?: string;
  onSuccess?: (certificateId: string) => void;
}

export function CertificateIssuanceForm({ 
  template, 
  institutionId, 
  variantId, 
  onSuccess 
}: CertificateIssuanceFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();

  // Add debugging and validation
  console.log('CertificateIssuanceForm received template:', template);
  console.log('Template metadata:', template?.metadata);
  console.log('Template fields:', template?.metadata?.fields);

  // Validate template structure
  if (!template || !template.metadata || !template.metadata.fields || !Array.isArray(template.metadata.fields)) {
    console.error('Invalid template structure:', template);
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Invalid Template</CardTitle>
          <CardDescription>
            The selected template is missing required metadata or fields. Please select a different template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Template structure: {JSON.stringify(template, null, 2)}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create dynamic schema based on template fields
  const createSchema = () => {
    const schemaFields: Record<string, any> = {};
    
    template.metadata.fields.forEach((field: TemplateField) => {
      if (field.required) {
        schemaFields[field.name] = z.string().min(1, `${field.name} is required`);
      } else {
        schemaFields[field.name] = z.string().optional();
      }
    });

    return z.object(schemaFields);
  };

  const schema = createSchema();
  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: template.metadata.fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue || '';
      return acc;
    }, {} as Record<string, string>),
  });

  const issueCertificateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.metadata.id,
          variantId,
          institutionId,
          data: {
            ...data,
            certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            issueDate: new Date().toISOString().split('T')[0],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to issue certificate');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Certificate issued successfully!');
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      onSuccess?.(data.data.id);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to issue certificate');
    },
  });

  const onSubmit = (data: FormData) => {
    issueCertificateMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">Certificate Issued Successfully!</CardTitle>
          <CardDescription>
            The certificate has been created and is ready for blockchain anchoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={() => setIsSuccess(false)}
            className="mt-4"
          >
            Issue Another Certificate
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Issue Certificate</CardTitle>
        <CardDescription>
          Fill in the details for the {template.metadata.name} certificate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.metadata.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === 'text' && (
                  <Input
                    id={field.name}
                    placeholder={field.placeholder}
                    {...form.register(field.name)}
                    className={form.formState.errors[field.name] ? 'border-red-500' : ''}
                  />
                )}
                {field.type === 'date' && (
                  <Input
                    id={field.name}
                    type="date"
                    placeholder={field.placeholder}
                    {...form.register(field.name)}
                    className={form.formState.errors[field.name] ? 'border-red-500' : ''}
                  />
                )}
                {field.type === 'number' && (
                  <Input
                    id={field.name}
                    type="number"
                    placeholder={field.placeholder}
                    {...form.register(field.name)}
                    className={form.formState.errors[field.name] ? 'border-red-500' : ''}
                  />
                )}
                {form.formState.errors[field.name]?.message && (
                  <p className="text-sm text-red-500">
                    {String(form.formState.errors[field.name]?.message)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={issueCertificateMutation.isPending}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={issueCertificateMutation.isPending}
            >
              {issueCertificateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                'Issue Certificate'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
