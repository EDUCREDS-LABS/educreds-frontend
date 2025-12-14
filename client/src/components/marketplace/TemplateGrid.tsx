import React, { useEffect, useState } from 'react';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { TemplateCard } from './TemplateCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Grid, 
  List, 
  Filter, 
  Search, 
  Loader2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface TemplateGridProps {
  onTemplateSelect?: (template: any) => void;
  showFilters?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function TemplateGrid({ 
  onTemplateSelect, 
  showFilters = true,
  viewMode = 'grid',
  onViewModeChange 
}: TemplateGridProps) {
  const { toast } = useToast();
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list'>(viewMode);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  const {
    templates,
    filters,
    searchQuery,
    loading,
    pagination,
    featuredTemplates,
    popularTemplates,
    setFilters,
    setSearchQuery,
    loadTemplates,
    searchTemplates,
    clearFilters,
    resetPagination
  } = useMarketplaceStore();

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load featured and popular templates
  useEffect(() => {
    const loadFeaturedTemplates = async () => {
      try {
        const response = await fetch('/api/marketplace/templates/featured');
        const data = await response.json();
        if (response.ok) {
          useMarketplaceStore.getState().setFeaturedTemplates(data.templates);
        }
      } catch (error) {
        console.error('Error loading featured templates:', error);
      }
    };

    const loadPopularTemplates = async () => {
      try {
        const response = await fetch('/api/marketplace/templates/popular');
        const data = await response.json();
        if (response.ok) {
          useMarketplaceStore.getState().setPopularTemplates(data.templates);
        }
      } catch (error) {
        console.error('Error loading popular templates:', error);
      }
    };

    loadFeaturedTemplates();
    loadPopularTemplates();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchTemplates(query);
    } else {
      loadTemplates(1);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value });
    loadTemplates(1);
  };

  const handlePageChange = (page: number) => {
    loadTemplates(page);
  };

  const handleRefresh = () => {
    loadTemplates(pagination.page);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setLocalViewMode(mode);
    onViewModeChange?.(mode);
  };

  const renderTemplates = () => {
    if (loading && templates.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading templates...</span>
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try adjusting your search criteria' : 'No templates match your current filters'}
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      );
    }

    if (localViewMode === 'list') {
      return (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                    {template.previewImages?.thumbnail ? (
                      <img
                        src={template.previewImages.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Preview
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {template.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {template.isFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        <span className="text-lg font-semibold">
                          {template.price ? `$${template.price}` : 'Free'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{template.salesCount || 0} sales</span>
                      <span>{template.viewCount || 0} views</span>
                      <div className="flex items-center">
                        <span className="text-yellow-500">â˜…</span>
                        <span className="ml-1">{template.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => onTemplateSelect?.(template)}
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPurchase={() => onTemplateSelect?.(template)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Marketplace</h2>
          <p className="text-gray-600">
            {pagination.total > 0 && `${pagination.total} templates available`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <div className="flex items-center border rounded-lg">
            <Button
              variant={localViewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={localViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Template Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Template Type
                </label>
                <Select
                  value={filters.templateType}
                  onValueChange={(value) => handleFilterChange('templateType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Price Range: ${filters.priceRange.min} - ${filters.priceRange.max}
                </label>
                <Slider
                  value={[filters.priceRange.min, filters.priceRange.max]}
                  onValueChange={([min, max]) => handleFilterChange('priceRange', { min, max })}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* License Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  License Type
                </label>
                <Select
                  value={filters.licenseType}
                  onValueChange={(value) => handleFilterChange('licenseType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={filters.isFeatured || false}
                  onCheckedChange={(checked) => handleFilterChange('isFeatured', checked)}
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  Featured only
                </label>
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      {renderTemplates()}

      {/* Pagination */}
      {pagination.total > pagination.perPage && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.perPage)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.perPage) || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
