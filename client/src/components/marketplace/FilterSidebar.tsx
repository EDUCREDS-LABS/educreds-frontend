import React, { useState } from 'react';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Filter, 
  Search, 
  DollarSign, 
  Tag, 
  Star,
  Calendar,
  User
} from 'lucide-react';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: () => void;
}

export function FilterSidebar({ isOpen, onClose, onApplyFilters }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    templateType: 'all',
    priceRange: [0, 1000],
    sortBy: 'newest',
    licenseType: 'all',
    isFeatured: false,
    tags: [] as string[],
    designerId: '',
  });

  const {
    filters,
    setFilters,
    clearFilters
  } = useMarketplaceStore();

  const popularTags = [
    'academic', 'corporate', 'training', 'workshop', 'hackathon',
    'certificate', 'diploma', 'achievement', 'completion', 'recognition'
  ];

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleApplyFilters = () => {
    setFilters({
      templateType: localFilters.templateType as any,
      priceRange: { min: localFilters.priceRange[0], max: localFilters.priceRange[1] },
      sortBy: localFilters.sortBy as any,
      licenseType: localFilters.licenseType as any,
      isFeatured: localFilters.isFeatured,
      tags: localFilters.tags,
      designerId: localFilters.designerId || undefined,
    });
    onApplyFilters();
  };

  const handleClearFilters = () => {
    setLocalFilters({
      search: '',
      templateType: 'all',
      priceRange: [0, 1000],
      sortBy: 'newest',
      licenseType: 'all',
      isFeatured: false,
      tags: [],
      designerId: '',
    });
    clearFilters();
    onApplyFilters();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Search */}
            <div>
              <Label htmlFor="search" className="flex items-center space-x-2 mb-2">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Label>
              <Input
                id="search"
                placeholder="Search templates..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Template Type */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Tag className="h-4 w-4" />
                <span>Template Type</span>
              </Label>
              <Select
                value={localFilters.templateType}
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
              <Label className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4" />
                <span>Price Range</span>
              </Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>${localFilters.priceRange[0]}</span>
                  <span>${localFilters.priceRange[1]}</span>
                </div>
                <Slider
                  value={localFilters.priceRange}
                  onValueChange={(value) => handleFilterChange('priceRange', value)}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Star className="h-4 w-4" />
                <span>Sort By</span>
              </Label>
              <Select
                value={localFilters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* License Type */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span>License Type</span>
              </Label>
              <Select
                value={localFilters.licenseType}
                onValueChange={(value) => handleFilterChange('licenseType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Licenses</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Designer */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4" />
                <span>Designer</span>
              </Label>
              <Input
                placeholder="Search by designer..."
                value={localFilters.designerId}
                onChange={(e) => handleFilterChange('designerId', e.target.value)}
              />
            </div>

            {/* Tags */}
            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={localFilters.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Featured Only */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={localFilters.isFeatured}
                onCheckedChange={(checked) => handleFilterChange('isFeatured', checked)}
              />
              <Label htmlFor="featured" className="text-sm">
                Featured templates only
              </Label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t space-y-3">
            <Button onClick={handleApplyFilters} className="w-full">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
