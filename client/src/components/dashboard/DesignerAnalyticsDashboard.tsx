import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { marketplaceService, DesignerAnalytics, TemplateAnalytics } from '@/lib/marketplaceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Star,
  Eye,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface SalesData {
  date: string;
  sales: number;
  revenue: number;
}

interface TemplatePerformance {
  template: any;
  views: number;
  downloads: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

export function DesignerAnalyticsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<DesignerAnalytics | null>(null);
  const [templateAnalytics, setTemplateAnalytics] = useState<TemplateAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [templatePerformance, setTemplatePerformance] = useState<TemplatePerformance[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [user?.id, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, templatesData] = await Promise.all([
        marketplaceService.getDesignerAnalytics(user!.id),
        marketplaceService.getDesignerTemplates(user!.id)
      ]);
      
      setAnalytics(analyticsData);
      
      // Load individual template analytics
      const templateAnalyticsPromises = templatesData.map(template => 
        marketplaceService.getTemplateAnalytics(template.id).catch(() => null)
      );
      const templateAnalyticsResults = await Promise.all(templateAnalyticsPromises);
      setTemplateAnalytics(templateAnalyticsResults.filter((item): item is TemplateAnalytics => item !== null));
      
      // Generate mock sales data (in a real app, this would come from the backend)
      setSalesData(generateMockSalesData(timeRange));
      
      // Calculate template performance
      const performance = templatesData.map(template => {
        const analytics = templateAnalyticsResults.find(ta => ta?.template.id === template.id);
        return {
          template,
          views: analytics?.template.viewCount || 0,
          downloads: analytics?.template.downloadCount || 0,
          sales: template.salesCount,
          revenue: template.salesCount * (template.price || 0),
          conversionRate: analytics?.template.viewCount ? (template.salesCount / analytics.template.viewCount) * 100 : 0
        };
      });
      setTemplatePerformance(performance);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockSalesData = (range: string): SalesData[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data: SalesData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 10) + 1,
        revenue: Math.floor(Math.random() * 500) + 50
      });
    }
    
    return data;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Start creating and publishing templates to see your analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Track your template performance and sales</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Templates</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.publishedTemplates}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.unpublishedTemplates} drafts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averagePrice.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per template
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily sales and revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Template */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Template</CardTitle>
            <CardDescription>Top performing templates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={templatePerformance.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="template.name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Template Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Template Performance</CardTitle>
          <CardDescription>Detailed analytics for each template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templatePerformance.map((performance) => (
              <div key={performance.template.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{performance.template.name}</h4>
                  <p className="text-sm text-gray-600">{performance.template.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {performance.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {performance.downloads} downloads
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {performance.sales} sales
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${performance.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {performance.conversionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">conversion</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Template */}
      {analytics.topSellingTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Template</CardTitle>
            <CardDescription>Your best performing template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{analytics.topSellingTemplate.name}</h4>
                <p className="text-sm text-gray-600">{analytics.topSellingTemplate.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary">
                    {analytics.topSellingTemplate.salesCount} sales
                  </Badge>
                  <Badge variant="outline">
                    ${analytics.topSellingTemplate.price || 0}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
