import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, Zap, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';
import { auth } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface BulkCertificate {
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseCode?: string;
  grade: string;
  completionDate: string;
}

interface BulkResult {
  batchId: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  results: Array<{
    index: number;
    success: boolean;
    certificateId?: string;
    error?: string;
  }>;
}

export const BulkCertificateIssuance: React.FC = () => {
  const [csvData, setCsvData] = useState<BulkCertificate[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [batchSigningEnabled, setBatchSigningEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { toast } = useToast();

  const institutionId = auth.getUser()?.sub || '';

  useEffect(() => {
    checkBatchSigningStatus();
  }, []);

  const checkBatchSigningStatus = async () => {
    if (!institutionId) return;

    try {
      const token = localStorage.getItem('institution_token') || localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.CERT}/api/institutions/${institutionId}/batch-signing/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setBatchSigningEnabled(data.enabled || false);
    } catch (error) {
      console.error('Failed to check batch signing status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data: BulkCertificate[] = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            studentName: values[0] || '',
            studentEmail: values[1] || '',
            courseName: values[2] || '',
            courseCode: values[3] || '',
            grade: values[4] || '',
            completionDate: values[5] || new Date().toISOString().split('T')[0]
          };
        });
      
      setCsvData(data);
      toast({
        title: "CSV Loaded",
        description: `${data.length} certificates ready for processing`
      });
    };
    reader.readAsText(file);
  };

  const processBulkIssuance = async () => {
    if (csvData.length === 0) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('institution_token') || localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.CERT}/api/certificates/bulk-issue-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          certificates: csvData.map(cert => ({
            studentWalletAddress: cert.studentEmail, // You may need to get actual wallet addresses
            studentName: cert.studentName,
            studentEmail: cert.studentEmail,
            courseName: cert.courseName,
            courseCode: cert.courseCode,
            grade: cert.grade,
            completionDate: cert.completionDate,
            certificateType: 'course_completion'
          }))
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        const jobId = data.jobId;
        
        toast({
          title: "Bulk Issuance Started",
          description: `Processing ${data.totalItems} certificates. ${batchSigningEnabled ? 'Using automatic batch signing.' : 'Manual signing may be required.'}`
        });

        // Poll for job status
        pollJobStatus(jobId);
      } else {
        throw new Error(data.message || 'Bulk processing failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setProcessing(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const token = localStorage.getItem('institution_token') || localStorage.getItem('token');
        const response = await fetch(
          `${API_CONFIG.CERT}/api/certificates/bulk/status/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.status === 'completed' || data.status === 'COMPLETED') {
          setResult({
            batchId: jobId,
            summary: {
              total: data.progress?.total || 0,
              successful: data.progress?.successful || 0,
              failed: data.progress?.failed || 0,
            },
            results: [],
          });
          setProcessing(false);
          toast({
            title: "Bulk Processing Complete",
            description: `${data.progress?.successful}/${data.progress?.total} certificates issued successfully`
          });
        } else if (data.status === 'failed' || data.status === 'FAILED') {
          setProcessing(false);
          toast({
            title: "Bulk Processing Failed",
            description: "Some certificates failed to process",
            variant: "destructive"
          });
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setProcessing(false);
          toast({
            title: "Timeout",
            description: "Job is taking longer than expected. Check status later.",
            variant: "destructive"
          });
        }
      } catch (error) {
        setProcessing(false);
        toast({
          title: "Error",
          description: "Failed to check job status",
          variant: "destructive"
        });
      }
    };

    poll();
  };

  const downloadTemplate = () => {
    const template = 'Student Name,Student Email,Course Name,Course Code,Grade,Completion Date\nJohn Doe,john@example.com,Mathematics 101,MATH101,A,2024-01-15\nJane Smith,jane@example.com,Physics 201,PHYS201,B+,2024-01-15';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_certificates_template.csv';
    a.click();
  };

  const downloadResults = () => {
    if (!result) return;
    
    const csv = [
      'Index,Status,Certificate ID,Error',
      ...result.results.map(r => 
        `${r.index},${r.success ? 'Success' : 'Failed'},${r.certificateId || ''},${r.error || ''}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_results_${result.batchId}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Batch Signing Status Banner */}
      {!checkingStatus && (
        <Alert className={batchSigningEnabled ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
          {batchSigningEnabled ? (
            <>
              <Zap className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Batch Signing Enabled</strong>
                    <p className="text-sm mt-1">
                      Bulk issuance will be processed automatically with your stored private key. 
                      100 certificates will complete in ~2-3 minutes.
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 ml-4">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </AlertDescription>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Batch Signing Disabled</strong>
                    <p className="text-sm mt-1">
                      Enable batch signing in settings for 6-8x faster bulk issuance with automatic transaction signing.
                    </p>
                  </div>
                  <Link to="/institution/settings">
                    <Button variant="outline" size="sm" className="ml-4">
                      <Settings className="w-4 h-4 mr-2" />
                      Enable in Settings
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Certificate Issuance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            
            <div className="flex-1">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button asChild variant="outline">
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </label>
              </Button>
            </div>
          </div>

          {csvData.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  {csvData.length} certificates loaded and ready for processing
                </p>
              </div>
              
              <Button 
                onClick={processBulkIssuance} 
                disabled={processing}
                className="w-full"
              >
                {processing ? 'Processing...' : `Issue ${csvData.length} Certificates`}
              </Button>
            </div>
          )}

          {processing && (
            <div className="space-y-2">
              <Progress value={50} />
              <p className="text-sm text-gray-600">Processing certificates...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Bulk Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.summary.successful}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.summary.total}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>

            <Button onClick={downloadResults} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Detailed Results
            </Button>

            {result.summary.failed > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Some certificates failed to process</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Download the detailed results to see specific error messages.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
