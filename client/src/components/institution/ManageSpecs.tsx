import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  FileText,
  Search,
  Plus,
  Trash2,
  Eye,
  Download,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Star,
  Clock,
  Grid,
  List,
  Sparkles,
  TrendingUp,
  Zap,
  Package,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface TemplateSpec {
  id: string;
  name: string;
  category: 'created' | 'purchased' | 'uploaded';
  thumbnail?: string;
  previewUrl?: string;
  description?: string;
  createdAt: string;
  usage?: number;
  rating?: number;
  author?: string;
  status: 'active' | 'archived' | 'draft';
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name' | 'usage';

/**
 * ManageSpecs Component
 * 
 * Central hub for managing all certificate templates:
 * - Created templates (designed in editor)
 * - Purchased templates (from marketplace)
 * - Uploaded templates (legacy PDFs)
 * 
 * Features:
 * - Search, filter, sort templates
 * - Preview and edit
 * - Delete and archive
 * - Usage statistics
 * - Bulk operations
 */
export default function ManageSpecs() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'created' | 'purchased' | 'uploaded'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  // Queries
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['/templates/specs', categoryFilter, statusFilter],
    queryFn: () =>
      api.getTemplateSpecs(categoryFilter, statusFilter),
  });

  const templates = (templatesData as any)?.templates || [];

  // Mutations
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) =>
      api.deleteTemplate(templateId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/templates/specs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });

  const archiveTemplateMutation = useMutation({
    mutationFn: (templateId: string) =>
      api.updateTemplateStatus(templateId, 'archived'),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template archived',
      });
      queryClient.invalidateQueries({ queryKey: ['/templates/specs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive template',
        variant: 'destructive',
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (templateIds: string[]) =>
      api.bulkDeleteTemplates(templateIds),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `${selectedTemplates.size} template(s) deleted`,
      });
      setSelectedTemplates(new Set());
      queryClient.invalidateQueries({ queryKey: ['/templates/specs'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete templates',
        variant: 'destructive',
      });
    },
  });

  // Filter and sort logic
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates.filter((template: TemplateSpec) => {
      const matchesSearch =
        !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return (b.usage || 0) - (a.usage || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [templates, searchQuery, sortBy]);

  const totalTemplates = templates.length;
  const createdCount = templates.filter((t: TemplateSpec) => t.category === 'created').length;
  const purchasedCount = templates.filter((t: TemplateSpec) => t.category === 'purchased').length;
  const uploadedCount = templates.filter((t: TemplateSpec) => t.category === 'uploaded').length;

  const handleSelectTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTemplates.size === filteredAndSortedTemplates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(filteredAndSortedTemplates.map((t: TemplateSpec) => t.id)));
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedTemplates.size === 0) {
      toast({
        title: 'No templates selected',
        description: 'Select templates to delete',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Delete ${selectedTemplates.size} template(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedTemplates));
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'created':
        return <Badge className="bg-blue-100 text-blue-800">Created</Badge>;
      case 'purchased':
        return <Badge className="bg-green-100 text-green-800">Purchased</Badge>;
      case 'uploaded':
        return <Badge className="bg-purple-100 text-purple-800">Uploaded</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-200">
            Archived
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            Draft
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header with Stats */}
        <div className="space-y-6">
          {/* Title and Action */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                Manage Templates
              </h1>
              <p className="text-neutral-600 mt-2">
                Organize and manage your certificate templates with ease
              </p>
            </div>
            <Button
              onClick={() => setLocation('/institution/templates/designer')}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Template
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-neutral-600">
                    Total
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{totalTemplates}</p>
                <p className="text-sm text-neutral-600 mt-1">Templates</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-800">
                    Created
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{createdCount}</p>
                <p className="text-sm text-neutral-600 mt-1">By You</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-100">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-800">
                    Purchased
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{purchasedCount}</p>
                <p className="text-sm text-neutral-600 mt-1">From Marketplace</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-100">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-800">
                    Uploaded
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{uploadedCount}</p>
                <p className="text-sm text-neutral-600 mt-1">Legacy PDFs</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advanced Filters Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-primary" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search by template name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-lg"
              />
            </div>

            {/* Filter and Sort Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="created">My Created</SelectItem>
                  <SelectItem value="purchased">Purchased</SelectItem>
                  <SelectItem value="uploaded">Legacy PDFs</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="usage">Most Used</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-neutral-100 p-1 rounded-lg h-11">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="h-full"
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-full"
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Bulk Delete Button */}
              {selectedTemplates.size > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="h-11 w-full sm:w-auto"
                  title={`Delete ${selectedTemplates.size} selected`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete ({selectedTemplates.size})
                </Button>
              )}
            </div>

            {/* Selection Info */}
            {selectedTemplates.size > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.size === filteredAndSortedTemplates.length && filteredAndSortedTemplates.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedTemplates.size} selected
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedTemplates(new Set())}
                  className="h-8"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates Grid/List */}
        {templatesLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-neutral-600">Loading templates...</p>
            </div>
          </div>
        ) : filteredAndSortedTemplates.length === 0 ? (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {searchQuery
                ? 'No templates match your search. Try adjusting your filters.'
                : 'No templates yet. Create your first template or browse the marketplace.'}
            </AlertDescription>
          </Alert>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTemplates.map((template: TemplateSpec) => (
              <Card
                key={template.id}
                className="border-0 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
              >
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.has(template.id)}
                    onChange={() => handleSelectTemplate(template.id)}
                    className="w-5 h-5 rounded accent-primary cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Thumbnail */}
                <div className="relative w-full h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-neutral-400" />
                    </div>
                  )}
                  {/* Category Badge on Image */}
                  <div className="absolute top-3 right-3">
                    {getCategoryBadge(template.category)}
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Title and Status */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-neutral-900 line-clamp-2 text-base">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(template.status)}
                    </div>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs text-neutral-500 py-2 border-t border-neutral-200">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                    {template.usage ? (
                      <div className="flex items-center gap-1 font-medium text-neutral-700">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        {template.usage} used
                      </div>
                    ) : null}
                  </div>

                  {/* Rating */}
                  {template.rating && (
                    <div className="flex items-center gap-1.5 py-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(template.rating!)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-neutral-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-neutral-600 ml-1">({template.rating})</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 text-xs"
                      onClick={() => setLocation(`/institution/templates/${template.id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 text-xs text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="space-y-0.5">
                {/* Select All Row */}
                {filteredAndSortedTemplates.length > 0 && (
                  <div className="flex items-center gap-3 px-6 py-4 bg-neutral-50 border-b border-neutral-200 hover:bg-neutral-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedTemplates.size === filteredAndSortedTemplates.length && filteredAndSortedTemplates.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-sm font-medium text-neutral-600 flex-1">
                      {selectedTemplates.size === filteredAndSortedTemplates.length && filteredAndSortedTemplates.length > 0
                        ? 'Deselect All'
                        : 'Select All'}
                    </span>
                    <span className="text-xs text-neutral-500">{filteredAndSortedTemplates.length} items</span>
                  </div>
                )}

                {/* Template Rows */}
                {filteredAndSortedTemplates.map((template: TemplateSpec, index: number) => (
                  <div
                    key={template.id}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors ${
                      index !== filteredAndSortedTemplates.length - 1 ? 'border-b border-neutral-200' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.has(template.id)}
                      onChange={() => handleSelectTemplate(template.id)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer flex-shrink-0"
                    />

                    {/* Thumbnail */}
                    <div className="w-14 h-14 bg-neutral-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {template.thumbnail ? (
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {getCategoryBadge(template.category)}
                        {getStatusBadge(template.status)}
                      </div>
                      {template.description && (
                        <p className="text-sm text-neutral-600 truncate mt-1">
                          {template.description}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right text-sm text-neutral-600 min-w-max hidden sm:block">
                      <p className="font-medium text-neutral-900">{new Date(template.createdAt).toLocaleDateString()}</p>
                      {template.usage && <p className="text-xs text-neutral-500">{template.usage} used</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setLocation(`/institution/templates/${template.id}`)}
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={deleteTemplateMutation.isPending}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}
