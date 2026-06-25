import { API_CONFIG } from '@/config/api';

type AdminSession = {
  email: string;
  role: string;
  expiresAt: string | null;
};

type AdminSessionResponse = {
  user?: {
    email?: string | null;
    role?: string | null;
  };
  expiresAt?: string | null;
};

let cachedSession: AdminSession | null = null;

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
    const session = await this.refreshSession();

    if (!session) {
      return {
        success: false,
        message: 'Admin session could not be established',
      };
    }

    return {
      success: true,
      message: 'Authentication successful',
      data: {
        ...data,
        user: session,
      },
    };
  }

  static async logout(): Promise<void> {
    cachedSession = null;
    localStorage.removeItem('admin_token');
    await fetch(API_CONFIG.ADMIN.LOGOUT, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);
  }

  static getSession(): AdminSession | null {
    return cachedSession;
  }

  static async refreshSession(): Promise<AdminSession | null> {
    try {
      const response = await fetch(API_CONFIG.ADMIN.SESSION, {
        credentials: 'include',
      });

      if (!response.ok) {
        cachedSession = null;
        localStorage.removeItem('admin_token');
        return null;
      }

      const data = (await response.json()) as AdminSessionResponse;
      const email = data.user?.email?.trim();
      const role = data.user?.role?.trim();

      if (!email || !role) {
        cachedSession = null;
        return null;
      }

      cachedSession = {
        email,
        role,
        expiresAt: data.expiresAt ?? null,
      };
      localStorage.removeItem('admin_token');

      return cachedSession;
    } catch {
      cachedSession = null;
      return null;
    }
  }

  static async getSessionInfo(): Promise<{ email: string; timeRemaining: number } | null> {
    const session = await this.refreshSession();
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
    return {};
  }
}
