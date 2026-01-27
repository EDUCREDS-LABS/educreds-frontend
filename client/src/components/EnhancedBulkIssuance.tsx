import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  ShoppingCart,
  Plus,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface BulkCertificate {
  studentName: string;
  studentEmail: string;
  walletAddress: string;
  completionDate: string;
  grade?: string;
  courseName?: string;
}

interface BulkResult {
  batchId: string;
  timestamp: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  results: Array<{
    index: number;
    studentEmail: string;
    success: boolean;
    certificateId?: string;
    txHash?: string;
    error?: string;
  }>;
}

interface Template {
  id: string;
  name: string;
  category: 'created' | 'purchased' | 'uploaded';
}

/**
 * Enhanced Bulk Issuance Component
 * 
 * Features:
 * - CSV template upload/download
 * - Template-based issuance (specs or marketplace)
 * - Legacy PDF issuance
 * - Real-time progress tracking
 * - Batch result export
 * - Validation and error handling
 */
export default function EnhancedBulkIssuance() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [csvData, setCsvData] = useState<BulkCertificate[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [issuanceMode, setIssuanceMode] = useState<'template' | 'legacy-pdf'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showMarketplace, setShowMarketplace] = useState(false);

  // Queries
  const { data: templatesData } = useQuery({
    queryKey: ['/templates/specs'],
    queryFn: () => api.getTemplateSpecs(),
  });

  const templates = (templatesData as any) || [];

  // Mutations
  const bulkIssueMutation = useMutation({
    mutationFn: async (data: {
      certificates: BulkCertificate[];
      templateId?: string;
      mode: 'template' | 'legacy-pdf';
    }) => {
      if (data.mode === 'template') {
        return api.bulkIssueFromTemplate({
          templateId: data.templateId || '',
          certificates: data.certificates,
        });
      } else {
        const formData = new FormData();
        formData.append('certificates', JSON.stringify(data.certificates));
        return api.bulkIssueLegacyPDF(formData);
      }
    },
    onSuccess: (response) => {
      setResult(response);
      toast({
        title: 'Bulk Processing Complete',
        description: `${response.summary.successful}/${response.summary.total} certificates issued`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Bulk processing failed',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      parseCsv(csv);
    };
    reader.readAsText(file);
  };

  const parseCsv = (csv: string) => {
    const lines = csv.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      toast({
        title: 'Invalid CSV',
        description: 'CSV must contain header and at least one data row',
        variant: 'destructive',
      });
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredFields = ['studentname', 'studentemail', 'walletaddress', 'completiondate'];

    // Validate headers
    const missingFields = requiredFields.filter((field) => !headers.includes(field));
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `CSV must include: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Parse data
    const data: BulkCertificate[] = lines
      .slice(1)
      .map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const nameIdx = headers.indexOf('studentname');
        const emailIdx = headers.indexOf('studentemail');
        const walletIdx = headers.indexOf('walletaddress');
        const dateIdx = headers.indexOf('completiondate');
        const gradeIdx = headers.indexOf('grade');
        const courseIdx = headers.indexOf('coursename');

        return {
          studentName: values[nameIdx] || '',
          studentEmail: values[emailIdx] || '',
          walletAddress: values[walletIdx] || '',
          completionDate: values[dateIdx] || new Date().toISOString().split('T')[0],
          grade: gradeIdx >= 0 ? values[gradeIdx] : undefined,
          courseName: courseIdx >= 0 ? values[courseIdx] : undefined,
        };
      })
      .filter((cert) => cert.studentName && cert.studentEmail && cert.walletAddress);

    if (data.length === 0) {
      toast({
        title: 'No Valid Certificates',
        description: 'CSV does not contain valid certificate data',
        variant: 'destructive',
      });
      return;
    }

    setCsvData(data);
    toast({
      title: 'CSV Loaded',
      description: `${data.length} certificates ready for processing`,
    });
  };

  const downloadTemplate = () => {
    const template = `StudentName,StudentEmail,WalletAddress,CompletionDate,Grade,CourseName
John Doe,john@example.com,0x742d35Cc6634C0532925a3b844Bc111e6b0DDd1,2024-01-15,A,Mathematics 101
Jane Smith,jane@example.com,0x1234567890123456789012345678901234567890,2024-01-16,B+,Physics 201
Bob Johnson,bob@example.com,0xAbcdefabcdefabcdefabcdefabcdefabcdefabcd,2024-01-17,A-,Chemistry 101`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_certificates_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!result) return;

    const csv = [
      'Index,StudentEmail,Status,CertificateID,TransactionHash,Error',
      ...result.results.map(
        (r) =>
          `${r.index},"${r.studentEmail}","${r.success ? 'Success' : 'Failed'}","${r.certificateId || ''}","${r.txHash || ''}","${(r.error || '').replace(/"/g, '""')}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_results_${result.batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkIssue = () => {
    if (csvData.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please upload a CSV file first',
        variant: 'destructive',
      });
      return;
    }

    if (issuanceMode === 'template' && !selectedTemplate) {
      toast({
        title: 'No Template',
        description: 'Please select a template',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 500);

    bulkIssueMutation.mutate(
      {
        certificates: csvData,
        templateId: selectedTemplate,
        mode: issuanceMode,
      },
      {
        onSettled: () => {
          clearInterval(progressInterval);
          setProgress(100);
          setProcessing(false);
        },
      }
    );
  };

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    csvData.forEach((cert, idx) => {
      if (!cert.studentName?.trim()) errors.push(`Row ${idx + 1}: Missing student name`);
      if (!cert.studentEmail?.trim()) errors.push(`Row ${idx + 1}: Missing email`);
      if (!cert.walletAddress?.match(/^0x[a-fA-F0-9]{40}$/))
        errors.push(`Row ${idx + 1}: Invalid wallet address`);
      if (!cert.completionDate) errors.push(`Row ${idx + 1}: Missing completion date`);
    });

    return errors;
  }, [csvData]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Bulk Certificate Issuance</h1>
          <p className="text-neutral-600 mt-2">
            Issue multiple certificates at once using CSV upload with template or legacy PDF
          </p>
        </div>

        {result ? (
          /* Results View */
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Batch Completed</CardTitle>
              <CardDescription>
                Processed on {new Date(result.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-neutral-50 rounded-lg">
                  <p className="text-2xl font-bold text-neutral-900">{result.summary.total}</p>
                  <p className="text-sm text-neutral-600">Total</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{result.summary.successful}</p>
                  <p className="text-sm text-green-800">Successful</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
                  <p className="text-sm text-red-800">Failed</p>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 px-4 font-semibold text-neutral-900">#</th>
                      <th className="text-left py-2 px-4 font-semibold text-neutral-900">Email</th>
                      <th className="text-left py-2 px-4 font-semibold text-neutral-900">Status</th>
                      <th className="text-left py-2 px-4 font-semibold text-neutral-900">ID</th>
                      <th className="text-left py-2 px-4 font-semibold text-neutral-900">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.slice(0, 20).map((r) => (
                      <tr key={r.index} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-2 px-4 text-neutral-600">{r.index + 1}</td>
                        <td className="py-2 px-4 text-neutral-900">{r.studentEmail}</td>
                        <td className="py-2 px-4">
                          {r.success ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </td>
                        <td className="py-2 px-4 font-mono text-xs text-neutral-600">
                          {r.certificateId?.substring(0, 8)}...
                        </td>
                        <td className="py-2 px-4 text-xs text-red-600">{r.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.results.length > 20 && (
                <p className="text-sm text-neutral-600 text-center">
                  Showing 20 of {result.results.length} results. Download full report for all details.
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={downloadResults}
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
                <Button
                  onClick={() => {
                    setResult(null);
                    setCsvData([]);
                    setProgress(0);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Batch
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Main Form */
          <>
            {/* CSV Upload */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Step 1: Upload CSV</CardTitle>
                <CardDescription>
                  Download template, fill with data, and upload here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>

                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-input"
                  />
                  <label
                    htmlFor="csv-input"
                    className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-neutral-900">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-neutral-600 mt-1">CSV files only</p>
                    </div>
                  </label>
                </div>

                {csvData.length > 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {csvData.length} certificates loaded and ready
                    </AlertDescription>
                  </Alert>
                )}

                {validationErrors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="space-y-1">
                        <p className="font-medium">Validation errors found:</p>
                        <ul className="text-xs list-disc list-inside">
                          {validationErrors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {validationErrors.length > 5 && (
                            <li>...and {validationErrors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Issuance Mode Selection */}
            {csvData.length > 0 && validationErrors.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Step 2: Select Issuance Method</CardTitle>
                  <CardDescription>Choose how to issue these certificates</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={issuanceMode}
                    onValueChange={(value) => setIssuanceMode(value as 'template' | 'legacy-pdf')}
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="template">Template-Based</TabsTrigger>
                      <TabsTrigger value="legacy-pdf">Legacy PDF</TabsTrigger>
                    </TabsList>

                    {/* Template Mode */}
                    <TabsContent value="template" className="space-y-4">
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Select a template from your specs or marketplace. Student data will be
                          auto-filled into placeholders.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-neutral-900">
                          Select Template
                        </label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Choose a template..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {templates.length === 0 ? (
                              <SelectItem value="empty" disabled>
                                No templates available
                              </SelectItem>
                            ) : (
                              templates.map((template: Template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {template.category}
                                    </Badge>
                                    <span>{template.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={() => setShowMarketplace(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Browse Marketplace Templates
                      </Button>
                    </TabsContent>

                    {/* Legacy PDF Mode */}
                    <TabsContent value="legacy-pdf" className="space-y-4">
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          Upload a static PDF certificate template. Student names will be
                          embedded before issuance.
                        </AlertDescription>
                      </Alert>

                      <p className="text-sm text-neutral-600">
                        Template upload functionality will be available in the issuance form.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            {csvData.length > 0 && validationErrors.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  {processing && (
                    <div className="space-y-4 mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-900">
                            Processing {csvData.length} certificates...
                          </span>
                          <span className="text-sm text-neutral-600">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleBulkIssue}
                    disabled={
                      processing ||
                      bulkIssueMutation.isPending ||
                      (issuanceMode === 'template' && !selectedTemplate)
                    }
                    className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {bulkIssueMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Issue {csvData.length} Certificates
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Info */}
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-3">Required CSV Format</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>StudentName:</strong> Full name of the student
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>StudentEmail:</strong> Valid email address
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>WalletAddress:</strong> Valid Ethereum address (0x...)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>CompletionDate:</strong> YYYY-MM-DD format
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Grade (optional):</strong> A, B+, 95%, etc.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>CourseName (optional):</strong> Name of the course
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
