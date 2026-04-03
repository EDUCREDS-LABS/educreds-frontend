import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Edit, Trash2, CheckCircle, XCircle, Lock, Search, Filter } from 'lucide-react';
import { API_CONFIG } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';

interface Certificate {
  id: string;
  studentName: string;
  courseName: string;
  grade: string;
  issueDate: string;
  status: 'active' | 'revoked' | 'expired';
  templateUsed?: string;
  verificationCount: number;
}

interface Template {
  id: string;
  name: string;
  type: string;
  version: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'frozen';
  usageCount: number;
  createdAt: string;
  submittedBy: string;
  rejectionReason?: string;
}

export const CertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchCertificates();
    fetchTemplates();
  }, []);

  const fetchCertificates = async () => {
    // Mock data - replace with actual API call
    setCertificates([
      {
        id: 'cert_001',
        studentName: 'John Doe',
        courseName: 'Advanced Mathematics',
        grade: 'A',
        issueDate: '2024-01-15',
        status: 'active',
        templateUsed: 'Math Template v1.0',
        verificationCount: 12
      }
    ]);
  };

  const fetchTemplates = async () => {
    // Mock data - replace with actual API call
    setTemplates([
      {
        id: 'template_001',
        name: 'Mathematics Certificate',
        type: 'certificate',
        version: 'v1.0',
        status: 'pending_approval',
        usageCount: 0,
        createdAt: '2024-01-10',
        submittedBy: 'University of Science'
      }
    ]);
  };

  const approveTemplate = async (templateId: string) => {
    try {
      await fetch(`${API_CONFIG.MAIN}/api/admin/templates/${templateId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to approve template:', error);
    }
  };

  const rejectTemplate = async (templateId: string, reason: string) => {
    try {
      await fetch(`${API_CONFIG.MAIN}/api/admin/templates/${templateId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      fetchTemplates();
      setSelectedTemplate(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject template:', error);
    }
  };

  const revokeCertificate = async (certificateId: string) => {
    try {
      await fetch(`${API_CONFIG.CERT}/api/certificates/${certificateId}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      fetchCertificates();
    } catch (error) {
      console.error('Failed to revoke certificate:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
      revoked: { label: 'Revoked', className: 'bg-red-100 text-red-800 border-red-200' },
      expired: { label: 'Expired', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      pending_approval: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
      frozen: { label: 'Frozen', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingTemplates = templates.filter(t => t.status === 'pending_approval');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-gray-600 mt-2">
            Manage certificates, templates, and approval workflows
          </p>
        </div>

        <Tabs defaultValue="certificates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="templates">Template Approval</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Certificate Registry</CardTitle>
                  <div className="flex gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search certificates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verifications</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-sm">{cert.id}</TableCell>
                        <TableCell>{cert.studentName}</TableCell>
                        <TableCell>{cert.courseName}</TableCell>
                        <TableCell>{cert.grade}</TableCell>
                        <TableCell>{cert.issueDate}</TableCell>
                        <TableCell>{getStatusBadge(cert.status)}</TableCell>
                        <TableCell>{cert.verificationCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {cert.status === 'active' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => revokeCertificate(cert.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Template Approvals</CardTitle>
                  <p className="text-sm text-gray-600">
                    Review and approve template submissions from institutions
                  </p>
                </CardHeader>
                <CardContent>
                  {pendingTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No templates pending approval
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Template Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Submitted By</TableHead>
                          <TableHead>Submitted Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingTemplates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>{template.type}</TableCell>
                            <TableCell>{template.version}</TableCell>
                            <TableCell>{template.submittedBy}</TableCell>
                            <TableCell>{template.createdAt}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => approveTemplate(template.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedTemplate(template)}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Template</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <p>Provide a reason for rejecting this template:</p>
                                      <Textarea
                                        placeholder="Enter rejection reason..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline">Cancel</Button>
                                        <Button 
                                          variant="destructive"
                                          onClick={() => selectedTemplate && rejectTemplate(selectedTemplate.id, rejectionReason)}
                                        >
                                          Reject Template
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>{template.type}</TableCell>
                          <TableCell>{template.version}</TableCell>
                          <TableCell>{getStatusBadge(template.status)}</TableCell>
                          <TableCell>{template.usageCount}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {template.status === 'approved' && template.usageCount > 0 && (
                                <Button variant="outline" size="sm">
                                  <Lock className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12,847</div>
                  <p className="text-sm text-gray-600">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">23</div>
                  <p className="text-sm text-gray-600">3 pending approval</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">94.2%</div>
                  <p className="text-sm text-gray-600">+2.1% from last month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CertificateManagement;
