import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { marketplaceService } from '@/lib/marketplaceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Plus, 
  TrendingUp, 
  Package, 
  Calendar,
  Star,
  Users,
  ShoppingCart
} from 'lucide-react';
import { TemplateCard } from '@/components/marketplace/TemplateCard';

interface PurchasedTemplate {
  id: string;
  templateId: string;
  template: any;
  purchasedAt: string;
  pricePaid: number;
  currency: string;
  licenseDetails: any;
}

export function InstitutionMarketplaceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchasedTemplates, setPurchasedTemplates] = useState<PurchasedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalSpent: 0,
    recentPurchases: 0,
    mostUsed: null as any
  });

  useEffect(() => {
    if (user?.id) {
      loadPurchasedTemplates();
    }
  }, [user?.id]);

  const loadPurchasedTemplates = async () => {
    try {
      setLoading(true);
      const purchases = await marketplaceService.getPurchases(user!.id);
      setPurchasedTemplates(purchases);
      
      // Calculate stats
      const totalSpent = purchases.reduce((sum: number, purchase: PurchasedTemplate) => 
        sum + purchase.pricePaid, 0
      );
      
      const recentPurchases = purchases.filter((purchase: PurchasedTemplate) => {
        const purchaseDate = new Date(purchase.purchasedAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return purchaseDate > thirtyDaysAgo;
      }).length;

      const mostUsed = purchases.reduce((most: any, current: PurchasedTemplate) => {
        const currentUsage = current.licenseDetails?.usageCount || 0;
        const mostUsage = most?.licenseDetails?.usageCount || 0;
        return currentUsage > mostUsage ? current : most;
      }, null);

      setStats({
        totalTemplates: purchases.length,
        totalSpent,
        recentPurchases,
        mostUsed
      });
    } catch (error) {
      console.error('Failed to load purchased templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your purchased templates.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: any) => {
    // Navigate to certificate creation with this template
    window.location.href = `/certificates/create?template=${template.id}`;
  };

  const handleDownloadTemplate = async (template: any) => {
    try {
      // This would trigger a download of the template files
      toast({
        title: 'Download Started',
        description: `Downloading ${template.name}...`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download template.',
        variant: 'destructive',
      });
    }
  };

  const filteredTemplates = purchasedTemplates.filter(purchase => {
    const template = purchase.template;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'recent') {
      const purchaseDate = new Date(purchase.purchasedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return matchesSearch && purchaseDate > thirtyDaysAgo;
    }
    if (activeTab === 'favorites') {
      // This would be based on user favorites - for now, show all
      return matchesSearch;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Library</h2>
          <p className="text-gray-600">Manage your purchased certificate templates</p>
        </div>
        <Button onClick={() => window.location.href = '/marketplace'}>
          <Plus className="h-4 w-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              Purchased templates
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time purchases
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Purchases</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {stats.mostUsed?.template?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.mostUsed?.licenseDetails?.usageCount || 0} uses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search your templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <TemplatesGrid 
            templates={filteredTemplates}
            onUse={handleUseTemplate}
            onDownload={handleDownloadTemplate}
          />
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <TemplatesGrid 
            templates={filteredTemplates}
            onUse={handleUseTemplate}
            onDownload={handleDownloadTemplate}
          />
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <TemplatesGrid 
            templates={filteredTemplates}
            onUse={handleUseTemplate}
            onDownload={handleDownloadTemplate}
          />
        </TabsContent>
      </Tabs>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'You haven\'t purchased any templates yet'}
            </p>
            <Button onClick={() => window.location.href = '/marketplace'}>
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TemplatesGrid({ 
  templates, 
  onUse, 
  onDownload 
}: {
  templates: PurchasedTemplate[];
  onUse: (template: any) => void;
  onDownload: (template: any) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No templates found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {templates.map((purchase) => (
        <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                Purchased
              </Badge>
              <div className="text-sm text-gray-500">
                {new Date(purchase.purchasedAt).toLocaleDateString()}
              </div>
            </div>
            <CardTitle className="text-lg">{purchase.template.name}</CardTitle>
            <CardDescription>{purchase.template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price Paid:</span>
                <span className="text-sm">
                  ${purchase.pricePaid} {purchase.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Usage:</span>
                <span className="text-sm">
                  {purchase.licenseDetails?.usageCount || 0} times
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {purchase.template.tags?.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => onUse(purchase.template)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDownload(purchase.template)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
