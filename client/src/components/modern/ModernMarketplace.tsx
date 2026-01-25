import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useMarketplaceAuth } from '@/hooks/useMarketplaceAuth';
import { marketplaceService, TemplateListingItem } from '@/lib/marketplaceService';
import { TemplateCard } from '@/components/marketplace/TemplateCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Users, 
  LogIn, 
  LogOut, 
  User,
  Palette,
  Award,
  Zap,
  Grid3X3,
  List
} from 'lucide-react';
import { PaymentModal } from '@/components/marketplace/PaymentModal';
import ModernHeader from './ModernHeader';
import ModernFooter from './ModernFooter';

export default function ModernMarketplace() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useMarketplaceAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    tags: [] as string[],
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    search: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateListingItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const categories = [
    { id: 'all', name: 'All Templates', icon: Grid3X3, count: totalTemplates },
    { id: 'academic', name: 'Academic', icon: Award, count: 0 },
    { id: 'professional', name: 'Professional', icon: Star, count: 0 },
    { id: 'achievement', name: 'Achievement', icon: TrendingUp, count: 0 },
    { id: 'training', name: 'Training', icon: Zap, count: 0 },
    { id: 'corporate', name: 'Corporate', icon: Users, count: 0 }
  ];

  useEffect(() => {
    loadTemplates();
  }, [page, filters]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await marketplaceService.listTemplates(page, 12, filters);
      setTemplates(response.templates || []);
      setTotalPages(response.pagination?.pages || 1);
      setTotalTemplates(response.pagination?.total || 0);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates. Please try again.',
        variant: 'destructive',
      });
      setTemplates([]);
      setLoading(false);
    }
  };

  const handlePurchase = async (template: TemplateListingItem) => {
    if (!isAuthenticated || !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to purchase templates.',
        variant: 'destructive',
      });
      setLocation('/marketplace/login');
      return;
    }

    if (template.price === 0) {
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
      toast({
        title: 'Success!',
        description: `Successfully purchased "${selectedTemplate.name}"!`,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Unable to complete the purchase. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ModernHeader />
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Palette className="w-3 h-3 mr-1" />
              Template Marketplace
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              Professional Certificate
              <span className="block text-primary">Templates & Designs</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Discover stunning certificate templates created by talented designers. 
              Choose from hundreds of professional designs or create your own.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{totalTemplates}+</div>
                <div className="text-neutral-600">Templates Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">50+</div>
                <div className="text-neutral-600">Active Designers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10k+</div>
                <div className="text-neutral-600">Downloads</div>
              </div>
            </div>

            {/* Auth Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user.displayName || user.email}</span>
                  </div>
                  <Button variant="outline" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setLocation('/marketplace/login')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to Purchase
                </Button>
              )}
              <Button variant="outline" onClick={() => setLocation('/designer')}>
                <Palette className="mr-2 h-4 w-4" />
                Become a Designer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Filter className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-neutral-900">Filters</h3>
                  </div>

                  {/* Search */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        placeholder="Search templates..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-neutral-700 mb-3 block">Categories</label>
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        const isActive = filters.tags.length === 0 ? category.id === 'all' : filters.tags.includes(category.id);
                        
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              if (category.id === 'all') {
                                setFilters(prev => ({ ...prev, tags: [] }));
                              } else {
                                setFilters(prev => ({ ...prev, tags: [category.id] }));
                              }
                              setPage(1);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                              isActive 
                                ? 'bg-primary text-white' 
                                : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span className="text-sm">{category.name}</span>
                            </div>
                            <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">
                              {category.count}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-neutral-700 mb-3 block">Price Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          minPrice: e.target.value ? Number(e.target.value) : undefined 
                        }))}
                        min="0"
                        step="0.01"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          maxPrice: e.target.value ? Number(e.target.value) : undefined 
                        }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {(filters.tags.length > 0 || filters.minPrice || filters.maxPrice || filters.search) && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setFilters({
                          tags: [],
                          minPrice: undefined,
                          maxPrice: undefined,
                          search: '',
                        });
                        setPage(1);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Templates Grid */}
            <div className="lg:col-span-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {filters.search ? `Search results for "${filters.search}"` : 'All Templates'}
                  </h2>
                  <p className="text-neutral-600">
                    Showing {templates.length} of {totalTemplates} templates
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-48 w-full mb-4" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-neutral-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-neutral-500 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button variant="outline" onClick={() => {
                    setFilters({
                      tags: [],
                      minPrice: undefined,
                      maxPrice: undefined,
                      search: '',
                    });
                    setPage(1);
                  }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onPurchase={() => handlePurchase(template)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
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
            </div>
          </div>
        </div>
      </section>

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

      <ModernFooter />
    </div>
  );
}