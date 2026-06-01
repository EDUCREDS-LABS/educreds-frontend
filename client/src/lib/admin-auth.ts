import { API_CONFIG } from '@/config/api';
import { jwtDecode } from 'jwt-decode';

type AdminSession = {
  email: string;
  role: string;
  expiresAt: string | null;
};

interface AdminTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: string;
  exp: number;
}

const parseErrorMessage = async (response: Response) => {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data.message || data.error || data.details || response.statusText;
  } catch {
    return text || response.statusText;
  }
};

export class AdminAuth {
  static async login(email: string, password: string): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await fetch(API_CONFIG.ADMIN.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: await parseErrorMessage(response),
      };
    }

    const data = await response.json();
    
    // Store the token in localStorage
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }

    return {
      success: true,
      message: 'Authentication successful',
      data
    };
  }

  static async logout(): Promise<void> {
    localStorage.removeItem('admin_token');
    await fetch(API_CONFIG.ADMIN.LOGOUT, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);
  }

  static getSession(): AdminSession | null {
    const token = localStorage.getItem('admin_token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<AdminTokenPayload>(token);
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem('admin_token');
        return null;
      }

      // Verify it's an admin token
      if (decoded.type !== 'admin') {
        return null;
      }

      return {
        email: decoded.email,
        role: decoded.role,
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Failed to decode admin token:', error);
      localStorage.removeItem('admin_token');
      return null;
    }
  }

  static getSessionInfo(): { email: string; timeRemaining: number } | null {
    const session = this.getSession();
    if (!session) return null;

    const expiresAtMs = session.expiresAt ? Date.parse(session.expiresAt) : NaN;
    const timeRemaining = Number.isFinite(expiresAtMs)
      ? Math.max(0, expiresAtMs - Date.now())
      : 0;

    return {
      email: session.email,
      timeRemaining,
    };
  }

  static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}
