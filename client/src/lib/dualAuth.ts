import { FirebaseAuth } from './firebaseAuth';
import { api } from './api';

export enum AuthType {
  INSTITUTION = 'institution',
  MARKETPLACE = 'marketplace'
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: AuthType;
  walletAddress?: string;
  isVerified?: boolean;
}

export class DualAuth {
  // Institution Authentication (Original System)
  static async institutionLogin(email: string, password: string) {
    try {
      const response = await api.login({ email, password });
      const token = response.token;
      
      localStorage.setItem('institution_token', token);
      localStorage.setItem('auth_type', AuthType.INSTITUTION);
      
      return {
        user: {
          id: response.institution.id,
          email: response.institution.email,
          name: response.institution.name,
          type: AuthType.INSTITUTION,
          walletAddress: response.institution.walletAddress,
          isVerified: response.institution.isVerified
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  static async institutionRegister(data: {
    name: string;
    email: string;
    password: string;
    walletAddress: string;
    registrationNumber: string;
  }) {
    try {
      const response = await api.register(data);
      const token = response.token;
      
      localStorage.setItem('institution_token', token);
      localStorage.setItem('auth_type', AuthType.INSTITUTION);
      
      return {
        user: {
          id: response.institution.id,
          email: response.institution.email,
          name: response.institution.name,
          type: AuthType.INSTITUTION,
          walletAddress: response.institution.walletAddress,
          isVerified: response.institution.isVerified
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Marketplace Authentication (Firebase + Backend)
  static async marketplaceLogin(email: string, password: string) {
    try {
      const result = await FirebaseAuth.login(email, password);
      
      // Send Firebase ID token to backend for marketplace authentication
      const backendResponse = await fetch(`${process.env.VITE_CERT_API_BASE || 'http://localhost:3001'}/marketplace-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: result.token }),
      });
      
      if (!backendResponse.ok) {
        throw new Error('Backend authentication failed');
      }
      
      const backendData = await backendResponse.json();
      
      if (!backendData.success) {
        throw new Error(backendData.message || 'Backend authentication failed');
      }
      
      // Store backend JWT token for marketplace API calls
      localStorage.setItem('marketplace_token', backendData.token);
      localStorage.setItem('auth_type', AuthType.MARKETPLACE);
      
      return {
        user: {
          id: backendData.user.id,
          email: backendData.user.email,
          name: backendData.user.name || backendData.user.displayName,
          type: AuthType.MARKETPLACE
        },
        token: backendData.token
      };
    } catch (error) {
      throw error;
    }
  }

  static async marketplaceRegister(email: string, password: string) {
    try {
      const result = await FirebaseAuth.register(email, password);
      
      // Send Firebase ID token to backend for marketplace authentication
      const backendResponse = await fetch(`${process.env.VITE_CERT_API_BASE || 'http://localhost:3001'}/marketplace-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: result.token }),
      });
      
      if (!backendResponse.ok) {
        throw new Error('Backend authentication failed');
      }
      
      const backendData = await backendResponse.json();
      
      if (!backendData.success) {
        throw new Error(backendData.message || 'Backend authentication failed');
      }
      
      // Store backend JWT token for marketplace API calls
      localStorage.setItem('marketplace_token', backendData.token);
      localStorage.setItem('auth_type', AuthType.MARKETPLACE);
      
      return {
        user: {
          id: backendData.user.id,
          email: backendData.user.email,
          name: backendData.user.name || backendData.user.displayName,
          type: AuthType.MARKETPLACE
        },
        token: backendData.token
      };
    } catch (error) {
      throw error;
    }
  }

  // Universal Methods
  static getCurrentAuthType(): AuthType | null {
    return localStorage.getItem('auth_type') as AuthType || null;
  }

  static getCurrentToken(): string | null {
    const authType = this.getCurrentAuthType();
    if (authType === AuthType.INSTITUTION) {
      return localStorage.getItem('institution_token');
    } else if (authType === AuthType.MARKETPLACE) {
      return localStorage.getItem('marketplace_token');
    }
    return null;
  }

  static getCurrentUser(): AuthUser | null {
    const authType = this.getCurrentAuthType();
    const token = this.getCurrentToken();
    
    if (!authType || !token) return null;

    if (authType === AuthType.INSTITUTION) {
      // Decode institution token or get from storage
      try {
        const userData = localStorage.getItem('institution_user');
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    } else if (authType === AuthType.MARKETPLACE) {
      const firebaseUser = FirebaseAuth.getCurrentUser();
      if (!firebaseUser) return null;
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email || '',
        type: AuthType.MARKETPLACE
      };
    }
    
    return null;
  }

  static isAuthenticated(): boolean {
    const authType = this.getCurrentAuthType();
    const token = this.getCurrentToken();
    
    if (!authType || !token) return false;

    if (authType === AuthType.INSTITUTION) {
      return !!token; // Institution tokens are JWT, could add expiry check
    } else if (authType === AuthType.MARKETPLACE) {
      return !!FirebaseAuth.getCurrentUser();
    }
    
    return false;
  }

  static async logout() {
    const authType = this.getCurrentAuthType();
    
    if (authType === AuthType.INSTITUTION) {
      localStorage.removeItem('institution_token');
      localStorage.removeItem('institution_user');
    } else if (authType === AuthType.MARKETPLACE) {
      await FirebaseAuth.logout();
      localStorage.removeItem('marketplace_token');
    }
    
    localStorage.removeItem('auth_type');
    sessionStorage.clear();
  }

  // Institution Marketplace Access
  static canAccessMarketplace(): boolean {
    const user = this.getCurrentUser();
    return !!user; // Both institution and marketplace users can access marketplace
  }

  static getMarketplacePermissions() {
    const user = this.getCurrentUser();
    if (!user) return { canView: false, canBuy: false, canDesign: false };

    if (user.type === AuthType.INSTITUTION) {
      return {
        canView: true,
        canBuy: true,
        canDesign: false // Institutions can't design templates
      };
    } else {
      return {
        canView: true,
        canBuy: true,
        canDesign: true // Marketplace users can design templates
      };
    }
  }
}