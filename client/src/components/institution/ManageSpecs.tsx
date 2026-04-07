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
  Filter,
  MoreVertical,
  LayoutTemplate,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

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
    queryFn: () => api.getTemplateSpecs(categoryFilter, statusFilter),
  });

  const templates = (templatesData as any)?.templates || [];

  // Mutations
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => api.deleteTemplate(templateId),
    onSuccess: () => {
      toast({ title: 'Template deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/templates/specs'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name': return a.name.localeCompare(b.name);
        case 'usage': return (b.usage || 0) - (a.usage || 0);
        default: return 0;
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
    if (newSelected.has(templateId)) newSelected.delete(templateId);
    else newSelected.add(templateId);
    setSelectedTemplates(newSelected);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'created': return <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50">Custom</Badge>;
      case 'purchased': return <Badge className="bg-green-50 text-green-600 border-green-100 hover:bg-green-50">Market</Badge>;
      case 'uploaded': return <Badge className="bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-50">Legacy</Badge>;
      default: return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-10 max-w-7xl mx-auto py-4">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
              <LayoutTemplate className="size-4" />
              Creative Assets
            </div>
            <h1 className="text-5xl font-black text-neutral-900 tracking-tighter leading-none">
              Credential <span className="text-primary">Specifications</span>.
            </h1>
            <p className="text-neutral-500 max-w-2xl text-lg font-medium">
              Architect and manage the visual identity of your institutional credentials. Standardize issuance through high-fidelity templates.
            </p>
          </div>
          <Button
            onClick={() => setLocation('/institution/templates/designer')}
            className="bg-neutral-900 hover:bg-neutral-800 text-white h-14 px-8 rounded-2xl shadow-2xl shadow-neutral-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Design New Specification
          </Button>
        </div>

        {/* High-Impact Stats Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-xl shadow-neutral-200/40 bg-white rounded-[32px] group overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active Inventory</p>
                <div className="size-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-500 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Package className="size-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-neutral-900 tracking-tighter">{totalTemplates}</span>
                <span className="text-xs text-neutral-400 font-bold uppercase">Specs</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-blue-500/5 bg-blue-50/30 rounded-[32px] group overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Designed In-House</p>
                <div className="size-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Sparkles className="size-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-blue-600 tracking-tighter">{createdCount}</span>
                <span className="text-xs text-blue-400 font-bold uppercase">Originals</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-green-500/5 bg-green-50/30 rounded-[32px] group overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Global Modules</p>
                <div className="size-10 bg-green-100 rounded-xl flex items-center justify-center text-green-500 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <ShoppingCart className="size-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-green-600 tracking-tighter">{purchasedCount}</span>
                <span className="text-xs text-green-400 font-bold uppercase">Acquired</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-purple-500/5 bg-purple-50/30 rounded-[32px] group overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Legacy Assets</p>
                <div className="size-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-500 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <FileText className="size-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-purple-600 tracking-tighter">{uploadedCount}</span>
                <span className="text-xs text-purple-400 font-bold uppercase">Imports</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card className="border-none shadow-xl shadow-neutral-200/20 bg-neutral-50/50 rounded-3xl p-2">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 size-4 text-neutral-400" />
                <Input
                  placeholder="Search repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                  <SelectTrigger className="h-14 w-[160px] rounded-2xl border-none bg-white shadow-sm font-bold text-xs uppercase tracking-wider px-6">
                    <div className="flex items-center gap-2">
                      <Filter className="size-3 text-primary" />
                      <SelectValue placeholder="Category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                    <SelectItem value="all">All Specs</SelectItem>
                    <SelectItem value="created">Internal</SelectItem>
                    <SelectItem value="purchased">External</SelectItem>
                    <SelectItem value="uploaded">Legacy</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="h-14 w-[160px] rounded-2xl border-none bg-white shadow-sm font-bold text-xs uppercase tracking-wider px-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="size-3 text-primary" />
                      <SelectValue placeholder="Sort" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-100 shadow-xl">
                    <SelectItem value="newest">Recent</SelectItem>
                    <SelectItem value="usage">Volume</SelectItem>
                    <SelectItem value="name">Alphabet</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className={cn("h-11 w-12 rounded-xl", viewMode === 'grid' ? "shadow-lg shadow-primary/20" : "text-neutral-400")}
                  >
                    <Grid className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className={cn("h-11 w-12 rounded-xl", viewMode === 'list' ? "shadow-lg shadow-primary/20" : "text-neutral-400")}
                  >
                    <List className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        {templatesLoading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <Loader2 className="size-12 animate-spin text-primary opacity-20" />
            <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Syncing Repository</p>
          </div>
        ) : filteredAndSortedTemplates.length === 0 ? (
          <div className="py-32 flex flex-col items-center text-center gap-6">
            <div className="size-24 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-200">
              <LayoutTemplate className="size-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-neutral-900">No specifications found</h3>
              <p className="text-neutral-500 max-w-sm mx-auto">Try adjusting your filters or create a new template to populate your repository.</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedTemplates.map((template: TemplateSpec) => (
              <Card
                key={template.id}
                className="group border-none shadow-xl shadow-neutral-200/30 rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
              >
                <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                      <LayoutTemplate className="size-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute top-5 left-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <input
                      type="checkbox"
                      checked={selectedTemplates.has(template.id)}
                      onChange={() => handleSelectTemplate(template.id)}
                      className="size-5 rounded-lg border-2 border-white accent-primary cursor-pointer shadow-lg"
                    />
                  </div>

                  <div className="absolute top-5 right-5 flex gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    {getCategoryBadge(template.category)}
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
                    <Button 
                      size="sm" 
                      className="rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 h-10 px-4 font-bold text-xs"
                      onClick={() => setLocation(`/institution/templates/${template.id}`)}
                    >
                      <Eye className="size-3.5 mr-2" /> Quick Preview
                    </Button>
                    <div className="flex gap-2">
                      <Button size="icon" variant="secondary" className="size-10 rounded-xl bg-white/20 backdrop-blur-md text-white border-none hover:bg-red-500 transition-colors">
                        <Trash2 className="size-4" onClick={() => deleteTemplateMutation.mutate(template.id)} />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-8 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 h-5 border-neutral-100 text-neutral-400">
                        {template.status}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <Clock className="size-3" />
                        <span className="text-[10px] font-bold">{new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 line-clamp-1 tracking-tight group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed font-medium">
                      {template.description || "Standard institutional credential specification with cryptographic anchoring support."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                    <div className="flex items-center gap-2">
                      <div className="size-6 bg-neutral-100 rounded-full flex items-center justify-center text-[10px] font-black text-neutral-500">
                        {template.name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-neutral-600">Enterprise Template</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="size-3 fill-primary" />
                      <span className="text-xs font-black tracking-tighter">{template.usage || 0} Issues</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View - Reimagined as High-Density Rows */
          <Card className="border-none shadow-xl shadow-neutral-200/30 bg-white rounded-[32px] overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100">
                {filteredAndSortedTemplates.map((template: TemplateSpec) => (
                  <div key={template.id} className="group flex items-center gap-6 p-6 hover:bg-neutral-50 transition-colors">
                    <div className="size-16 rounded-2xl bg-neutral-100 overflow-hidden flex-shrink-0">
                      {template.thumbnail ? (
                        <img src={template.thumbnail} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          <LayoutTemplate className="size-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-neutral-900 truncate tracking-tight">{template.name}</h3>
                        {getCategoryBadge(template.category)}
                      </div>
                      <p className="text-sm text-neutral-500 truncate font-medium">{template.description}</p>
                    </div>
                    <div className="hidden lg:flex flex-col items-end gap-1 px-8 border-x border-neutral-100">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Performance</span>
                      <div className="flex items-center gap-1.5 text-primary">
                        <Zap className="size-3.5 fill-primary" />
                        <span className="text-sm font-black tracking-tighter">{template.usage || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="rounded-xl hover:bg-neutral-200" onClick={() => setLocation(`/institution/templates/${template.id}`)}>
                        <Eye className="size-5 text-neutral-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-xl hover:bg-red-50 hover:text-red-600" onClick={() => deleteTemplateMutation.mutate(template.id)}>
                        <Trash2 className="size-5" />
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
