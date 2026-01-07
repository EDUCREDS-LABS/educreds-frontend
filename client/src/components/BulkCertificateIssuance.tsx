import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
      const response = await fetch('/api/v1/standard/certificates/issue/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Institution-ID': 'your-institution-id' // Get from auth context
        },
        body: JSON.stringify({
          certificates: csvData.map(cert => ({
            student: {
              id: cert.studentEmail,
              name: cert.studentName,
              email: cert.studentEmail
            },
            course: {
              name: cert.courseName,
              code: cert.courseCode
            },
            achievement: {
              grade: cert.grade,
              completionDate: cert.completionDate,
              certificateType: 'completion'
            }
          }))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        toast({
          title: "Bulk Processing Complete",
          description: `${data.data.summary.successful}/${data.data.summary.total} certificates issued successfully`
        });
      } else {
        throw new Error(data.error?.message || 'Bulk processing failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
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