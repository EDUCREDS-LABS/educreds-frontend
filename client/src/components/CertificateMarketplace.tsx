import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Award, 
  Crown, 
  Star, 
  Download, 
  Eye, 
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Palette,
  Type,
  Image as ImageIcon,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  GraduationCap,
  Trophy,
  Medal,
  Briefcase,
  BookOpen,
  Zap
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

interface CertificateTemplate {
  id: string;
  title: string;
  description: string;
  designer: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    rating: number;
    totalSales: number;
  };
  category: 'academic' | 'professional' | 'training' | 'achievement' | 'completion' | 'participation';
  subcategory: string;
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  purchases: number;
  views: number;
  thumbnail: string;
  previews: string[];
  tags: string[];
  createdAt: string;
  featured: boolean;
  trending: boolean;
  license: 'standard' | 'extended' | 'exclusive';
  compatibility: string[];
  fields: Array<{
    name: string;
    type: 'text' | 'date' | 'signature' | 'logo' | 'seal';
    required: boolean;
  }>;
  dimensions: {
    width: number;
    height: number;
    format: 'A4' | 'Letter' | 'Custom';
  };
  formats: string[];
  educredsIntegration: {
    compatible: boolean;
    templateId?: string;
    blockchainReady: boolean;
  };
}

const mockTemplates: CertificateTemplate[] = [
  {
    id: 'cert-001',
    title: 'Modern Academic Certificate',
    description: 'Clean, professional certificate perfect for universities and educational institutions',
    designer: {
      id: 'designer-1',
      name: 'Sarah Chen',
      avatar: '/avatars/sarah.jpg',
      verified: true,
      rating: 4.9,
      totalSales: 1250
    },
    category: 'academic',
    subcategory: 'University Degree',
    price: 49.99,
    currency: 'USD',
    rating: 4.8,
    reviews: 156,
    purchases: 890,
    views: 12500,
    thumbnail: '/templates/academic-modern.jpg',
    previews: ['/templates/academic-modern-1.jpg', '/templates/academic-modern-2.jpg'],
    tags: ['modern', 'clean', 'university', 'degree', 'professional'],
    createdAt: '2024-01-15',
    featured: true,
    trending: true,
    license: 'standard',
    compatibility: ['EduCreds', 'Canva', 'Adobe'],
    fields: [
      { name: 'studentName', type: 'text', required: true },
      { name: 'degree', type: 'text', required: true },
      { name: 'university', type: 'text', required: true },
      { name: 'graduationDate', type: 'date', required: true },
      { name: 'signature', type: 'signature', required: true },
      { name: 'universityLogo', type: 'logo', required: false }
    ],
    dimensions: { width: 800, height: 600, format: 'A4' },
    formats: ['SVG', 'PNG', 'PDF', 'EduCreds'],
    educredsIntegration: {
      compatible: true,
      templateId: 'academic-modern-v1',
      blockchainReady: true
    }
  },
  {
    id: 'cert-002',
    title: 'Professional Training Certificate',
    description: 'Corporate training certificate with modern design and customizable branding',
    designer: {
      id: 'designer-2',
      name: 'Alex Rodriguez',
      avatar: '/avatars/alex.jpg',
      verified: true,
      rating: 4.7,
      totalSales: 850
    },
    category: 'professional',
    subcategory: 'Corporate Training',
    price: 29.99,
    currency: 'USD',
    rating: 4.6,
    reviews: 89,
    purchases: 450,
    views: 8900,
    thumbnail: '/templates/professional-training.jpg',
    previews: ['/templates/professional-training-1.jpg'],
    tags: ['corporate', 'training', 'professional', 'business'],
    createdAt: '2024-01-10',
    featured: false,
    trending: true,
    license: 'standard',
    compatibility: ['EduCreds', 'PowerPoint', 'Figma'],
    fields: [
      { name: 'participantName', type: 'text', required: true },
      { name: 'courseName', type: 'text', required: true },
      { name: 'companyName', type: 'text', required: true },
      { name: 'completionDate', type: 'date', required: true },
      { name: 'instructorSignature', type: 'signature', required: true },
      { name: 'companyLogo', type: 'logo', required: false }
    ],
    dimensions: { width: 800, height: 600, format: 'Letter' },
    formats: ['SVG', 'PNG', 'PDF', 'EduCreds'],
    educredsIntegration: {
      compatible: true,
      templateId: 'professional-training-v1',
      blockchainReady: true
    }
  }
];

const categories = [
  { id: 'all', name: 'All Certificates', icon: Award, count: 450 },
  { id: 'academic', name: 'Academic', icon: GraduationCap, count: 180 },
  { id: 'professional', name: 'Professional', icon: Briefcase, count: 120 },
  { id: 'training', name: 'Training', icon: BookOpen, count: 85 },
  { id: 'achievement', name: 'Achievement', icon: Trophy, count: 45 },
  { id: 'completion', name: 'Completion', icon: Medal, count: 20 }
];

export const CertificateMarketplace: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplate[]>(mockTemplates);
  const [filteredTemplates, setFilteredTemplates] = useState<CertificateTemplate[]>(mockTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [educredsOnly, setEducredsOnly] = useState(true);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, sortBy, priceRange, educredsOnly]);

  const filterTemplates = () => {
    let filtered = [...templates];

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (educredsOnly) {
      filtered = filtered.filter(template => template.educredsIntegration.compatible);
    }

    filtered = filtered.filter(template => 
      template.price >= priceRange[0] && template.price <= priceRange[1]
    );

    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
      case 'popular':
        filtered.sort((a, b) => b.purchases - a.purchases);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredTemplates(filtered);
  };

  const handlePurchase = async (templateId: string) => {
    // Integration with EduCreds purchase flow
    const template = templates.find(t => t.id === templateId);
    if (template?.educredsIntegration.compatible) {
      // Add to institution's template library
      console.log('Adding to EduCreds template library:', templateId);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Award className="w-12 h-12 mr-4" />
              <h1 className="text-5xl font-bold">EduCreds Certificate Marketplace</h1>
            </div>
            <p className="text-xl mb-8 opacity-90">
              Premium certificate templates designed for educational institutions. 
              Seamlessly integrate with your EduCreds platform for instant certificate issuance.
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search certificate templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/70"
              />
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold">450+</div>
                <div className="text-sm opacity-80">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm opacity-80">Designers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-sm opacity-80">EduCreds Ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 space-y-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center">
                      <category.icon className="w-4 h-4 mr-2" />
                      {category.name}
                    </div>
                    <Badge variant="secondary">{category.count}</Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={100}
                    step={5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="educreds-only"
                    checked={educredsOnly}
                    onCheckedChange={setEducredsOnly}
                  />
                  <label htmlFor="educreds-only" className="text-sm flex items-center">
                    <Zap className="w-4 h-4 mr-1 text-blue-500" />
                    EduCreds Compatible Only
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* EduCreds Integration Info */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
                  <Zap className="w-5 h-5 mr-2" />
                  EduCreds Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-600 dark:text-blue-400">
                <ul className="space-y-2">
                  <li>• One-click template import</li>
                  <li>• Blockchain-ready certificates</li>
                  <li>• Automatic field mapping</li>
                  <li>• Instant certificate issuance</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold">
                  {filteredTemplates.length} Certificate Templates
                </h2>
                {educredsOnly && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Zap className="w-3 h-3 mr-1" />
                    EduCreds Ready
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                        <Award className="w-16 h-16 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handlePurchase(template.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          ${template.price}
                        </Button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col space-y-1">
                      {template.featured && (
                        <Badge className="bg-yellow-500 text-white">
                          <Crown className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {template.trending && (
                        <Badge className="bg-red-500 text-white">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {template.educredsIntegration.compatible && (
                        <Badge className="bg-blue-500 text-white">
                          <Zap className="w-3 h-3 mr-1" />
                          EduCreds
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1">{template.title}</h3>
                      <div className="text-right">
                        <div className="font-bold text-lg">${template.price}</div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.description}</p>

                    {/* Designer */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {template.designer.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{template.designer.name}</span>
                      {template.designer.verified && (
                        <Badge variant="outline" className="text-xs">Verified</Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                          {template.rating}
                        </div>
                        <div className="flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          {formatNumber(template.purchases)}
                        </div>
                      </div>
                    </div>

                    {/* EduCreds Integration */}
                    {template.educredsIntegration.compatible && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                          <Zap className="w-3 h-3 mr-1" />
                          Ready for instant EduCreds integration
                        </div>
                      </div>
                    )}

                    {/* Fields Preview */}
                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">
                        Fields: {template.fields.length} customizable
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.fields.slice(0, 3).map((field) => (
                          <Badge key={field.name} variant="outline" className="text-xs">
                            {field.name}
                          </Badge>
                        ))}
                        {template.fields.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.fields.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No certificate templates found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceRange([0, 100]);
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateMarketplace;