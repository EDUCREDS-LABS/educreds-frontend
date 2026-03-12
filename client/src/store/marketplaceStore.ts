import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { EnhancedTemplate } from './editorStore';
import { API_CONFIG } from '@/config/api';
import { auth } from '@/lib/auth';

export interface MarketplaceFilters {
  templateType: 'certificate' | 'logo' | 'banner' | 'other' | 'all';
  priceRange: { min: number; max: number };
  designerId?: string;
  tags: string[];
  sortBy: 'popularity' | 'newest' | 'price-low' | 'price-high' | 'rating';
  licenseType: 'free' | 'paid' | 'all';
  isFeatured?: boolean;
}

export interface MarketplaceState {
  templates: EnhancedTemplate[];
  filters: MarketplaceFilters;
  searchQuery: string;
  loading: boolean;
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
  selectedTemplate: EnhancedTemplate | null;
  featuredTemplates: EnhancedTemplate[];
  popularTemplates: EnhancedTemplate[];
  userPurchases: any[];
  userFavorites: string[];
}

interface MarketplaceActions {
  setTemplates: (templates: EnhancedTemplate[]) => void;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setPagination: (pagination: Partial<MarketplaceState['pagination']>) => void;
  setSelectedTemplate: (template: EnhancedTemplate | null) => void;
  setFeaturedTemplates: (templates: EnhancedTemplate[]) => void;
  setPopularTemplates: (templates: EnhancedTemplate[]) => void;
  setUserPurchases: (purchases: any[]) => void;
  setUserFavorites: (favorites: string[]) => void;
  addToFavorites: (templateId: string) => void;
  removeFromFavorites: (templateId: string) => void;
  loadTemplates: (page?: number) => Promise<void>;
  searchTemplates: (query: string) => Promise<void>;
  purchaseTemplate: (templateId: string) => Promise<boolean>;
  incrementViewCount: (templateId: string) => void;
  clearFilters: () => void;
  resetPagination: () => void;
}

const defaultFilters: MarketplaceFilters = {
  templateType: 'all',
  priceRange: { min: 0, max: 1000 },
  tags: [],
  sortBy: 'newest',
  licenseType: 'all',
};

export const useMarketplaceStore = create<MarketplaceState & MarketplaceActions>()(
  devtools(
    (set, get) => ({
      // State
      templates: [],
      filters: defaultFilters,
      searchQuery: '',
      loading: false,
      pagination: {
        page: 1,
        perPage: 20,
        total: 0,
      },
      selectedTemplate: null,
      featuredTemplates: [],
      popularTemplates: [],
      userPurchases: [],
      userFavorites: [],

      // Actions
      setTemplates: (templates) => set({ templates }),
      
      setFilters: (newFilters) => 
        set({ 
          filters: { ...get().filters, ...newFilters },
          pagination: { ...get().pagination, page: 1 } // Reset to first page
        }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setLoading: (loading) => set({ loading }),
      
      setPagination: (newPagination) => 
        set({ pagination: { ...get().pagination, ...newPagination } }),
      
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      
      setFeaturedTemplates: (templates) => set({ featuredTemplates: templates }),
      
      setPopularTemplates: (templates) => set({ popularTemplates: templates }),
      
      setUserPurchases: (purchases) => set({ userPurchases: purchases }),
      
      setUserFavorites: (favorites) => set({ userFavorites: favorites }),
      
      addToFavorites: (templateId) => {
        const { userFavorites } = get();
        if (!userFavorites.includes(templateId)) {
          set({ userFavorites: [...userFavorites, templateId] });
        }
      },
      
      removeFromFavorites: (templateId) => {
        const { userFavorites } = get();
        set({ userFavorites: userFavorites.filter(id => id !== templateId) });
      },

      loadTemplates: async (page = 1) => {
        const { filters, searchQuery, pagination } = get();
        
        try {
          set({ loading: true });
          
          const params = new URLSearchParams({
            ...(filters.templateType !== 'all' && { category: filters.templateType }),
            ...(searchQuery && { search: searchQuery }),
            ...(filters.priceRange.min > 0 && { priceMin: filters.priceRange.min.toString() }),
            ...(filters.priceRange.max < 1000 && { priceMax: filters.priceRange.max.toString() }),
            ...(filters.isFeatured && { featured: 'true' }),
            ...(filters.sortBy === 'popularity' && { trending: 'true' }),
          });

          // Make API call
          const response = await fetch(`${API_CONFIG.MARKETPLACE}/marketplace/templates?${params}`);
          const data = await response.json();
          
          if (response.ok) {
            const templates = (Array.isArray(data) ? data : (data.templates || [])).map((t: any) => ({
              ...t,
              name: t.name || t.title,
            }));
            const paginationPayload = data?.pagination || {
              page,
              perPage: pagination.perPage,
              total: templates.length,
            };
            set({ 
              templates,
              pagination: {
                page: paginationPayload.page ?? page,
                perPage: paginationPayload.perPage ?? pagination.perPage,
                total: paginationPayload.total ?? templates.length,
              }
            });
          } else {
            console.error('Failed to load templates:', data.message);
          }
        } catch (error) {
          console.error('Error loading templates:', error);
        } finally {
          set({ loading: false });
        }
      },

      searchTemplates: async (query) => {
        set({ searchQuery: query });
        await get().loadTemplates(1);
      },

      purchaseTemplate: async (templateId) => {
        try {
          set({ loading: true });
          
          const institutionId = auth.getUser()?.sub;
          if (!institutionId) {
            console.error('Cannot purchase template: missing institutionId');
            return false;
          }

          const response = await fetch(`${API_CONFIG.MARKETPLACE}/marketplace/templates/${templateId}/purchase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              institutionId,
            }),
          });
          
          const data = await response.json();
          
          if (response.ok) {
            // Add to user purchases
            const { userPurchases } = get();
            set({ userPurchases: [...userPurchases, data] });
            
            // Update template sales count
            const { templates } = get();
            const updatedTemplates = templates.map(template => 
              template.id === templateId 
                ? { ...template, salesCount: (template.salesCount || 0) + 1 }
                : template
            );
            set({ templates: updatedTemplates });
            
            return true;
          } else {
            console.error('Failed to purchase template:', data.message);
            return false;
          }
        } catch (error) {
          console.error('Error purchasing template:', error);
          return false;
        } finally {
          set({ loading: false });
        }
      },

      incrementViewCount: (templateId: string) => {
        const { templates } = get();
        const updatedTemplates = templates.map(template => 
          template.id === templateId 
            ? { ...template, viewCount: (template.viewCount || 0) + 1 }
            : template
        );
        set({ templates: updatedTemplates });
      },

      clearFilters: () => set({ filters: defaultFilters }),
      
      resetPagination: () => 
        set({ pagination: { page: 1, perPage: 20, total: 0 } }),
    }),
    {
      name: 'marketplace-store',
    }
  )
);
