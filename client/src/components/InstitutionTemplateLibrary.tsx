import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Award, 
  Crown, 
  Star, 
  Download, 
  Eye, 
  Play,
  Settings,
  Plus,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Users,
  TrendingUp,
  Zap,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  BarChart3,
  FileText,
  CheckCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PurchasedTemplate {
  id: string;
  templateId: string;
  title: string;
  designer: string;
  category: string;
  purchaseDate: string;
  price: number;
  thumbnail: string;
  usage: {
    totalIssued: number;
    lastUsed: string;
    popularFields: string[];
  };
  status: 'active' | 'archived';
  educredsIntegration: {
    templateId: string;
    lastSync: string;
    version: string;
  };
}

interface CertificateIssued {
  id: string;
  templateId: string;
  recipientName: string;
  recipientEmail: string;
  issuedDate: string;
  status: 'issued' | 'verified' | 'revoked';
  blockchainTx?: string;
  verificationUrl: string;
}

const mockPurchasedTemplates: PurchasedTemplate[] = [
  {
    id: 'purchased-1',
    templateId: 'cert-001',
    title: 'Modern Academic Certificate',
    designer: 'Sarah Chen',
    category: 'Academic',
    purchaseDate: '2024-01-15',
    price: 49.99,
    thumbnail: '/templates/academic-modern.jpg',
    usage: {
      totalIssued: 156,
      lastUsed: '2024-01-20',
      popularFields: ['studentName', 'degree', 'university']
    },
    status: 'active',
    educredsIntegration: {
      templateId: 'academic-modern-v1',
      lastSync: '2024-01-20',
      version: '1.2.0'
    }
  },
  {
    id: 'purchased-2',
    templateId: 'cert-002',
    title: 'Professional Training Certificate',
    designer: 'Alex Rodriguez',
    category: 'Professional',
    purchaseDate: '2024-01-10',
    price: 29.99,
    thumbnail: '/templates/professional-training.jpg',
    usage: {
      totalIssued: 89,
      lastUsed: '2024-01-18',
      popularFields: ['participantName', 'courseName', 'companyName']
    },
    status: 'active',
    educredsIntegration: {
      templateId: 'professional-training-v1',
      lastSync: '2024-01-18',
      version: '1.0.0'
    }
  }
];

const mockIssuedCertificates: CertificateIssued[] = [
  {
    id: 'cert-issued-1',
    templateId: 'purchased-1',
    recipientName: 'John Doe',
    recipientEmail: 'john.doe@email.com',
    issuedDate: '2024-01-20',
    status: 'verified',
    blockchainTx: '0x1234...abcd',
    verificationUrl: 'https://educreds.com/verify/cert-issued-1'
  },
  {
    id: 'cert-issued-2',
    templateId: 'purchased-1',
    recipientName: 'Jane Smith',
    recipientEmail: 'jane.smith@email.com',
    issuedDate: '2024-01-19',
    status: 'issued',
    verificationUrl: 'https://educreds.com/verify/cert-issued-2'
  }
];

export const InstitutionTemplateLibrary: React.FC = () => {
  const [purchasedTemplates, setPurchasedTemplates] = useState<PurchasedTemplate[]>(mockPurchasedTemplates);
  const [issuedCertificates, setIssuedCertificates] = useState<CertificateIssued[]>(mockIssuedCertificates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('templates');

  const filteredTemplates = purchasedTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.designer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleIssueCertificate = (templateId: string) => {
    // Navigate to certificate issuance flow
    console.log('Issue certificate with template:', templateId);
  };

  const handleViewAnalytics = (templateId: string) => {
    // Show template usage analytics
    console.log('View analytics for template:', templateId);
  };

  const totalCertificatesIssued = purchasedTemplates.reduce((sum, template) => sum + template.usage.totalIssued, 0);
  const activeTemplates = purchasedTemplates.filter(t => t.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Award className="w-8 h-8 mr-3 text-blue-600" />
                Template Library
              </h1>
              <p className="text-gray-600 mt-1">Manage your purchased certificate templates and issued certificates</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.open('/marketplace', '_blank')}>
                <Plus className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Button>
              <Button>
                <Play className="w-4 h-4 mr-2" />
                Issue Certificate
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Templates Owned</p>
                    <p className="text-2xl font-bold">{purchasedTemplates.length}</p>
                  </div>
                  <Award className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Templates</p>
                    <p className="text-2xl font-bold">{activeTemplates}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Certificates Issued</p>
                    <p className="text-2xl font-bold">{totalCertificatesIssued}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold">+23</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="issued">Issued Certificates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Templates Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-t-lg">
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <Award className="w-16 h-16 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className={template.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {template.status}
                        </Badge>
                      </div>

                      {/* EduCreds Integration Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-blue-500 text-white">
                          <Zap className="w-3 h-3 mr-1" />
                          EduCreds
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{template.title}</h3>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        by {template.designer} • {template.category}
                      </div>

                      {/* Usage Stats */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">{template.usage.totalIssued}</div>
                            <div className="text-gray-500">Certificates Issued</div>
                          </div>
                          <div>
                            <div className="font-medium">{new Date(template.usage.lastUsed).toLocaleDateString()}</div>
                            <div className="text-gray-500">Last Used</div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleIssueCertificate(template.id)}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Issue
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleViewAnalytics(template.id)}>
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* EduCreds Integration Info */}
                      <div className="mt-3 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>Version: {template.educredsIntegration.version}</span>
                          <span>Synced: {new Date(template.educredsIntegration.lastSync).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-24 h-18 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-xl mb-1">{template.title}</h3>
                              <p className="text-gray-600 mb-2">by {template.designer} • {template.category}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{template.usage.totalIssued} certificates issued</span>
                                <span>Last used: {new Date(template.usage.lastUsed).toLocaleDateString()}</span>
                                <span>Purchased: {new Date(template.purchaseDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge className={template.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                {template.status}
                              </Badge>
                              <Badge className="bg-blue-500 text-white">
                                <Zap className="w-3 h-3 mr-1" />
                                EduCreds
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" onClick={() => handleIssueCertificate(template.id)}>
                                <Play className="w-4 h-4 mr-2" />
                                Issue Certificate
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleViewAnalytics(template.id)}>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Analytics
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                              </Button>
                            </div>
                            
                            <div className="text-sm text-gray-500">
                              Version: {template.educredsIntegration.version}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="issued" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recently Issued Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issuedCertificates.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{cert.recipientName}</div>
                        <div className="text-sm text-gray-600">{cert.recipientEmail}</div>
                        <div className="text-xs text-gray-500">
                          Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className={
                          cert.status === 'verified' ? 'bg-green-500' :
                          cert.status === 'issued' ? 'bg-blue-500' : 'bg-red-500'
                        }>
                          {cert.status}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Usage Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {purchasedTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{template.title}</div>
                          <div className="text-sm text-gray-600">{template.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{template.usage.totalIssued}</div>
                          <div className="text-sm text-gray-500">certificates</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Issuance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Chart placeholder - Integration with your analytics system
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstitutionTemplateLibrary;