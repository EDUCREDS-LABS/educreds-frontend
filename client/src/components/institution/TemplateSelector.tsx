import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Loader2,
  CheckCircle,
  Wallet,
  Calendar,
  Eye,
  Sparkles,
} from 'lucide-react';

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
  onSubmit: () => void;
  isLoading: boolean;
  isLimitExceeded: boolean;
}

export function TemplateSelector({
  templates,
  selectedTemplate,
  onTemplateSelect,
  form,
  onSubmit,
  isLoading,
  isLimitExceeded,
}: TemplateSelectorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

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
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Template-Based Issuance</CardTitle>
          <CardDescription>
            Select a template and fill in recipient details to issue a certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <FileText className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Templates automatically populate certificate fields with recipient data,
              ensuring consistent branding and professional appearance.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-8">
              {/* Template Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    1. Select Template
                  </h3>
                  {selectedTemplate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewTemplate(selectedTemplate)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Template</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handleTemplateChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Search and select a template..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[400px]">
                          {templates.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              No templates available. Browse marketplace or create one.
                            </SelectItem>
                          ) : (
                            templates.map((template: Template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex items-center gap-3 py-1">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{template.name}</span>
                                      {template.category === 'ai-generated' && (
                                        <Badge className="text-xs bg-purple-100 text-purple-800">
                                          <Sparkles className="w-3 h-3 mr-1" />
                                          AI
                                        </Badge>
                                      )}
                                      {template.category === 'created' && (
                                        <Badge variant="outline" className="text-xs">
                                          Custom
                                        </Badge>
                                      )}
                                      {template.category === 'purchased' && (
                                        <Badge className="text-xs bg-green-100 text-green-800">
                                          Purchased
                                        </Badge>
                                      )}
                                    </div>
                                    {template.description && (
                                      <p className="text-xs text-neutral-500 mt-0.5">
                                        {template.description}
                                      </p>
                                    )}
                                  </div>
                                  {template.usageCount !== undefined && (
                                    <span className="text-xs text-neutral-400">
                                      Used {template.usageCount}x
                                    </span>
                                  )}
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

                {selectedTemplate && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      {selectedTemplate.thumbnail && (
                        <img
                          src={selectedTemplate.thumbnail}
                          alt={selectedTemplate.name}
                          className="w-24 h-24 rounded-md object-cover border border-neutral-200"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900">
                          {selectedTemplate.name}
                        </h4>
                        <p className="text-sm text-neutral-600 mt-1">
                          {selectedTemplate.description || 'Professional certificate template'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {selectedTemplate.category}
                          </Badge>
                          {selectedTemplate.rating && (
                            <span className="text-xs text-neutral-600">
                              ⭐ {selectedTemplate.rating}/5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Recipient Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    2
                  </span>
                  Recipient Information
                </h3>

                <FormField
                  control={form.control}
                  name="recipientWallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Blockchain Address *
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
                        Ethereum address where certificate NFT will be minted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Recipient Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John Doe"
                          className="h-11"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Full name as it will appear on the certificate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="completionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Completion Date *
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
                    control={form.control}
                    name="certificateType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Certificate Type *
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
                            <SelectItem value="Certification">
                              Certification
                            </SelectItem>
                            <SelectItem value="Achievement">Achievement</SelectItem>
                            <SelectItem value="Participation">
                              Participation
                            </SelectItem>
                            <SelectItem value="Training">Training</SelectItem>
                            <SelectItem value="Workshop">Workshop</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Optional Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  3. Additional Details (Optional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Course ID
                        </FormLabel>
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

                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Grade / Score
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="A, 4.0 GPA, 95%, Distinction"
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={isLoading || isLimitExceeded}
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-base font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Issuing Certificate...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Issue Certificate
                    </>
                  )}
                </Button>
                <Button
                  type="reset"
                  variant="outline"
                  className="h-12 px-8"
                  onClick={() => {
                    form.reset();
                    onTemplateSelect(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Template Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.description || 'Template preview'}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-[1.414/1] bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
            {previewTemplate?.previewUrl ? (
              <img
                src={previewTemplate.previewUrl}
                alt={previewTemplate.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">Preview not available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
