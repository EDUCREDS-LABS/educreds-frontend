import { jwtDecode } from "jwt-decode";

interface MarketplaceTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

// Custom event for marketplace authentication state changes
const MARKETPLACE_AUTH_STATE_CHANGE_EVENT = "marketplaceAuthStateChange";

export const marketplaceAuth = {
  getToken: () => {
    const token = localStorage.getItem("marketplace_auth_token");
    if (token) {
      try {
        const decoded = jwtDecode<MarketplaceTokenPayload>(token);
        // Check if token expires within 5 minutes
        if (decoded.exp < (Date.now() / 1000) + 300) {
          // Token expires soon, try to refresh
          marketplaceAuth.refreshToken();
        }
      } catch (error) {
        // Invalid token, remove it
        marketplaceAuth.removeToken();
        return null;
      }
    }
    return token;
  },

  setToken: (token: string) => {
    // Validate token before storing
    try {
      const decoded = jwtDecode<MarketplaceTokenPayload>(token);
      if (decoded.exp <= Date.now() / 1000) {
        throw new Error('Token is expired');
      }
      localStorage.setItem("marketplace_auth_token", token);
      // Dispatch custom event to notify components of auth state change
      window.dispatchEvent(new CustomEvent(MARKETPLACE_AUTH_STATE_CHANGE_EVENT, { detail: { isAuthenticated: true } }));
    } catch (error) {
      console.error('Invalid marketplace token provided:', error);
      throw new Error('Invalid token');
    }
  },

  removeToken: () => {
    localStorage.removeItem("marketplace_auth_token");
    localStorage.removeItem("marketplace_refresh_token");
    // Dispatch custom event to notify components of auth state change
    window.dispatchEvent(new CustomEvent(MARKETPLACE_AUTH_STATE_CHANGE_EVENT, { detail: { isAuthenticated: false } }));
  },

  setRefreshToken: (refreshToken: string) => {
    localStorage.setItem("marketplace_refresh_token", refreshToken);
  },

  getRefreshToken: () => {
    return localStorage.getItem("marketplace_refresh_token");
  },

  refreshToken: async () => {
    const refreshToken = marketplaceAuth.getRefreshToken();
    if (!refreshToken) {
      marketplaceAuth.logout();
      return false;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        marketplaceAuth.setToken(data.accessToken);
        if (data.refreshToken) {
          marketplaceAuth.setRefreshToken(data.refreshToken);
        }
        return true;
      } else {
        marketplaceAuth.logout();
        return false;
      }
    } catch (error) {
      console.error('Marketplace token refresh failed:', error);
      marketplaceAuth.logout();
      return false;
    }
  },

  isAuthenticated: () => {
    const token = marketplaceAuth.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<MarketplaceTokenPayload>(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  },

  getUser: () => {
    const token = marketplaceAuth.getToken();
    if (!token) return null;

    try {
      return jwtDecode<MarketplaceTokenPayload>(token);
    } catch {
      return null;
    }
  },

  logout: async () => {
    try {
      // Call marketplace logout endpoint to clear session
      const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getMarketplaceAuthHeaders()
        },
        credentials: "include",
        body: JSON.stringify({
          refreshToken: marketplaceAuth.getRefreshToken()
        })
      });
      
      if (!response.ok) {
        console.warn('Marketplace logout endpoint failed, proceeding with local cleanup');
      }
    } catch (error) {
      console.error("Marketplace logout error:", error);
    } finally {
      marketplaceAuth.removeToken();
      // Clear marketplace-specific cached data
      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('marketplace_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    }
  }
};

export const getMarketplaceAuthHeaders = (): Record<string, string> => {
  const token = marketplaceAuth.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Marketplace API functions
export const marketplaceApi = {
  // Marketplace auth endpoints
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }
    
    return response.json();
  },

  register: async (data: any) => {
    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Registration failed');
    }
    
    return response.json();
  },

  verifySession: async () => {
    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/auth/verify-session`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error('Session verification failed');
    }
    
    return response.json();
  },

  // Template marketplace endpoints
  getTemplates: async () => {
    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/templates`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    
    return response.json();
  },

  getTemplateById: async (id: string) => {
    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/templates/${id}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }
    
    return response.json();
  },

  createTemplate: async (templateData: any) => {
    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(templateData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create template');
    }
    
    return response.json();
  },

  purchaseTemplate: async (templateId: string, purchaseData: any) => {
    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/marketplace/templates/${templateId}/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(purchaseData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to purchase template');
    }
    
    return response.json();
  },

  getBuyerTemplates: async (buyerId: string) => {
    const response = await fetch(`${import.meta.env.VITE_CERT_API_BASE || "http://localhost:3001"}/marketplace/purchases?buyerId=${buyerId}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch purchased templates');
    }
    
    return response.json();
  }
};