import { FirebaseAuth } from './firebaseAuth';
import { api } from './api';
import { API_CONFIG } from '../config/api';
import {
  clearAuthStorage,
  getAuthItem,
  getAuthTypeFromStorage,
  getInstitutionToken,
  getMarketplaceToken,
  getStudentToken,
  removeAuthItem,
  setAuthItem,
  getDeveloperToken,
  getVerifierToken,
  getGovernmentToken,
} from './authStorage';

export enum AuthType {
  INSTITUTION = 'institution',
  MARKETPLACE = 'marketplace',
  STUDENT = 'student',
  DEVELOPER = 'developer',
  VERIFIER = 'verifier',
  GOVERNMENT = 'government'
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: AuthType;
  walletAddress?: string;
  isVerified?: boolean;
  deploymentTier?: 'workspace' | 'cloud-connector' | 'enterprise-connector';
  connectorApiUrl?: string;
  connectorEndpoint?: string;
  eduCredsId?: string;
  organizationName?: string; // for verifiers
  organizationId?: string;   // for verifiers
  subscriptionPlan?: string; // e.g. "Free", "Starter", "Pro"
}

export class DualAuth {
  private static getCertApiBase(): string {
    return API_CONFIG.CERT;
  }

  // Institution Authentication (Original System)
  static async institutionLogin(email: string, password: string) {
    try {
      const response = await fetch(`${this.getCertApiBase()}/auth/institution/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Institution login failed');
      }

      const data = await response.json();
      const token = data.token;
      
      setAuthItem('institution_token', token);
      setAuthItem('institution_user', JSON.stringify({
        id: data.institution.id,
        email: data.institution.email,
        name: data.institution.name,
        type: AuthType.INSTITUTION,
        walletAddress: data.institution.walletAddress,
        isVerified: data.institution.isVerified,
        deploymentTier: data.institution.deploymentTier,
        connectorApiUrl: data.institution.connectorApiUrl,
        connectorEndpoint: data.institution.connectorEndpoint
      }));
      setAuthItem('auth_type', AuthType.INSTITUTION);
      
      return {
        user: {
          id: data.institution.id,
          email: data.institution.email,
          name: data.institution.name,
          type: AuthType.INSTITUTION,
          walletAddress: data.institution.walletAddress,
          isVerified: data.institution.isVerified,
          deploymentTier: data.institution.deploymentTier,
          connectorApiUrl: data.institution.connectorApiUrl,
          connectorEndpoint: data.institution.connectorEndpoint
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
      const response = await fetch(`${this.getCertApiBase()}/auth/institution/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Institution registration failed');
      }

      const responseData = await response.json();
      const token = responseData.token;
      
      setAuthItem('institution_token', token);
      setAuthItem('institution_user', JSON.stringify({
        id: responseData.institution.id,
        email: responseData.institution.email,
        name: responseData.institution.name,
        type: AuthType.INSTITUTION,
        walletAddress: responseData.institution.walletAddress,
        isVerified: responseData.institution.isVerified,
        deploymentTier: responseData.institution.deploymentTier,
        connectorApiUrl: responseData.institution.connectorApiUrl,
        connectorEndpoint: responseData.institution.connectorEndpoint
      }));
      setAuthItem('auth_type', AuthType.INSTITUTION);
      
      return {
        user: {
          id: responseData.institution.id,
          email: responseData.institution.email,
          name: responseData.institution.name,
          type: AuthType.INSTITUTION,
          walletAddress: responseData.institution.walletAddress,
          isVerified: responseData.institution.isVerified,
          deploymentTier: responseData.institution.deploymentTier,
          connectorApiUrl: responseData.institution.connectorApiUrl,
          connectorEndpoint: responseData.institution.connectorEndpoint
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Developer Authentication
  static async developerLogin(email: string, password: string) {
    try {
      const response = await fetch(`${this.getCertApiBase()}/auth/developer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Developer login failed');
      }

      const data = await response.json();
      const token = data.token;
      
      setAuthItem('developer_token', token);
      setAuthItem('developer_user', JSON.stringify({
        id: data.developer.id,
        email: data.developer.email,
        name: data.developer.name,
        type: AuthType.DEVELOPER,
        isVerified: data.developer.isVerified,
      }));
      setAuthItem('auth_type', AuthType.DEVELOPER);
      
      return {
        user: {
          id: data.developer.id,
          email: data.developer.email,
          name: data.developer.name,
          type: AuthType.DEVELOPER,
          isVerified: data.developer.isVerified,
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  static async developerRegister(data: {
    name: string;
    email: string;
    password: string;
    organization?: string;
    confirmPassword?: string;
  }) {
    try {
      const response = await fetch(`${this.getCertApiBase()}/auth/developer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Developer registration failed');
      }

      const responseData = await response.json();
      const token = responseData.token;
      
      setAuthItem('developer_token', token);
      setAuthItem('developer_user', JSON.stringify({
        id: responseData.developer.id,
        email: responseData.developer.email,
        name: responseData.developer.name,
        type: AuthType.DEVELOPER,
        isVerified: responseData.developer.isVerified,
      }));
      setAuthItem('auth_type', AuthType.DEVELOPER);
      
      return {
        user: {
          id: responseData.developer.id,
          email: responseData.developer.email,
          name: responseData.developer.name,
          type: AuthType.DEVELOPER,
          isVerified: responseData.developer.isVerified,
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Verifier Authentication
  static async verifierLogin(email: string, password: string) {
    try {
      const response = await fetch(`${this.getCertApiBase()}/auth/verifier/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verifier login failed');
      }

      const data = await response.json();
      const token = data.token;
      
      setAuthItem('verifier_token', token);
      setAuthItem('verifier_user', JSON.stringify({
        id: data.verifier.id,
        email: data.verifier.email,
        name: data.verifier.name,
        type: AuthType.VERIFIER,
        organizationName: data.verifier.organizationName,
        organizationId: data.verifier.organizationId,
        isVerified: data.verifier.isVerified,
      }));
      setAuthItem('auth_type', AuthType.VERIFIER);
      
      return {
        user: {
          id: data.verifier.id,
          email: data.verifier.email,
          name: data.verifier.name,
          type: AuthType.VERIFIER,
          organizationName: data.verifier.organizationName,
          organizationId: data.verifier.organizationId,
          isVerified: data.verifier.isVerified,
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  static async verifierRegister(data: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
    confirmPassword?: string;
  }) {
    try {
      const response = await fetch(`${this.getCertApiBase()}/auth/verifier/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verifier registration failed');
      }

      const responseData = await response.json();
      const token = responseData.token;
      
      setAuthItem('verifier_token', token);
      setAuthItem('verifier_user', JSON.stringify({
        id: responseData.verifier.id,
        email: responseData.verifier.email,
        name: responseData.verifier.name,
        type: AuthType.VERIFIER,
        organizationName: responseData.verifier.organizationName,
        organizationId: responseData.verifier.organizationId,
        isVerified: responseData.verifier.isVerified,
      }));
      setAuthItem('auth_type', AuthType.VERIFIER);
      
      return {
        user: {
          id: responseData.verifier.id,
          email: responseData.verifier.email,
          name: responseData.verifier.name,
          type: AuthType.VERIFIER,
          organizationName: responseData.verifier.organizationName,
          organizationId: responseData.verifier.organizationId,
          isVerified: responseData.verifier.isVerified,
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Government Authentication (invite-only)
  static async governmentLogin(email: string, password: string, accessCode: string) {
    try {
      const response = await fetch(`${this.getCertApiBase()}/auth/government/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, accessCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Government login failed');
      }

      const data = await response.json();
      const token = data.token;
      
      setAuthItem('government_token', token);
      setAuthItem('government_user', JSON.stringify({
        id: data.government.id,
        email: data.government.email,
        name: data.government.name,
        type: AuthType.GOVERNMENT,
        organizationName: data.government.organizationName,
        isVerified: data.government.isVerified,
      }));
      setAuthItem('auth_type', AuthType.GOVERNMENT);
      
      return {
        user: {
          id: data.government.id,
          email: data.government.email,
          name: data.government.name,
          type: AuthType.GOVERNMENT,
          organizationName: data.government.organizationName,
          isVerified: data.government.isVerified,
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Student Authentication (email + password)
  static async studentLogin(email: string, password: string) {
    try {
      const response = await fetch(`${this.getCertApiBase()}/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Student login failed');
      }

      const data = await response.json();
      const token = data.token;
      const student = data.student;

      setAuthItem('student_token', token);
      setAuthItem('student_user', JSON.stringify({
        eduCredsId: student.id,
        email: student.email,
        firstName: student.name?.split(' ')[0] ?? null,
        lastName: student.name?.split(' ').slice(1).join(' ') || null,
        walletAddress: student.walletAddress ?? null,
        did: student.did ?? null,
      }));
      setAuthItem('auth_type', AuthType.STUDENT);

      return {
        user: {
          id: student.id,
          email: student.email,
          name: student.name,
          type: AuthType.STUDENT,
          walletAddress: student.walletAddress,
          eduCredsId: student.id,
        } as AuthUser,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  static async studentRegister(email: string, password: string, name: string) {
    try {
      const response = await fetch(`${this.getCertApiBase()}/auth/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Student registration failed');
      }

      const data = await response.json();
      const token = data.token;
      const student = data.student;

      setAuthItem('student_token', token);
      setAuthItem('student_user', JSON.stringify({
        eduCredsId: student.id,
        email: student.email,
        firstName: student.name?.split(' ')[0] ?? null,
        lastName: student.name?.split(' ').slice(1).join(' ') || null,
      }));
      setAuthItem('auth_type', AuthType.STUDENT);

      return {
        user: {
          id: student.id,
          email: student.email,
          name: student.name,
          type: AuthType.STUDENT,
          eduCredsId: student.id,
        } as AuthUser,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  // Marketplace Authentication (Firebase + Backend) — UNCHANGED
  static async marketplaceLogin(email: string, password: string) {
    try {
      const result = await FirebaseAuth.login(email, password);
      
      const backendResponse = await fetch(`${this.getCertApiBase()}/marketplace-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: result.token }),
      });
      
      if (!backendResponse.ok) {
        throw new Error('Marketplace backend authentication failed');
      }
      
      const backendData = await backendResponse.json();
      
      if (!backendData.success) {
        throw new Error(backendData.message || 'Marketplace backend authentication failed');
      }
      
      setAuthItem('marketplace_token', backendData.token);
      setAuthItem('marketplace_user', JSON.stringify({
        id: backendData.user.id,
        email: backendData.user.email,
        name: backendData.user.name || backendData.user.displayName,
        type: AuthType.MARKETPLACE,
        isDesigner: backendData.user.isDesigner,
        avatar: backendData.user.avatar
      }));
      setAuthItem('auth_type', AuthType.MARKETPLACE);
      
      return {
        user: {
          id: backendData.user.id,
          email: backendData.user.email,
          name: backendData.user.name || backendData.user.displayName,
          type: AuthType.MARKETPLACE
        },
        token: backendData.token
      };
    } catch (error: any) {
      if (error.message?.includes('Firebase is not configured')) {
        throw new Error('Marketplace authentication requires Firebase configuration.');
      }
      throw error;
    }
  }

  static async marketplaceRegister(email: string, password: string) {
    try {
      const result = await FirebaseAuth.register(email, password);
      
      const backendResponse = await fetch(`${this.getCertApiBase()}/marketplace-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: result.token }),
      });
      
      if (!backendResponse.ok) {
        throw new Error('Marketplace backend authentication failed');
      }
      
      const backendData = await backendResponse.json();
      
      if (!backendData.success) {
        throw new Error(backendData.message || 'Marketplace backend authentication failed');
      }
      
      setAuthItem('marketplace_token', backendData.token);
      setAuthItem('marketplace_user', JSON.stringify({
        id: backendData.user.id,
        email: backendData.user.email,
        name: backendData.user.name || backendData.user.displayName,
        type: AuthType.MARKETPLACE,
        isDesigner: backendData.user.isDesigner,
        avatar: backendData.user.avatar
      }));
      setAuthItem('auth_type', AuthType.MARKETPLACE);
      
      return {
        user: {
          id: backendData.user.id,
          email: backendData.user.email,
          name: backendData.user.name || backendData.user.displayName,
          type: AuthType.MARKETPLACE
        },
        token: backendData.token
      };
    } catch (error: any) {
      if (error.message?.includes('Firebase is not configured')) {
        throw new Error('Marketplace authentication requires Firebase configuration.');
      }
      throw error;
    }
  }

  // Universal Methods — UNCHANGED LOGIC
  static getCurrentAuthType(): AuthType | null {
    return (getAuthTypeFromStorage() as AuthType) || null;
  }

  static getCurrentToken(): string | null {
    const authType = this.getCurrentAuthType();
    if (authType === AuthType.INSTITUTION) {
      return getInstitutionToken();
    } else if (authType === AuthType.MARKETPLACE) {
      return getMarketplaceToken();
    } else if (authType === AuthType.STUDENT) {
      return getStudentToken();
    } else if (authType === AuthType.DEVELOPER) {
      return getDeveloperToken();
    } else if (authType === AuthType.VERIFIER) {
      return getVerifierToken();
    } else if (authType === AuthType.GOVERNMENT) {
      return getGovernmentToken();
    }
    return null;
  }

  static getCurrentUser(): AuthUser | null {
    const authType = this.getCurrentAuthType();
    const token = this.getCurrentToken();
    
    if (!authType || !token) return null;

    if (authType === AuthType.INSTITUTION) {
      try {
        const userData = getAuthItem('institution_user');
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    } else if (authType === AuthType.MARKETPLACE) {
      try {
        const userData = getAuthItem('marketplace_user');
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    } else if (authType === AuthType.STUDENT) {
      try {
        const raw = getAuthItem('student_user');
        if (!raw) return null;
        const data = JSON.parse(raw);
        return {
          id: data.eduCredsId,
          eduCredsId: data.eduCredsId,
          email: data.email,
          name: [data.firstName, data.lastName].filter(Boolean).join(' '),
          type: AuthType.STUDENT,
        } as AuthUser;
      } catch {
        return null;
      }
    } else if (authType === AuthType.DEVELOPER) {
      try {
        const userData = getAuthItem('developer_user');
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    } else if (authType === AuthType.VERIFIER) {
      try {
        const userData = getAuthItem('verifier_user');
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    } else if (authType === AuthType.GOVERNMENT) {
      try {
        const userData = getAuthItem('government_user');
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    }
    
    return null;
  }

  static isAuthenticated(): boolean {
    const authType = this.getCurrentAuthType();
    const token = this.getCurrentToken();
    
    if (!authType || !token) return false;

    if (authType === AuthType.MARKETPLACE) {
      const firebaseUser = FirebaseAuth.getCurrentUser();
      return !!token && !!firebaseUser;
    }
    
    return !!token;
  }

  static async logout() {
    const authType = this.getCurrentAuthType();
    
    if (authType === AuthType.INSTITUTION) {
      removeAuthItem('institution_token');
      removeAuthItem('institution_user');
    } else if (authType === AuthType.MARKETPLACE) {
      await FirebaseAuth.logout();
      removeAuthItem('marketplace_token');
      removeAuthItem('marketplace_user');
    } else if (authType === AuthType.STUDENT) {
      removeAuthItem('student_token');
      removeAuthItem('student_user');
    } else if (authType === AuthType.DEVELOPER) {
      removeAuthItem('developer_token');
      removeAuthItem('developer_user');
    } else if (authType === AuthType.VERIFIER) {
      removeAuthItem('verifier_token');
      removeAuthItem('verifier_user');
    } else if (authType === AuthType.GOVERNMENT) {
      removeAuthItem('government_token');
      removeAuthItem('government_user');
    }
    
    removeAuthItem('auth_type');
    removeAuthItem('authToken');
    clearAuthStorage();
    sessionStorage.clear();
  }

  static canAccessMarketplace(): boolean {
    const user = this.getCurrentUser();
    return !!user;
  }

  static getMarketplacePermissions() {
    const user = this.getCurrentUser();
    if (!user) return { canView: false, canBuy: false, canDesign: false };

    if (user.type === AuthType.INSTITUTION) {
      return {
        canView: true,
        canBuy: true,
        canDesign: false
      };
    } else {
      return {
        canView: true,
        canBuy: true,
        canDesign: true
      };
    }
  }
}
