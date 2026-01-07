import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateDesigner } from '../components/TemplateDesigner';
import { Upload, Eye, Edit, Trash2, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  type: 'certificate' | 'transcript' | 'diploma' | 'badge';
  version: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'frozen';
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDesigner, setShowDesigner] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'certificate' as const,
    pdfFile: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setNewTemplate(prev => ({ ...prev, pdfFile: file }));
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.pdfFile) {
      toast({
        title: "Missing Information",
        description: "Please provide template name and PDF file",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newTemplate.name);
      formData.append('type', newTemplate.type);
      formData.append('pdf', newTemplate.pdfFile);

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedTemplate(data.template);
        setShowDesigner(true);
        toast({
          title: "Template Created",
          description: "Template uploaded successfully. Now configure field mappings."
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const submitForApproval = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/submit`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchTemplates();
        toast({
          title: "Submitted for Approval",
          description: "Template submitted for admin approval"
        });
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const approveTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchTemplates();
        toast({
          title: "Template Approved",
          description: "Template approved and ready for use"
        });
      }
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const rejectTemplate = async (templateId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        fetchTemplates();
        toast({
          title: "Template Rejected",
          description: "Template rejected with feedback"
        });
      }
    } catch (error) {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const freezeTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/freeze`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchTemplates();
        toast({
          title: "Template Frozen",
          description: "Template frozen and cannot be modified"
        });
      }
    } catch (error) {
      toast({
        title: "Freeze Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      pending_approval: 'default',
      approved: 'default',
      rejected: 'destructive',
      frozen: 'outline'
    };

    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      frozen: 'bg-blue-100 text-blue-800'
    };

    return (
      <Badge className={colors[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (showDesigner && selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Template Designer</h1>
              <p className="text-gray-600">Configure field mappings for {selectedTemplate.name}</p>
            </div>
            <Button variant="outline" onClick={() => setShowDesigner(false)}>
              Back to Templates
            </Button>
          </div>
          
          <TemplateDesigner
            pdfUrl={`/api/templates/${selectedTemplate.id}/pdf`}
            onSave={(fields) => {
              // Save field mappings
              console.log('Saving field mappings:', fields);
              setShowDesigner(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Template Management</h1>
          <p className="text-gray-600">Create and manage certificate templates</p>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates">My Templates</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <div className="grid gap-4">
              {templates.map(template => (
                <Card key={template.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold">{template.name}</h3>
                          <p className="text-sm text-gray-600">
                            {template.type} • {template.version} • Used {template.usageCount} times
                          </p>
                        </div>
                        {getStatusBadge(template.status)}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        
                        {template.status === 'draft' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowDesigner(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => submitForApproval(template.id)}
                            >
                              Submit for Approval
                            </Button>
                          </>
                        )}
                        
                        {template.status === 'approved' && template.usageCount === 0 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => freezeTemplate(template.id)}
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Freeze
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {template.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {template.rejectionReason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="templateType">Template Type</Label>
                  <Select
                    value={newTemplate.type}
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="transcript">Transcript</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="badge">Badge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="pdfUpload">Upload PDF Template</Label>
                  <input
                    id="pdfUpload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <Button onClick={createTemplate} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pending Approvals</h3>
              {templates.filter(t => t.status === 'pending_approval').map(template => (
                <Card key={template.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.type} • {template.version}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => approveTemplate(template.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => rejectTemplate(template.id, 'Template does not meet requirements')}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TemplateManagement;