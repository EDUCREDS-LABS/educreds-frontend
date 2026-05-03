import { API_CONFIG } from '../config/api';

const CERT_API_BASE = API_CONFIG.MARKETPLACE;

export interface TemplateListingItem {
  id: string;
  name: string;
  description: string;
  price?: number;
  currency?: string;
  thumbnailUrl?: string;
  tags: string[];
  salesCount: number;
  creatorId: string;
  licenseType?: string;
  createdAt: string;
  updatedAt: string;
  // Additional properties
  htmlContent?: string;
  cssContent?: string;
  isPublished?: boolean;
  templateType?: 'certificate' | 'logo' | 'banner' | 'other';
  viewCount?: number;
  downloadCount?: number;
  likeCount?: number;
  averageRating?: number;
}

export interface MarketplaceFilters {
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  creatorId?: string;
}

export interface MarketplaceResponse {
  templates: TemplateListingItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    pages: number;
  };
}

export interface DesignerAnalytics {
  totalTemplates: number;
  publishedTemplates: number;
  unpublishedTemplates: number;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  topSellingTemplate: TemplateListingItem | null;
}

export interface TemplateAnalytics {
  template: TemplateListingItem;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
  recentPurchases: any[];
  purchaseHistory: any[];
}

export const marketplaceService = {
  // Browse marketplace
  listTemplates: async (
    page: number = 1,
    perPage: number = 20,
    filters: MarketplaceFilters = {}
  ): Promise<MarketplaceResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });

    if (filters.tags?.length) {
      params.append('tags', filters.tags.join(','));
    }
    if (filters.minPrice !== undefined) {
      params.append('minPrice', filters.minPrice.toString());
    }
    if (filters.maxPrice !== undefined) {
      params.append('maxPrice', filters.maxPrice.toString());
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.creatorId) {
      params.append('creatorId', filters.creatorId);
    }

  const response = await fetch(`${CERT_API_BASE}/marketplace/templates?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    return response.json();
  },

  getTemplate: async (id: string): Promise<TemplateListingItem> => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/templates/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }
    return response.json();
  },

  purchaseTemplate: async (templateId: string, buyerId: string, paymentMethod?: string) => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/templates/${templateId}/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ buyerId, paymentMethod }),
    });
    if (!response.ok) {
      throw new Error('Failed to purchase template');
    }
    return response.json();
  },

  getPurchases: async (buyerId: string) => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/purchases?buyerId=${buyerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch purchases');
    }
    return response.json();
  },

  // Designer functions
  getDesignerTemplates: async (creatorId: string): Promise<TemplateListingItem[]> => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/designer/${creatorId}/templates`);
    if (!response.ok) {
      throw new Error('Failed to fetch designer templates');
    }
    return response.json();
  },

  createTemplate: async (templateData: any) => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/designer/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });
    if (!response.ok) {
      throw new Error('Failed to create template');
    }
    return response.json();
  },

  updateTemplate: async (id: string, templateData: any) => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/designer/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });
    if (!response.ok) {
      throw new Error('Failed to update template');
    }
    return response.json();
  },

  deleteTemplate: async (id: string) => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/designer/templates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete template');
    }
    return response.json();
  },

  publishTemplate: async (id: string) => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/designer/templates/${id}/publish`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to publish template');
    }
    return response.json();
  },

  unpublishTemplate: async (id: string) => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/designer/templates/${id}/unpublish`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to unpublish template');
    }
    return response.json();
  },

  // Analytics
  getDesignerAnalytics: async (creatorId: string): Promise<DesignerAnalytics> => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/designer/${creatorId}/analytics`);
    if (!response.ok) {
      throw new Error('Failed to fetch designer analytics');
    }
    return response.json();
  },

  getTemplateAnalytics: async (templateId: string): Promise<TemplateAnalytics> => {
  const response = await fetch(`${CERT_API_BASE}/marketplace/templates/${templateId}/analytics`);
    if (!response.ok) {
      throw new Error('Failed to fetch template analytics');
    }
    return response.json();
  },
};
