import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Heart, 
  Share2, 
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Crown,
  Zap,
  Users,
  Calendar,
  DollarSign,
  Award,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Video,
  Music,
  Code,
  Layers,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

interface Template {
  id: string;
  title: string;
  description: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  category: string;
  tags: string[];
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  downloads: number;
  likes: number;
  views: number;
  thumbnail: string;
  previews: string[];
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  trending: boolean;
  aiGenerated: boolean;
  license: 'free' | 'premium' | 'exclusive';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  software: string[];
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number; // in MB
  formats: string[];
}

const mockTemplates: Template[] = [
  {
    id: '1',
    title: 'Modern Certificate Design',
    description: 'Professional certificate template with clean typography and elegant borders',
    creator: {
      id: 'creator1',
      name: 'Sarah Design',
      avatar: '/avatars/sarah.jpg',
      verified: true,
      level: 'gold'
    },
    category: 'certificates',
    tags: ['modern', 'professional', 'clean', 'typography'],
    price: 29.99,
    currency: 'USD',
    rating: 4.8,
    reviews: 156,
    downloads: 2340,
    likes: 890,
    views: 12500,
    thumbnail: '/templates/cert1-thumb.jpg',
    previews: ['/templates/cert1-1.jpg', '/templates/cert1-2.jpg'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    featured: true,
    trending: true,
    aiGenerated: false,
    license: 'premium',
    complexity: 'intermediate',
    estimatedTime: 30,
    software: ['Figma', 'Sketch', 'Adobe XD'],
    dimensions: { width: 800, height: 600 },
    fileSize: 2.5,
    formats: ['SVG', 'PNG', 'PDF', 'AI']
  },
  {
    id: '2',
    title: 'AI-Generated Diploma Template',
    description: 'Stunning diploma design created with advanced AI algorithms',
    creator: {
      id: 'ai-creator',
      name: 'EduDesign AI',
      avatar: '/avatars/ai.jpg',
      verified: true,
      level: 'platinum'
    },
    category: 'diplomas',
    tags: ['ai-generated', 'elegant', 'academic', 'formal'],
    price: 0,
    currency: 'USD',
    rating: 4.9,
    reviews: 89,
    downloads: 5670,
    likes: 1200,
    views: 18900,
    thumbnail: '/templates/diploma1-thumb.jpg',
    previews: ['/templates/diploma1-1.jpg'],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    featured: true,
    trending: false,
    aiGenerated: true,
    license: 'free',
    complexity: 'beginner',
    estimatedTime: 15,
    software: ['EduDesign Pro', 'Canva'],
    dimensions: { width: 1200, height: 800 },
    fileSize: 1.8,
    formats: ['SVG', 'PNG', 'PDF']
  }
];

const categories = [
  { id: 'all', name: 'All Templates', icon: Grid3X3, count: 1250 },
  { id: 'certificates', name: 'Certificates', icon: Award, count: 450 },
  { id: 'diplomas', name: 'Diplomas', icon: Crown, count: 320 },
  { id: 'badges', name: 'Badges', icon: Star, count: 180 },
  { id: 'presentations', name: 'Presentations', icon: Layout, count: 200 },
  { id: 'social-media', name: 'Social Media', icon: Share2, count: 100 }
];

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Downloaded' }
];

export const SuperiorMarketplace: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(mockTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedComplexity, setSelectedComplexity] = useState<string[]>([]);
  const [showAIOnly, setShowAIOnly] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    filterAndSortTemplates();
  }, [
    searchQuery, 
    selectedCategory, 
    sortBy, 
    priceRange, 
    selectedLicenses, 
    selectedComplexity, 
    showAIOnly, 
    showFeaturedOnly, 
    minRating
  ]);

  const filterAndSortTemplates = () => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Price filter
    filtered = filtered.filter(template => 
      template.price >= priceRange[0] && template.price <= priceRange[1]
    );

    // License filter
    if (selectedLicenses.length > 0) {
      filtered = filtered.filter(template => selectedLicenses.includes(template.license));
    }

    // Complexity filter
    if (selectedComplexity.length > 0) {
      filtered = filtered.filter(template => selectedComplexity.includes(template.complexity));
    }

    // AI filter
    if (showAIOnly) {
      filtered = filtered.filter(template => template.aiGenerated);
    }

    // Featured filter
    if (showFeaturedOnly) {
      filtered = filtered.filter(template => template.featured);
    }

    // Rating filter
    filtered = filtered.filter(template => template.rating >= minRating);

    // Sort
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'downloads':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
    }

    setFilteredTemplates(filtered);
  };

  const handleLicenseChange = (license: string, checked: boolean) => {
    if (checked) {
      setSelectedLicenses([...selectedLicenses, license]);
    } else {
      setSelectedLicenses(selectedLicenses.filter(l => l !== license));
    }
  };

  const handleComplexityChange = (complexity: string, checked: boolean) => {
    if (checked) {
      setSelectedComplexity([...selectedComplexity, complexity]);
    } else {
      setSelectedComplexity(selectedComplexity.filter(c => c !== complexity));
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'platinum': return <Crown className="w-4 h-4 text-purple-500" />;
      case 'gold': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'silver': return <Award className="w-4 h-4 text-gray-400" />;
      default: return <Award className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              The World's Most Advanced Design Marketplace
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Discover premium templates, AI-generated designs, and exclusive content from top creators worldwide
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search templates, creators, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/70"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-purple-600 hover:bg-gray-100">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Search
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-8 mt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold">1.2M+</div>
                <div className="text-sm opacity-80">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm opacity-80">Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">10M+</div>
                <div className="text-sm opacity-80">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">4.9★</div>
                <div className="text-sm opacity-80">Rating</div>
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
                <CardTitle className="flex items-center">
                  <Grid3X3 className="w-5 h-5 mr-2" />
                  Categories
                </CardTitle>
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Filters
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              {showFilters && (
                <CardContent className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range</label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={100}
                      step={1}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>

                  {/* License Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">License</label>
                    <div className="space-y-2">
                      {['free', 'premium', 'exclusive'].map((license) => (
                        <div key={license} className="flex items-center space-x-2">
                          <Checkbox
                            id={license}
                            checked={selectedLicenses.includes(license)}
                            onCheckedChange={(checked) => handleLicenseChange(license, checked as boolean)}
                          />
                          <label htmlFor={license} className="text-sm capitalize">
                            {license}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complexity */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Complexity</label>
                    <div className="space-y-2">
                      {['beginner', 'intermediate', 'advanced'].map((complexity) => (
                        <div key={complexity} className="flex items-center space-x-2">
                          <Checkbox
                            id={complexity}
                            checked={selectedComplexity.includes(complexity)}
                            onCheckedChange={(checked) => handleComplexityChange(complexity, checked as boolean)}
                          />
                          <label htmlFor={complexity} className="text-sm capitalize">
                            {complexity}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Filters */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ai-only"
                        checked={showAIOnly}
                        onCheckedChange={setShowAIOnly}
                      />
                      <label htmlFor="ai-only" className="text-sm flex items-center">
                        <Sparkles className="w-4 h-4 mr-1 text-purple-500" />
                        AI Generated Only
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured-only"
                        checked={showFeaturedOnly}
                        onCheckedChange={setShowFeaturedOnly}
                      />
                      <label htmlFor="featured-only" className="text-sm flex items-center">
                        <Crown className="w-4 h-4 mr-1 text-yellow-500" />
                        Featured Only
                      </label>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                    <Slider
                      value={[minRating]}
                      onValueChange={(value) => setMinRating(value[0])}
                      max={5}
                      step={0.5}
                      className="mb-2"
                    />
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                      {minRating}+ stars
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Featured Creator */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-purple-500" />
                  Featured Creator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                    AI
                  </div>
                  <h3 className="font-semibold">EduDesign AI</h3>
                  <p className="text-sm text-gray-600 mb-3">Platinum Creator</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="font-semibold">2.5K</div>
                      <div className="text-gray-500">Templates</div>
                    </div>
                    <div>
                      <div className="font-semibold">4.9★</div>
                      <div className="text-gray-500">Rating</div>
                    </div>
                  </div>
                  <Button size="sm" className="mt-3 w-full">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold">
                  {filteredTemplates.length} Templates
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {selectedCategory === 'all' ? 'All Categories' : categories.find(c => c.id === selectedCategory)?.name}
                </Badge>
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode */}
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

            {/* Templates Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      <div className="aspect-[4/3] bg-gray-200 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="secondary">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            {template.price === 0 ? 'Free' : `$${template.price}`}
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
                        {template.aiGenerated && (
                          <Badge className="bg-purple-500 text-white">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/80 hover:bg-white">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/80 hover:bg-white">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{template.title}</h3>
                        <div className="text-right">
                          {template.price === 0 ? (
                            <Badge variant="secondary">Free</Badge>
                          ) : (
                            <div className="font-bold text-lg">${template.price}</div>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.description}</p>

                      {/* Creator */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {template.creator.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{template.creator.name}</span>
                        {template.creator.verified && (
                          <div className="flex items-center">
                            {getLevelIcon(template.creator.level)}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                            {template.rating}
                          </div>
                          <div className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            {formatNumber(template.downloads)}
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {formatNumber(template.views)}
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        <div className="w-32 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-xl mb-1">{template.title}</h3>
                              <p className="text-gray-600 mb-2">{template.description}</p>
                            </div>
                            <div className="text-right">
                              {template.price === 0 ? (
                                <Badge variant="secondary" className="mb-2">Free</Badge>
                              ) : (
                                <div className="font-bold text-xl mb-2">${template.price}</div>
                              )}
                              <Button>
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                {template.price === 0 ? 'Download' : 'Buy Now'}
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                              {template.rating} ({template.reviews} reviews)
                            </div>
                            <div className="flex items-center">
                              <Download className="w-4 h-4 mr-1" />
                              {formatNumber(template.downloads)} downloads
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {formatNumber(template.views)} views
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(template.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {template.creator.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{template.creator.name}</span>
                              {template.creator.verified && getLevelIcon(template.creator.level)}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredTemplates.length > 0 && (
              <div className="text-center mt-12">
                <Button size="lg" variant="outline">
                  Load More Templates
                </Button>
              </div>
            )}

            {/* No Results */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No templates found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLicenses([]);
                  setSelectedComplexity([]);
                  setShowAIOnly(false);
                  setShowFeaturedOnly(false);
                  setMinRating(0);
                  setPriceRange([0, 100]);
                }}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperiorMarketplace;