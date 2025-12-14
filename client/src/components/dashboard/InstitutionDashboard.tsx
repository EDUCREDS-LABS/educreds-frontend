import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Plus, 
  Users, 
  FileText, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedTemplate } from '@/store/editorStore';
import { BulkIssuanceForm } from '../issuance/BulkIssuanceForm';

interface InstitutionDashboardProps {
  institutionId: string;
}

interface Purchase {
  id: string;
  template: EnhancedTemplate;
  purchasedAt: string;
  pricePaid: number;
  usageCount: number;
  maxUses?: number;
}

interface IssuanceStats {
  totalIssued: number;
  thisMonth: number;
  pendingIssuance: number;
  completedIssuance: number;
}

export function InstitutionDashboard({ institutionId }: InstitutionDashboardProps) {
  const { toast } = useToast();
  const [purchasedTemplates, setPurchasedTemplates] = useState<Purchase[]>([]);
  const [issuanceStats, setIssuanceStats] = useState<IssuanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedTemplate | null>(null);
  const [showBulkIssuance, setShowBulkIssuance] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [institutionId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load purchased templates
      const templatesResponse = await fetch(`/api/marketplace/institution/${institutionId}/purchases`);
      const templatesData = await templatesResponse.json();
      
      if (templatesResponse.ok) {
        setPurchasedTemplates(templatesData.purchases);
      }
      
      // Load issuance stats
      const statsResponse = await fetch(`/api/issuance/institution/${institutionId}/stats`);
      const statsData = await statsResponse.json();
      
      if (statsResponse.ok) {
        setIssuanceStats(statsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: EnhancedTemplate) => {
    setSelectedTemplate(template);
    setShowBulkIssuance(true);
  };

  const handleBulkIssuanceComplete = (results: any) => {
    setShowBulkIssuance(false);
    setSelectedTemplate(null);
    loadDashboardData(); // Refresh stats
    toast({
      title: 'Bulk Issuance Complete',
      description: `${results.completed} certificates issued successfully`,
    });
  };

  const filteredTemplates = purchasedTemplates.filter(purchase =>
    purchase.template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (showBulkIssuance) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Certificate Issuance</h1>
            <p className="text-gray-600">Issue certificates to multiple recipients at once</p>
          </div>
          <Button variant="outline" onClick={() => setShowBulkIssuance(false)}>
            Back to Dashboard
          </Button>
        </div>
        
        <BulkIssuanceForm
          selectedTemplate={selectedTemplate}
          onTemplateSelect={() => setShowBulkIssuance(false)}
          onIssuanceComplete={handleBulkIssuanceComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Institution Dashboard</h1>
          <p className="text-gray-600">Manage your certificate templates and issuance</p>
        </div>
        <Button onClick={() => setShowBulkIssuance(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Bulk Issuance
        </Button>
      </div>

      {/* Stats Overview */}
      {issuanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Issued</p>
                  <p className="text-2xl font-bold text-gray-900">{issuanceStats.totalIssued}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{issuanceStats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{issuanceStats.pendingIssuance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{issuanceStats.completedIssuance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">My Templates</TabsTrigger>
          <TabsTrigger value="issuance">Issuance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowBulkIssuance(true)}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium mb-2">Bulk Issuance</h3>
                <p className="text-sm text-gray-600">Issue certificates to multiple recipients</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium mb-2">Single Issuance</h3>
                <p className="text-sm text-gray-600">Issue a certificate to one recipient</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium mb-2">View Analytics</h3>
                <p className="text-sm text-gray-600">Track your issuance performance</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchasedTemplates.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-8 bg-gray-100 rounded flex items-center justify-center">
                        {purchase.template.previewImages?.thumbnail ? (
                          <img
                            src={purchase.template.previewImages.thumbnail}
                            alt={purchase.template.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{purchase.template.name}</h4>
                        <p className="text-sm text-gray-600">
                          Used {purchase.usageCount} times
                          {purchase.maxUses && ` of ${purchase.maxUses}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {new Date(purchase.purchasedAt).toLocaleDateString()}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleTemplateSelect(purchase.template)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((purchase) => (
              <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden">
                    {purchase.template.previewImages?.thumbnail ? (
                      <img
                        src={purchase.template.previewImages.thumbnail}
                        alt={purchase.template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium line-clamp-1">{purchase.template.name}</h3>
                      <Badge variant="outline">
                        {purchase.usageCount}/{purchase.maxUses || 'âˆž'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {purchase.template.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>Purchased {new Date(purchase.purchasedAt).toLocaleDateString()}</span>
                      <span>${purchase.pricePaid}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleTemplateSelect(purchase.template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'You haven\'t purchased any templates yet'}
              </p>
              <Button>Browse Marketplace</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="issuance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Issuance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Issue Certificates?</h3>
                <p className="text-gray-600 mb-4">Choose from your purchased templates to start issuing certificates</p>
                <Button onClick={() => setShowBulkIssuance(true)}>
                  Start Bulk Issuance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issuance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Analytics dashboard coming soon</p>
                <p className="text-sm">Track your certificate issuance performance and insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
