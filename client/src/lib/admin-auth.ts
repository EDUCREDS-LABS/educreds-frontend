/**
 * admin-auth.ts
 *
 * Thin wrapper around the EduCreds admin session API.
 *
 * The admin panel UI has been moved to the internal trust-agent-dashboard SWA.
 * This module exists solely so AuthProvider / UnifiedAuthContext can check
 * whether an admin cookie session is active on the current browser — without
 * importing the entire admin panel codebase.
 *
 * It does NOT expose login UI. Login lives in the trust-agent-dashboard.
 */

import { API_CONFIG } from "@/config/api";

export interface AdminSessionInfo {
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export const AdminAuth = {
  /**
   * Check whether an admin session cookie is active.
   * Returns null if no session or the request fails.
   */
  async getSessionInfo(): Promise<AdminSessionInfo | null> {
    try {
      const res = await fetch(API_CONFIG.ADMIN.SESSION, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Backend returns { email, role, ... } or { admin: { email, role } }
      const payload = data?.admin ?? data;
      if (!payload?.email) return null;
      return payload as AdminSessionInfo;
    } catch {
      return null;
    }
  },

  /**
   * Sign out the admin session server-side and clear local state.
   * Safe to call even if no session is active.
   */
  async logout(): Promise<void> {
    try {
      await fetch(API_CONFIG.ADMIN.LOGOUT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Best-effort — ignore network errors
    }
  },
};
