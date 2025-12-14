import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { marketplaceService, TemplateListingItem } from '@/lib/marketplaceService';
import { TemplateCard } from '@/components/marketplace/TemplateCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, TrendingUp, Star, Users } from 'lucide-react';
import { PaymentModal } from '@/components/marketplace/PaymentModal';

export default function MarketplacePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [filters, setFilters] = useState({
    tags: [] as string[],
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    search: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateListingItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [page, filters]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await marketplaceService.listTemplates(page, 12, filters);
      setTemplates(response.templates);
      setTotalPages(response.pagination.pages);
      setTotalTemplates(response.pagination.total);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handlePurchase = async (template: TemplateListingItem) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to purchase templates.',
        variant: 'destructive',
      });
      return;
    }

    if (template.price === 0) {
      // Free template - no payment needed
      try {
        await marketplaceService.purchaseTemplate(template.id, user.id);
        toast({
          title: 'Success!',
          description: `Successfully added "${template.name}" to your templates.`,
        });
      } catch (error) {
        console.error('Purchase failed:', error);
        toast({
          title: 'Purchase Failed',
          description: 'Unable to complete the purchase. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Paid template - show payment modal
      setSelectedTemplate(template);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedTemplate || !user) return;
    
    try {
      await marketplaceService.purchaseTemplate(selectedTemplate.id, user.id);
      setShowPaymentModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Unable to complete the purchase. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPage(1);
  };

  const handleTagFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      tags: value === 'all' ? [] : [value],
    }));
    setPage(1);
  };

  const handlePriceFilter = (type: 'min' | 'max', value: string) => {
    const numValue = value ? Number(value) : undefined;
    setFilters(prev => ({
      ...prev,
      [type === 'min' ? 'minPrice' : 'maxPrice']: numValue,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      tags: [],
      minPrice: undefined,
      maxPrice: undefined,
      search: '',
    });
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Certificate Templates Marketplace</h1>
        <p className="text-xl text-gray-600 mb-6">
          Discover professional certificate templates created by talented designers
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>{totalTemplates} Templates</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Active Designers</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>Quality Guaranteed</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={() => window.location.href = '/designer'}>
            Become a Designer
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/login'}>
            Sign In to Purchase
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Find the perfect template for your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select onValueChange={handleTagFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Min Price</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => handlePriceFilter('min', e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Max Price</label>
              <Input
                type="number"
                placeholder="No limit"
                value={filters.maxPrice || ''}
                onChange={(e) => handlePriceFilter('max', e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              {(filters.tags.length > 0 || filters.minPrice || filters.maxPrice || filters.search) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Showing {templates.length} of {totalTemplates} templates
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or search terms
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPurchase={() => handlePurchase(template)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Payment Modal */}
      {showPaymentModal && selectedTemplate && (
        <PaymentModal
          templateName={selectedTemplate.name}
          price={selectedTemplate.price || 0}
          currency={selectedTemplate.currency || 'USD'}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setShowPaymentModal(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}