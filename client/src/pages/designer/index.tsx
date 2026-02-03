import React, { useState, useEffect } from 'react';
import { useMarketplaceAuth } from '@/hooks/useMarketplaceAuth';
import { useAuth } from '@/hooks/useAuth';
import { marketplaceService, TemplateListingItem, DesignerAnalytics } from '@/lib/marketplaceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Eye, Edit, Trash2, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { TemplateEditor } from '@/components/marketplace/TemplateEditor';
import { DesignerAnalyticsDashboard } from '@/components/dashboard/DesignerAnalyticsDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

export default function DesignerDashboard() {
  const { user } = useMarketplaceAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateListingItem[]>([]);
  const [analytics, setAnalytics] = useState<DesignerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateListingItem | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateListingItem | null>(null);
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    if (user?.id) {
      loadDesignerData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadDesignerData = async () => {
    try {
      const [templatesData, analyticsData] = await Promise.all([
        marketplaceService.getDesignerTemplates(user!.id),
        marketplaceService.getDesignerAnalytics(user!.id)
      ]);
      setTemplates(templatesData);
      setAnalytics(analyticsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load designer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load designer data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async (templateId: string) => {
    try {
      await marketplaceService.publishTemplate(templateId);
      toast({
        title: 'Success!',
        description: 'Template published successfully.',
      });
      loadDesignerData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish template.',
        variant: 'destructive',
      });
    }
  };

  const handleUnpublish = async (templateId: string) => {
    try {
      await marketplaceService.unpublishTemplate(templateId);
      toast({
        title: 'Success!',
        description: 'Template unpublished successfully.',
      });
      loadDesignerData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unpublish template.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await marketplaceService.deleteTemplate(templateId);
      toast({
        title: 'Success!',
        description: 'Template deleted successfully.',
      });
      loadDesignerData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTemplate = () => {
    // Navigate to the new editor
    window.location.href = '/designer/editor';
  };

  const handleEditTemplate = (template: TemplateListingItem) => {
    setCurrentTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      if (currentTemplate) {
        await marketplaceService.updateTemplate(currentTemplate.id, templateData);
      } else {
        await marketplaceService.createTemplate({
          ...templateData,
          creatorId: user!.id,
        });
      }
      setShowTemplateEditor(false);
      setCurrentTemplate(null);
      loadDesignerData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template.',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewTemplate = () => {
    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Template Preview</title>
            <style>${currentTemplate?.cssContent || ''}</style>
          </head>
          <body>
            ${currentTemplate?.htmlContent || '<p>No content to preview</p>'}
          </body>
        </html>
      `);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-2">Become a Designer</h1>
          <p className="text-gray-600 mb-6">Sign in to create, publish, and manage your certificate templates.</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => (window.location.href = '/login')}>Sign In</Button>
            <Button variant="outline" onClick={() => (window.location.href = '/register')}>Create Account</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Designer Dashboard</h1>
          <p className="text-gray-600">Manage your certificate templates and track your sales</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTemplates}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.publishedTemplates} published
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
                All time sales
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Average: ${analytics.averagePrice.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Seller</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {analytics.topSellingTemplate?.name || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.topSellingTemplate?.salesCount || 0} sales
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <TemplatesManagement 
            templates={templates}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onDelete={handleDelete}
            onEdit={handleEditTemplate}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <DesignerAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Settings</h3>
            <p className="text-gray-600">Designer settings coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Editor */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[95%] sm:max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {currentTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowTemplateEditor(false)}
                  aria-label="Close template editor"
                >
                   ×
                </Button>
              </div>
              <TemplateEditor
                template={currentTemplate}
                onSave={handleSaveTemplate}
                onPreview={handlePreviewTemplate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplatesManagement({ 
  templates, 
  onPublish, 
  onUnpublish, 
  onDelete, 
  onEdit 
}: {
  templates: TemplateListingItem[];
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (template: TemplateListingItem) => void;
}) {
  const [filter, setFilter] = useState('all');

  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true;
    if (filter === 'published') return template.isPublished;
    if (filter === 'drafts') return !template.isPublished;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="drafts">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600">
          {filteredTemplates.length} of {templates.length} templates
        </div>
      </div>

      <TemplatesGrid 
        templates={filteredTemplates} 
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
}

function TemplatesGrid({ 
  templates, 
  onPublish, 
  onUnpublish, 
  onDelete, 
  onEdit 
}: {
  templates: TemplateListingItem[];
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (template: TemplateListingItem) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No templates found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant={template.isPublished ? "default" : "secondary"}>
                {template.isPublished ? "Published" : "Draft"}
              </Badge>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(template)}
                  aria-label={`Edit ${template.name} template`}
                  title="Edit template"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(template.id)}
                  aria-label={`Delete ${template.name} template`}
                  title="Delete template"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Price:</span>
                <span className="text-sm">
                  {template.price ? `$${template.price}` : 'Free'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sales:</span>
                <span className="text-sm">{template.salesCount}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              {template.isPublished ? (
                <Button variant="outline" size="sm" onClick={() => onUnpublish(template.id)}>
                  Unpublish
                </Button>
              ) : (
                <Button size="sm" onClick={() => onPublish(template.id)}>
                  Publish
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CreateTemplateForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    htmlContent: '',
    cssContent: '',
    price: 0,
    currency: 'USD',
    tags: [] as string[],
    licenseType: 'unlimited',
    thumbnailUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await marketplaceService.createTemplate({
        ...formData,
        creatorId: user!.id,
        placeholders: [], // This would be populated from the template editor
      });
      toast({
        title: 'Success!',
        description: 'Template created successfully.',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="licenseType">License Type</Label>
          <Select value={formData.licenseType} onValueChange={(value) => setFormData({ ...formData, licenseType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single-use">Single Use</SelectItem>
              <SelectItem value="multi-use">Multi Use</SelectItem>
              <SelectItem value="unlimited">Unlimited</SelectItem>
              <SelectItem value="seat-based">Seat Based</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
        <Input
          id="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Create Template
        </Button>
      </div>
    </form>
  );
}

function EditTemplateForm({ template, onSuccess }: { template: TemplateListingItem; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description,
    price: template.price || 0,
    currency: template.currency || 'USD',
    tags: template.tags,
    licenseType: template.licenseType || 'unlimited',
    thumbnailUrl: template.thumbnailUrl || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await marketplaceService.updateTemplate(template.id, formData);
      toast({
        title: 'Success!',
        description: 'Template updated successfully.',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="licenseType">License Type</Label>
          <Select value={formData.licenseType} onValueChange={(value) => setFormData({ ...formData, licenseType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single-use">Single Use</SelectItem>
              <SelectItem value="multi-use">Multi Use</SelectItem>
              <SelectItem value="unlimited">Unlimited</SelectItem>
              <SelectItem value="seat-based">Seat Based</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
        <Input
          id="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          Update Template
        </Button>
      </div>
    </form>
  );
}
