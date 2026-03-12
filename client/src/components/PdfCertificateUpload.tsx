import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';
import { auth } from '@/lib/auth';

interface UploadedPdf {
  uploadId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

interface StudentData {
  name: string;
  email: string;
  studentId: string;
  courseName: string;
  courseCode?: string;
}

export const PdfCertificateUpload: React.FC = () => {
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>([]);
  const [studentData, setStudentData] = useState<StudentData>({
    name: '',
    email: '',
    studentId: '',
    courseName: '',
    courseCode: ''
  });
  const [selectedPdf, setSelectedPdf] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const { toast } = useToast();

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file only",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const institutionId = auth.getUser()?.sub || '';

      const response = await fetch(`${API_CONFIG.CERT}/api/v1/standard/certificates/upload-pdf`, {
        method: 'POST',
        headers: {
          ...(institutionId ? { 'x-institution-id': institutionId } : {})
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setUploadedPdfs(prev => [...prev, data.data]);
        toast({
          title: "PDF Uploaded",
          description: `${file.name} uploaded successfully`
        });
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const issueCertificateWithPdf = async () => {
    if (!selectedPdf || !studentData.name || !studentData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields and select a PDF",
        variant: "destructive"
      });
      return;
    }

    setIssuing(true);
    try {
      const institutionId = auth.getUser()?.sub || '';
      const response = await fetch(`${API_CONFIG.CERT}/api/v1/standard/certificates/issue-with-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(institutionId ? { 'x-institution-id': institutionId } : {})
        },
        body: JSON.stringify({
          pdfUploadId: selectedPdf,
          student: {
            name: studentData.name,
            email: studentData.email,
            id: studentData.studentId
          },
          course: {
            name: studentData.courseName,
            code: studentData.courseCode
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Certificate Issued",
          description: `Certificate issued successfully for ${studentData.name}`
        });
        
        // Reset form
        setStudentData({
          name: '',
          email: '',
          studentId: '',
          courseName: '',
          courseCode: ''
        });
        setSelectedPdf('');
      } else {
        throw new Error(data.error?.message || 'Issuance failed');
      }
    } catch (error) {
      toast({
        title: "Issuance Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIssuing(false);
    }
  };

  const removePdf = (uploadId: string) => {
    setUploadedPdfs(prev => prev.filter(pdf => pdf.uploadId !== uploadId));
    if (selectedPdf === uploadId) {
      setSelectedPdf('');
    }
  };

  return (
    <div className="space-y-6">
      {/* PDF Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Certificate PDFs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="pdf-upload"
                disabled={uploading}
              />
              <Button asChild variant="outline" disabled={uploading}>
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </label>
              </Button>
            </div>

            {/* Uploaded PDFs List */}
            {uploadedPdfs.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded PDFs:</Label>
                {uploadedPdfs.map((pdf) => (
                  <div
                    key={pdf.uploadId}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPdf === pdf.uploadId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedPdf(pdf.uploadId)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium">{pdf.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {selectedPdf === pdf.uploadId && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePdf(pdf.uploadId);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Student & Course Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="studentName">Student Name *</Label>
              <Input
                id="studentName"
                value={studentData.name}
                onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter student name"
              />
            </div>
            
            <div>
              <Label htmlFor="studentEmail">Student Email *</Label>
              <Input
                id="studentEmail"
                type="email"
                value={studentData.email}
                onChange={(e) => setStudentData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter student email"
              />
            </div>
            
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={studentData.studentId}
                onChange={(e) => setStudentData(prev => ({ ...prev, studentId: e.target.value }))}
                placeholder="Enter student ID"
              />
            </div>
            
            <div>
              <Label htmlFor="courseName">Course Name</Label>
              <Input
                id="courseName"
                value={studentData.courseName}
                onChange={(e) => setStudentData(prev => ({ ...prev, courseName: e.target.value }))}
                placeholder="Enter course name"
              />
            </div>
            
            <div>
              <Label htmlFor="courseCode">Course Code</Label>
              <Input
                id="courseCode"
                value={studentData.courseCode}
                onChange={(e) => setStudentData(prev => ({ ...prev, courseCode: e.target.value }))}
                placeholder="Enter course code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue Certificate Button */}
      <Button
        onClick={issueCertificateWithPdf}
        disabled={!selectedPdf || !studentData.name || !studentData.email || issuing}
        className="w-full"
        size="lg"
      >
        {issuing ? 'Issuing Certificate...' : 'Issue Certificate with PDF'}
      </Button>
    </div>
  );
};
