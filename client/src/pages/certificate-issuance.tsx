import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Zap, Settings, Users, BarChart3 } from 'lucide-react';
import { BulkCertificateIssuance } from '../components/BulkCertificateIssuance';
import { PdfCertificateUpload } from '../components/PdfCertificateUpload';
import { TemplateDesigner } from '../components/TemplateDesigner';

interface Template {
  id: string;
  name: string;
  type: string;
  status: 'approved' | 'draft' | 'pending';
  usageCount: number;
}

interface IssuanceStats {
  totalCertificates: number;
  thisMonth: number;
  templates: number;
  successRate: number;
}

export const CertificateIssuanceDashboard: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState<IssuanceStats>({
    totalCertificates: 0,
    thisMonth: 0,
    templates: 0,
    successRate: 0
  });
  const [selectedMethod, setSelectedMethod] = useState<'quick' | 'template' | 'bulk' | 'pdf'>('quick');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [templatesRes, statsRes] = await Promise.all([
        fetch('/api/templates?status=approved'),
        fetch('/api/certificates/stats')
      ]);
      
      const templatesData = await templatesRes.json();
      const statsData = await statsRes.json();
      
      setTemplates(templatesData.templates || []);
      setStats(statsData.stats || stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const issuanceMethodCards = [
    {
      id: 'quick',
      title: 'Quick Issuance',
      description: 'Issue single certificates with default template',
      icon: <Zap className="h-6 w-6" />,
      color: 'border-gray-200 hover:border-blue-300',
      recommended: false
    },
    {
      id: 'template',
      title: 'Template-Based',
      description: 'Use custom PDF templates with field mapping',
      icon: <FileText className="h-6 w-6" />,
      color: 'border-gray-200 hover:border-green-300',
      recommended: true
    },
    {
      id: 'bulk',
      title: 'Bulk Issuance',
      description: 'Upload CSV for multiple certificates',
      icon: <Users className="h-6 w-6" />,
      color: 'border-gray-200 hover:border-purple-300',
      recommended: false
    },
    {
      id: 'pdf',
      title: 'PDF Upload',
      description: 'Upload pre-made certificate PDFs',
      icon: <Upload className="h-6 w-6" />,
      color: 'border-gray-200 hover:border-orange-300',
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Certificate Issuance</h1>
          <p className="text-gray-600 mt-2">
            Choose your preferred method to issue certificates
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCertificates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.templates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issuance Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {issuanceMethodCards.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedMethod === method.id ? 'ring-2 ring-blue-500' : ''
              } ${method.color}`}
              onClick={() => setSelectedMethod(method.id as any)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  {method.icon}
                  {method.recommended && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Recommended
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-sm text-gray-600">{method.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Issuance Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {issuanceMethodCards.find(m => m.id === selectedMethod)?.icon}
              {issuanceMethodCards.find(m => m.id === selectedMethod)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMethod === 'quick' && <QuickIssuanceForm />}
            {selectedMethod === 'template' && <TemplateBasedIssuance templates={templates} />}
            {selectedMethod === 'bulk' && <BulkCertificateIssuance />}
            {selectedMethod === 'pdf' && <PdfCertificateUpload />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Quick Issuance Component
const QuickIssuanceForm: React.FC = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    courseName: '',
    grade: '',
    completionDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/v1/standard/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Institution-ID': 'your-institution-id'
        },
        body: JSON.stringify({
          student: {
            id: formData.studentEmail,
            name: formData.studentName
          },
          course: {
            name: formData.courseName
          },
          achievement: {
            grade: formData.grade,
            completionDate: formData.completionDate,
            certificateType: 'completion'
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Certificate issued successfully!');
        setFormData({
          studentName: '',
          studentEmail: '',
          courseName: '',
          grade: '',
          completionDate: ''
        });
      }
    } catch (error) {
      alert('Failed to issue certificate');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student Name
          </label>
          <input
            type="text"
            value={formData.studentName}
            onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student Email
          </label>
          <input
            type="email"
            value={formData.studentEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, studentEmail: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Name
          </label>
          <input
            type="text"
            value={formData.courseName}
            onChange={(e) => setFormData(prev => ({ ...prev, courseName: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade
          </label>
          <input
            type="text"
            value={formData.grade}
            onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completion Date
          </label>
          <input
            type="date"
            value={formData.completionDate}
            onChange={(e) => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full">
        Issue Certificate
      </Button>
    </form>
  );
};

// Template-Based Issuance Component
const TemplateBasedIssuance: React.FC<{ templates: Template[] }> = ({ templates }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Template
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md"
        >
          <option value="">Choose a template...</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.type}) - Used {template.usageCount} times
            </option>
          ))}
        </select>
      </div>
      
      {selectedTemplate ? (
        <QuickIssuanceForm />
      ) : (
        <div className="text-center py-8 text-gray-500">
          Select a template to continue with certificate issuance
        </div>
      )}
    </div>
  );
};

export default CertificateIssuanceDashboard;