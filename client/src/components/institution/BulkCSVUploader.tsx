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
  pending: number;
  errors: string[];
  totalProcessed: number;
}

interface PendingIssuance {
  id: string;
  recipientName: string;
  recipientWallet: string;
  status: 'pending' | 'minted' | 'failed';
  error?: string;
  issuanceRequestId?: string | null;
  transactionData?: any;
}

interface CsvValidationError {
  lineNumber: number;
  message: string;
}

interface CsvValidationSummary {
  rowCount: number;
  validRowCount: number;
  duplicateCount: number;
  invalidRowCount: number;
  duplicateRows: CsvValidationError[];
  invalidRows: CsvValidationError[];
  cleanFile: File;
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
  const [pendingIssuances, setPendingIssuances] = useState<PendingIssuance[]>([]);
  const [signingAll, setSigningAll] = useState(false);
  const [csvValidation, setCsvValidation] = useState<CsvValidationSummary | null>(null);

  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    values.push(current.trim());
    return values;
  };

  const isValidWalletAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const normalizeDateForKey = (value?: string): string => {
    if (!value) {
      return '';
    }
    const normalized = new Date(value);
    return Number.isNaN(normalized.getTime()) ? value.trim() : normalized.toISOString().split('T')[0];
  };

  const findColumnIndex = (headers: string[], variants: string[]): number => {
    for (const variant of variants) {
      const index = headers.findIndex((h) => h === variant);
      if (index !== -1) {
        return index;
      }
    }
    return -1;
  };

  const validateCsvFile = async (file: File): Promise<CsvValidationSummary> => {
    const csvText = await file.text();
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV must contain headers and at least one data row');
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

    const walletIndex = findColumnIndex(headers, ['wallet', 'studentwalletaddress', 'walletaddress', 'recipientwalletaddress', 'student_wallet']);
    const nameIndex = findColumnIndex(headers, ['name', 'studentname', 'recipientname', 'student_name', 'full_name']);
    const courseIndex = findColumnIndex(headers, ['course', 'coursename', 'course_name', 'courseid']);
    const emailIndex = findColumnIndex(headers, ['email', 'studentemail', 'recipientemail', 'student_email']);
    const gradeIndex = findColumnIndex(headers, ['grade', 'score', 'mark', 'gpa']);
    const dateIndex = findColumnIndex(headers, ['completiondate', 'completion_date', 'date', 'issuedate', 'issue_date']);
    const typeIndex = findColumnIndex(headers, ['certificatetype', 'certificate_type', 'type']);

    if (walletIndex === -1) {
      throw new Error('CSV must contain a wallet address column. Accepted names: wallet, walletAddress, studentWalletAddress, recipientWalletAddress.');
    }

    if (nameIndex === -1) {
      throw new Error('CSV must contain a name column. Accepted names: name, studentName, recipientName, full_name.');
    }

    if (courseIndex === -1) {
      throw new Error('CSV must contain a course column. Accepted names: course, courseName, course_name, courseId.');
    }

    const duplicateRows: CsvValidationError[] = [];
    const invalidRows: CsvValidationError[] = [];
    const seenKeys = new Set<string>();
    const cleanedLines: string[] = [lines[0]];
    let validRowCount = 0;
    let rowCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        continue;
      }

      rowCount++;
      const values = parseCsvLine(line);
      const wallet = values[walletIndex]?.trim() || '';
      const name = values[nameIndex]?.trim() || '';
      const course = values[courseIndex]?.trim() || '';
      const completionDate = dateIndex >= 0 ? values[dateIndex]?.trim() : '';
      const certificateType = typeIndex >= 0 ? values[typeIndex]?.trim() : '';

      if (!wallet || !name || !course) {
        invalidRows.push({
          lineNumber: i + 1,
          message: `Missing required field(s): wallet, name, and course are required`,
        });
        continue;
      }

      if (!isValidWalletAddress(wallet)) {
        invalidRows.push({
          lineNumber: i + 1,
          message: `Invalid wallet address format: ${wallet}`,
        });
        continue;
      }

      if (completionDate && Number.isNaN(new Date(completionDate).getTime())) {
        invalidRows.push({
          lineNumber: i + 1,
          message: `Invalid completion date: ${completionDate}`,
        });
        continue;
      }

      const rowKey = [
        wallet.toLowerCase(),
        course.trim().toLowerCase(),
        normalizeDateForKey(completionDate),
        (certificateType.trim() || 'Academic').toLowerCase(),
      ].join('|');

      if (seenKeys.has(rowKey)) {
        duplicateRows.push({
          lineNumber: i + 1,
          message: 'Duplicate row detected in CSV file',
        });
        continue;
      }

      seenKeys.add(rowKey);
      cleanedLines.push(line);
      validRowCount++;
    }

    if (validRowCount === 0) {
      throw new Error('No valid certificates parsed from CSV. All data rows were invalid or duplicate.');
    }

    const cleanCsvFile = new File([cleanedLines.join('\n')], file.name, { type: 'text/csv' });

    return {
      rowCount,
      validRowCount,
      duplicateCount: duplicateRows.length,
      invalidRowCount: invalidRows.length,
      duplicateRows,
      invalidRows,
      cleanFile: cleanCsvFile,
    };
  };

  // Poll job status function
  const pollJobStatus = async (jobId: string): Promise<any> => {
    const maxAttempts = 60; // 5 minutes max (5 seconds * 60)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const data = await api.getBulkIssuanceJobStatus(jobId);
        console.log('Job status:', data);
        
        // Handle different response formats
        const current = data.progress?.current || data.progress?.processed || data.processedItems || 0;
        const total = data.progress?.total || data.totalItems || 0;
        const successful = data.progress?.successful || data.successfulItems || 0;
        const failed = data.progress?.failed || data.failedItems || 0;
        
        setProcessingStatus(`Processing: ${current}/${total} (${successful} successful, ${failed} failed)`);

        if (data.status === 'completed' || data.status === 'COMPLETED') {
          return {
            successful,
            failed,
            pending: 0,
            errors: data.errors || [],
            totalProcessed: total,
          };
        } else if (data.status === 'failed' || data.status === 'FAILED') {
          throw new Error(data.error || data.errorMessage || 'Bulk job failed');
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Poll error:', error);
        throw error;
      }
    }

    throw new Error('Job timeout - taking longer than expected');
  };

  const bulkIssueMutation = useMutation({
    mutationFn: async (data: { file: File; templateId?: string }) => {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      try {
        const options = {
          batchSize: 10,
          continueOnError: true,
        };

        // Call the new bulk issuance CSV endpoint via API service
        const result = await api.bulkIssueCertificatesFromCSV(data.file, options);
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        console.log('Bulk issuance response:', result);
        
        // Start polling for job status
        if (result.jobId) {
          setProcessingStatus('Job created, processing certificates...');
          return await pollJobStatus(result.jobId);
        }
        
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
        pending: data.pending || 0,
        errors: data.errors || [],
        totalProcessed: data.totalProcessed || (data.successful || 0) + (data.failed || 0),
      };
      
      setBulkResult(result);
      setPendingIssuances([]); // No manual signing needed with batch processing
      
      toast({
        title: 'Bulk Issuance Complete',
        description: `Successfully issued ${result.successful} out of ${result.totalProcessed} certificates. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/institution'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      setProcessingStatus('');
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

  const signPendingIssuance = useCallback(async (issuance: PendingIssuance) => {
    if (!issuance.issuanceRequestId || !issuance.transactionData) {
      return;
    }
    try {
      await api.confirmWalletDirectIssuance({
        issuanceRequestId: issuance.issuanceRequestId,
        transactionData: issuance.transactionData,
        walletDirectRequired: true,
      });
      setPendingIssuances((prev) =>
        prev.map((item) =>
          item.id === issuance.id ? { ...item, status: 'minted', error: undefined } : item,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPendingIssuances((prev) =>
        prev.map((item) =>
          item.id === issuance.id ? { ...item, status: 'failed', error: message } : item,
        ),
      );
    }
  }, []);

  const signAllPending = useCallback(async () => {
    if (pendingIssuances.length === 0) return;
    setSigningAll(true);
    for (const issuance of pendingIssuances) {
      if (issuance.status !== 'pending') continue;
      await signPendingIssuance(issuance);
    }
    setSigningAll(false);
  }, [pendingIssuances, signPendingIssuance]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setCsvValidation(null);

      try {
        const validation = await validateCsvFile(file);
        setCsvValidation(validation);

        if (validation.duplicateCount > 0 || validation.invalidRowCount > 0) {
          toast({
            title: 'CSV Validation Notice',
            description: `Detected ${validation.duplicateCount} duplicate row(s) and ${validation.invalidRowCount} invalid row(s). Only the ${validation.validRowCount} valid rows will be submitted.`,
          });
        }
      } catch (error: any) {
        setCSVFile(null);
        setCsvValidation(null);

        toast({
          title: 'CSV Validation Failed',
          description: error?.message || 'Unable to parse CSV file',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const handleSubmit = useCallback(() => {
    if (!csvFile) {
      toast({
        title: 'Missing Information',
        description: 'Please upload a CSV file',
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

    if (csvValidation && csvValidation.validRowCount === 0) {
      toast({
        title: 'No Valid CSV Rows',
        description: 'Please fix the CSV file before submitting. The file contains no valid, unique certificate rows.',
        variant: 'destructive',
      });
      return;
    }

    if (csvValidation?.duplicateCount || csvValidation?.invalidRowCount) {
      toast({
        title: 'Submitting Cleaned CSV',
        description: `Duplicate and invalid rows have been removed. ${csvValidation.validRowCount} valid rows will be submitted.`,
      });
    }

    bulkIssueMutation.mutate({
      file: (csvValidation?.cleanFile ?? csvFile),
      templateId: selectedTemplate && selectedTemplate !== '__none__' ? selectedTemplate : undefined,
    });
  }, [csvFile, selectedTemplate, isLimitExceeded, bulkIssueMutation, toast, csvValidation]);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = `wallet,name,email,course,grade,completionDate,certificateType
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1,John Doe,john@example.com,Mathematics 101,A,2024-01-15,Course Completion
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2,Jane Smith,jane@example.com,Physics 201,B+,2024-01-15,Course Completion
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3,Bob Johnson,bob@example.com,Chemistry 301,A-,2024-01-15,Course Completion`;
    
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
      description: 'CSV template downloaded. Replace example wallet addresses with real ones. Wallet, name, and course columns are required.',
    });
  }, [toast]);

  const handleClearResult = useCallback(() => {
    setBulkResult(null);
    setCSVFile(null);
    setUploadProgress(0);
    setSelectedTemplate('');
    setCsvValidation(null);
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
                <strong>Required columns:</strong> wallet (or walletAddress), name (or studentName), course (or courseName)
              </li>
              <li>
                <strong>Optional columns:</strong> email, grade, completionDate (YYYY-MM-DD), certificateType
              </li>
              <li>
                Wallet addresses must be valid Ethereum addresses (0x followed by 40 hex characters)
              </li>
              <li>Column names are flexible - see examples for accepted variations</li>
              <li>The CSV parser on the server handles quoted values and special characters</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Template Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
              1
            </span>
            Select Template (Optional)
          </h3>
          
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="No template selected (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                No template (use CSV fields only)
              </SelectItem>
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
                        setCsvValidation(null);
                      }}
                      className="flex-shrink-0 text-green-700 hover:text-green-900 hover:bg-green-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </label>

            {csvValidation && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">CSV validation summary</p>
                <p className="mt-2">
                  {csvValidation.validRowCount} valid row(s) detected out of {csvValidation.rowCount} total.
                </p>
                {csvValidation.duplicateCount > 0 && (
                  <p className="mt-1 text-amber-800">
                    {csvValidation.duplicateCount} duplicate row(s) were removed before submission.
                  </p>
                )}
                {csvValidation.invalidRowCount > 0 && (
                  <p className="mt-1 text-amber-800">
                    {csvValidation.invalidRowCount} invalid row(s) were removed before submission.
                  </p>
                )}
                <div className="mt-3 space-y-2">
                  {csvValidation.invalidRows.slice(0, 3).map((error) => (
                    <p key={`invalid-${error.lineNumber}`}>Row {error.lineNumber}: {error.message}</p>
                  ))}
                  {csvValidation.duplicateRows.slice(0, 3).map((error) => (
                    <p key={`duplicate-${error.lineNumber}`}>Row {error.lineNumber}: {error.message}</p>
                  ))}
                  {(csvValidation.invalidRows.length > 3 || csvValidation.duplicateRows.length > 3) && (
                    <p className="text-xs text-amber-900/80">
                      Showing first 3 warnings. Clean the CSV or remove duplicate rows to avoid skipped rows.
                    </p>
                  )}
                </div>
              </div>
            )}
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
                !csvFile
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
                setCsvValidation(null);
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
