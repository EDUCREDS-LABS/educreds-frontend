import { DualAuth, AuthType } from './dualAuth';
import { FirebaseAuth } from './firebaseAuth';
import { getAnyAuthToken, getAuthTypeFromStorage, getInstitutionToken, getMarketplaceToken, getStudentToken, getDeveloperToken, getVerifierToken, getGovernmentToken } from './authStorage';

// Custom event for authentication state changes
const AUTH_STATE_CHANGE_EVENT = "authStateChange";

// Initialize Firebase auth state listener for marketplace users
FirebaseAuth.onAuthStateChanged((user) => {
  const currentAuthType = DualAuth.getCurrentAuthType();
  if (currentAuthType === AuthType.MARKETPLACE) {
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT, { 
      detail: { isAuthenticated: !!user, user } 
    }));
  }
});

export const auth = {
  getToken: () => {
    return DualAuth.getCurrentToken();
  },

  setToken: (token: string) => {
    // This is handled by DualAuth methods
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT, { 
      detail: { isAuthenticated: true } 
    }));
  },

  removeToken: () => {
    // This is handled by DualAuth.logout()
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT, { 
      detail: { isAuthenticated: false } 
    }));
  },

  refreshToken: async () => {
    const authType = DualAuth.getCurrentAuthType();
    if (authType === AuthType.MARKETPLACE) {
      try {
        const token = await FirebaseAuth.refreshToken();
        return !!token;
      } catch (error) {
        console.error('Token refresh failed:', error);
        auth.logout();
        return false;
      }
    }
    return true; // Institution tokens don't need refresh in this implementation
  },

  isAuthenticated: () => {
    return DualAuth.isAuthenticated();
  },

  getUser: () => {
    const user = DualAuth.getCurrentUser();
    if (!user) return null;
    
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.type,
      walletAddress: user.walletAddress,
      isVerified: user.isVerified,
      exp: 0
    };
  },

  logout: async () => {
    try {
      await DualAuth.logout();
      auth.removeToken();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  // Institution methods (original system)
  institutionLogin: async (email: string, password: string) => {
    try {
      const result = await DualAuth.institutionLogin(email, password);
      auth.setToken(result.token);
      return result;
    } catch (error) {
      throw error;
    }
  },

  institutionRegister: async (data: any) => {
    try {
      const result = await DualAuth.institutionRegister(data);
      auth.setToken(result.token);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Marketplace methods (Firebase)
  marketplaceLogin: async (email: string, password: string) => {
    try {
      const result = await DualAuth.marketplaceLogin(email, password);
      auth.setToken(result.token);
      return result;
    } catch (error) {
      throw error;
    }
  },

  marketplaceRegister: async (email: string, password: string) => {
    try {
      const result = await DualAuth.marketplaceRegister(email, password);
      auth.setToken(result.token);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Marketplace access
  canAccessMarketplace: () => DualAuth.canAccessMarketplace(),
  getMarketplacePermissions: () => DualAuth.getMarketplacePermissions(),
  getCurrentAuthType: () => DualAuth.getCurrentAuthType()
};

export const getAuthHeaders = (): Record<string, string> => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  let token: string | null = null;

  // Path-specific shortcuts for common workspaces
  if (path.startsWith('/institution')) {
    token = getInstitutionToken();
  } else if (path.startsWith('/government')) {
    token = getGovernmentToken();
  } else if (path.startsWith('/verifier')) {
    token = getVerifierToken();
  } else if (path.startsWith('/developer-portal')) {
    token = getDeveloperToken();
  } else {
    // General fallback: use whichever auth type is active in storage
    const authType = getAuthTypeFromStorage();
    if (authType === AuthType.INSTITUTION) {
      token = getInstitutionToken();
    } else if (authType === AuthType.MARKETPLACE) {
      token = getMarketplaceToken();
    } else if (authType === AuthType.STUDENT) {
      token = getStudentToken();
    } else if (authType === AuthType.DEVELOPER) {
      token = getDeveloperToken();
    } else if (authType === AuthType.VERIFIER) {
      token = getVerifierToken();
    } else if (authType === AuthType.GOVERNMENT) {
      token = getGovernmentToken();
    }
  }

  // Final catch-all for legacy or mixed states
  if (!token) {
    token = getAnyAuthToken();
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
};
