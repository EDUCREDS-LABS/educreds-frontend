import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Info,
  X,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  category: string;
}

interface BulkCSVUploaderProps {
  templates: Template[];
  isLimitExceeded: boolean;
}

interface BulkIssuanceResult {
  successful: number;
  failed: number;
  errors: string[];
  totalProcessed: number;
}

export function BulkCSVUploader({
  templates,
  isLimitExceeded,
}: BulkCSVUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [bulkResult, setBulkResult] = useState<BulkIssuanceResult | null>(null);

  const bulkIssueMutation = useMutation({
    mutationFn: async (data: { file: File; templateId: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('templateId', data.templateId);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      try {
        const result = await api.bulkIssueCertificates(formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      const result: BulkIssuanceResult = {
        successful: data.successful || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
        totalProcessed: (data.successful || 0) + (data.failed || 0),
      };
      
      setBulkResult(result);
      
      toast({
        title: 'Bulk Issuance Complete',
        description: `Successfully issued ${result.successful} certificates. ${
          result.failed > 0 ? `${result.failed} failed.` : ''
        }`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk Issuance Failed',
        description: error.message || 'Failed to process CSV file',
        variant: 'destructive',
      });
      setUploadProgress(0);
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setCSVFile(file);
      setBulkResult(null);
      setUploadProgress(0);
    }
  }, [toast]);

  const handleSubmit = useCallback(() => {
    if (!csvFile || !selectedTemplate) {
      toast({
        title: 'Missing Information',
        description: 'Please select a template and upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    if (isLimitExceeded) {
      toast({
        title: 'Certificate Limit Exceeded',
        description: 'Upgrade your subscription to issue more certificates',
        variant: 'destructive',
      });
      return;
    }

    bulkIssueMutation.mutate({
      file: csvFile,
      templateId: selectedTemplate,
    });
  }, [csvFile, selectedTemplate, isLimitExceeded, bulkIssueMutation, toast]);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = `recipientWallet,recipientName,completionDate,certificateType,grade,courseId
0x1234567890123456789012345678901234567890,John Doe,2024-01-15,Course Completion,A,CS101
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,Jane Smith,2024-01-15,Degree,4.0 GPA,ENG201`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_certificate_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded successfully',
    });
  }, [toast]);

  const handleClearResult = useCallback(() => {
    setBulkResult(null);
    setCSVFile(null);
    setUploadProgress(0);
    setSelectedTemplate('');
  }, []);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle>Bulk Certificate Issuance</CardTitle>
        <CardDescription>
          Upload a CSV file to issue multiple certificates at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">CSV Format Requirements</AlertTitle>
          <AlertDescription className="text-blue-800 mt-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Required columns:</strong> recipientWallet, recipientName,
                completionDate, certificateType
              </li>
              <li>
                <strong>Optional columns:</strong> grade, courseId
              </li>
              <li>
                Wallet addresses must be valid Ethereum addresses (42 characters
                starting with 0x)
              </li>
              <li>Dates should be in YYYY-MM-DD format</li>
              <li>Maximum 100 certificates per upload</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Template Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
              1
            </span>
            Select Template
          </h3>
          
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Choose a template for bulk issuance..." />
            </SelectTrigger>
            <SelectContent>
              {templates.length === 0 ? (
                <SelectItem value="empty" disabled>
                  No templates available
                </SelectItem>
              ) : (
                templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* CSV Upload */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                2
              </span>
              Upload CSV File
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload-input"
            />
            <label
              htmlFor="csv-upload-input"
              className="flex flex-col items-center justify-center w-full px-6 py-12 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
            >
              {!csvFile ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <FileSpreadsheet className="w-8 h-8 text-neutral-400 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-base font-medium text-neutral-900 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-neutral-600">
                    CSV files only, maximum 100 recipients
                  </p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <FileSpreadsheet className="w-8 h-8 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">
                        {csvFile.name}
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">
                        {(csvFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCSVFile(null);
                        setUploadProgress(0);
                      }}
                      className="flex-shrink-0 text-green-700 hover:text-green-900 hover:bg-green-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Processing Progress */}
        {bulkIssueMutation.isPending && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-900">
                Processing bulk issuance...
              </span>
              <span className="text-neutral-600">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            {processingStatus && (
              <p className="text-sm text-neutral-600">{processingStatus}</p>
            )}
          </div>
        )}

        {/* Results */}
        {bulkResult && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Issuance Complete
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900">Successful</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {bulkResult.successful}
                  </p>
                </div>
                
                {bulkResult.failed > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-900">Failed</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {bulkResult.failed}
                    </p>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">Total Processed</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {bulkResult.totalProcessed}
                  </p>
                </div>
              </div>

              {bulkResult.errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-900">Errors Encountered</AlertTitle>
                  <AlertDescription className="text-red-800 mt-2">
                    <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                      {bulkResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                variant="outline"
                onClick={handleClearResult}
                className="w-full"
              >
                Issue Another Batch
              </Button>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        {!bulkResult && (
          <div className="flex gap-3 pt-6 border-t">
            <Button
              onClick={handleSubmit}
              disabled={
                bulkIssueMutation.isPending ||
                isLimitExceeded ||
                !csvFile ||
                !selectedTemplate
              }
              className="flex-1 h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-base font-medium"
            >
              {bulkIssueMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing {uploadProgress}%...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Issue Certificates
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-12 px-8"
              onClick={() => {
                setCSVFile(null);
                setSelectedTemplate('');
                setUploadProgress(0);
              }}
              disabled={bulkIssueMutation.isPending}
            >
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
