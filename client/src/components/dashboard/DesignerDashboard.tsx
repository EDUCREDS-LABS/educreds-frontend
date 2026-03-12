import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical, 
  TrendingUp, 
  DollarSign,
  Users,
  Star,
  Calendar,
  BarChart3,
  Palette,
  Upload,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedTemplate } from '@/store/editorStore';
import { API_CONFIG } from '@/config/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DesignerDashboardProps {
  designerId: string;
}

interface Analytics {
  totalTemplates: number;
  publishedTemplates: number;
  unpublishedTemplates: number;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  topSellingTemplate: EnhancedTemplate | null;
  monthlyRevenue: Array<{ month: string; revenue: number; sales: number }>;
  templatePerformance: Array<{ name: string; sales: number; revenue: number; views: number }>;
}

export function DesignerDashboard({ designerId }: DesignerDashboardProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EnhancedTemplate[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [designerId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load templates
      const templatesResponse = await fetch(`${API_CONFIG.MARKETPLACE}/marketplace/designer/${designerId}/templates`);
      const templatesData = await templatesResponse.json();
      
      if (templatesResponse.ok) {
        const resolvedTemplates = Array.isArray(templatesData) ? templatesData : (templatesData.templates || []);
        setTemplates(resolvedTemplates.map((t: any) => ({ ...t, name: t.name || t.title })));
      }
      
      // Load analytics
      const analyticsResponse = await fetch(`${API_CONFIG.MARKETPLACE}/marketplace/analytics/designer/${designerId}`);
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsResponse.ok) {
        const totalRevenue = analyticsData?.revenue?.total || 0;
        const totalSales = analyticsData?.revenue?.transactions || 0;
        const stats = analyticsData?.templates?.stats || [];
        setAnalytics({
          totalTemplates: analyticsData?.templates?.total || 0,
          totalRevenue,
          totalSales,
          averagePrice: totalSales > 0 ? totalRevenue / totalSales : 0,
          monthlyRevenue: [],
          topTemplates: stats.map((t: any) => ({
            name: t.title,
            sales: t.purchaseCount,
            revenue: 0,
          })),
          templatePerformance: stats.map((t: any) => ({
            name: t.title,
            sales: t.purchaseCount,
            revenue: 0,
            views: t.viewCount,
          })),
        });
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

  const handlePublishTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.MARKETPLACE}/marketplace/designer/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      
      if (response.ok) {
        toast({
          title: 'Template Published',
          description: 'Your template is now available in the marketplace',
        });
        loadDashboardData();
      } else {
        throw new Error('Failed to publish template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish template',
        variant: 'destructive',
      });
    }
  };

  const handleUnpublishTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.MARKETPLACE}/marketplace/designer/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      
      if (response.ok) {
        toast({
          title: 'Template Unpublished',
          description: 'Your template has been removed from the marketplace',
        });
        loadDashboardData();
      } else {
        throw new Error('Failed to unpublish template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unpublish template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_CONFIG.MARKETPLACE}/marketplace/designer/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      
      if (response.ok) {
        toast({
          title: 'Template Archived',
          description: 'Template has been archived',
        });
        loadDashboardData();
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Designer Dashboard</h1>
          <p className="text-gray-600">Manage your templates and track your performance</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Palette className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Price</p>
                  <p className="text-2xl font-bold text-gray-900">${analytics.averagePrice.toFixed(2)}</p>
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
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Published</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={(analytics?.publishedTemplates || 0) / (analytics?.totalTemplates || 1) * 100} className="w-20" />
                      <span className="text-sm text-gray-600">{analytics?.publishedTemplates || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Draft</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={(analytics?.unpublishedTemplates || 0) / (analytics?.totalTemplates || 1) * 100} className="w-20" />
                      <span className="text-sm text-gray-600">{analytics?.unpublishedTemplates || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Template</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topSellingTemplate ? (
                  <div className="space-y-3">
                    <h4 className="font-medium">{analytics.topSellingTemplate.name}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{analytics.topSellingTemplate.salesCount} sales</span>
                      <span>${analytics.topSellingTemplate.price || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{analytics.topSellingTemplate.averageRating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No sales yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.slice(0, 5).map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                        {template.previewImages?.thumbnail ? (
                          <img
                            src={template.previewImages.thumbnail}
                            alt={template.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Palette className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600">
                          {template.salesCount || 0} sales {template.viewCount || 0} views
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={template.isPublished ? 'default' : 'secondary'}>
                        {template.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Templates</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden">
                    {template.previewImages?.thumbnail ? (
                      <img
                        src={template.previewImages.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Palette className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium line-clamp-1">{template.name}</h3>
                      <Badge variant={template.isPublished ? 'default' : 'secondary'}>
                        {template.isPublished ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{template.salesCount || 0} sales</span>
                      <span>${template.price || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => template.isPublished ? handleUnpublishTemplate(template.id!) : handlePublishTemplate(template.id!)}
                      >
                        {template.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Template Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.templatePerformance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Designer Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Designer settings and preferences will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
