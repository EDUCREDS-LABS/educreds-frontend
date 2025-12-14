import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  User,
  Award,
  SlidersHorizontal,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchFilters {
  query: string;
  dateRange: {
    from: string;
    to: string;
  };
  status: string[];
  type: string[];
  institution: string[];
  recipient: string;
  verificationStatus: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onExport?: (filters: SearchFilters) => void;
  totalResults?: number;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ 
  onSearch, 
  onExport,
  totalResults = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    dateRange: { from: '', to: '' },
    status: [],
    type: [],
    institution: [],
    recipient: '',
    verificationStatus: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const certificateTypes = [
    'Academic Degree',
    'Professional Certificate',
    'Training Completion',
    'Achievement Award',
    'Participation Certificate'
  ];

  const statusOptions = [
    'Issued',
    'Verified',
    'Pending',
    'Revoked'
  ];

  const institutions = [
    'Harvard University',
    'MIT',
    'Stanford University',
    'Oxford University',
    'Cambridge University'
  ];

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const toggleArrayFilter = (key: 'status' | 'type' | 'institution', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      dateRange: { from: '', to: '' },
      status: [],
      type: [],
      institution: [],
      recipient: '',
      verificationStatus: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = 
    filters.query || 
    filters.dateRange.from || 
    filters.dateRange.to ||
    filters.status.length > 0 ||
    filters.type.length > 0 ||
    filters.institution.length > 0 ||
    filters.recipient ||
    filters.verificationStatus;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Advanced Search</span>
            {totalResults > 0 && (
              <Badge variant="secondary">{totalResults} results</Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {onExport && (
              <Button variant="outline" size="sm" onClick={() => onExport(filters)}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {isExpanded ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search certificates, recipients, or institutions..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <Badge
              key={status}
              variant={filters.status.includes(status) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleArrayFilter('status', status)}
            >
              {status}
            </Badge>
          ))}
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 border-t pt-4"
            >
              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateRange.from}
                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateRange.to}
                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, to: e.target.value })}
                  />
                </div>
              </div>

              {/* Certificate Types */}
              <div>
                <label className="text-sm font-medium mb-2 block">Certificate Types</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {certificateTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.type.includes(type)}
                        onCheckedChange={() => toggleArrayFilter('type', type)}
                      />
                      <label className="text-sm">{type}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institutions */}
              <div>
                <label className="text-sm font-medium mb-2 block">Institutions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {institutions.map((institution) => (
                    <div key={institution} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.institution.includes(institution)}
                        onCheckedChange={() => toggleArrayFilter('institution', institution)}
                      />
                      <label className="text-sm">{institution}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Recipient</label>
                <Input
                  placeholder="Search by recipient name or email"
                  value={filters.recipient}
                  onChange={(e) => updateFilter('recipient', e.target.value)}
                />
              </div>

              {/* Verification Status */}
              <div>
                <label className="text-sm font-medium mb-2 block">Verification Status</label>
                <Select value={filters.verificationStatus} onValueChange={(value) => updateFilter('verificationStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="pending">Pending Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date Issued</SelectItem>
                      <SelectItem value="recipient">Recipient Name</SelectItem>
                      <SelectItem value="institution">Institution</SelectItem>
                      <SelectItem value="type">Certificate Type</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Order</label>
                  <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm font-medium">Active filters:</span>
            {filters.status.map((status) => (
              <Badge key={status} variant="secondary" className="text-xs">
                Status: {status}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => toggleArrayFilter('status', status)}
                />
              </Badge>
            ))}
            {filters.type.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                Type: {type}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => toggleArrayFilter('type', type)}
                />
              </Badge>
            ))}
            {filters.institution.map((institution) => (
              <Badge key={institution} variant="secondary" className="text-xs">
                Institution: {institution}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => toggleArrayFilter('institution', institution)}
                />
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};