import axios from 'axios';

const API_BASE = (typeof window !== 'undefined' && import.meta?.env?.VITE_CERT_API_BASE) || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE}/marketplace`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('marketplace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MarketplaceTemplate {
  id: string;
  title: string;
  description: string;
  designerId: string;
  category: string;
  subcategory: string;
  price: number;
  tags: string[];
  templateData: any;
  license: string;
  compatibility: string[];
  dimensions: any;
  formats: string[];
  educredsCompatible: boolean;
  blockchainReady: boolean;
  featured: boolean;
  trending: boolean;
  status: string;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  viewCount: number;
  thumbnailUrl?: string;
  previewUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionTemplate {
  id: string;
  institutionId: string;
  templateId: string;
  template: MarketplaceTemplate;
  purchasePrice: number;
  usageCount: number;
  lastUsedAt?: string;
  customizations?: any;
  status: string;
  purchasedAt: string;
}

export const marketplaceApi = {
  getTemplates: async (filters?: {
    category?: string;
    search?: string;
    educredsOnly?: boolean;
    priceMin?: number;
    priceMax?: number;
    featured?: boolean;
    trending?: boolean;
  }): Promise<MarketplaceTemplate[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/templates?${params}`);
    return response.data;
  },

  getTemplate: async (id: string): Promise<MarketplaceTemplate> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  purchaseTemplate: async (templateId: string, institutionId: string): Promise<InstitutionTemplate> => {
    const response = await api.post(`/templates/${templateId}/purchase`, {
      institutionId
    });
    return response.data;
  },

  getInstitutionTemplates: async (institutionId: string): Promise<InstitutionTemplate[]> => {
    const response = await api.get(`/institutions/${institutionId}/templates`);
    return response.data;
  },

  useTemplate: async (
    institutionId: string, 
    templateId: string, 
    certificateData: {
      certificateId: string;
      recipientName: string;
      recipientEmail: string;
      data: any;
      verificationUrl: string;
      blockchainTxHash?: string;
    }
  ) => {
    const response = await api.post(
      `/institutions/${institutionId}/templates/${templateId}/use`,
      certificateData
    );
    return response.data;
  },

  getUsageAnalytics: async (institutionId: string) => {
    const response = await api.get(`/institutions/${institutionId}/analytics`);
    return response.data;
  },

  createTemplate: async (templateData: Partial<MarketplaceTemplate>): Promise<MarketplaceTemplate> => {
    const response = await api.post('/designer/templates', templateData);
    return response.data;
  },

  updateTemplate: async (templateId: string, updates: Partial<MarketplaceTemplate>): Promise<MarketplaceTemplate> => {
    const response = await api.put(`/designer/templates/${templateId}`, updates);
    return response.data;
  },

  getDesignerTemplates: async (designerId: string): Promise<MarketplaceTemplate[]> => {
    const response = await api.get(`/designer/${designerId}/templates`);
    return response.data;
  }
};

export default marketplaceApi;