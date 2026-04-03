import { API_CONFIG } from '@/config/api';

type AdminSession = {
  email: string;
  role: string;
  expiresAt: string | null;
};

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
  static async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
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

    return {
      success: true,
      message: 'Authentication successful',
    };
  }

  static async logout(): Promise<void> {
    await fetch(API_CONFIG.ADMIN.LOGOUT, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);
  }

  static async getSession(): Promise<AdminSession | null> {
    const response = await fetch(API_CONFIG.ADMIN.SESSION, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      email: data.user?.email || '',
      role: data.user?.role || '',
      expiresAt: data.expiresAt || null,
    };
  }

  static async getSessionInfo(): Promise<{ email: string; timeRemaining: number } | null> {
    const session = await this.getSession();
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
}
