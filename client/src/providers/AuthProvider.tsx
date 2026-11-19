import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { DualAuth, AuthType, AuthUser } from "@/lib/dualAuth";
import { AdminAuth } from "@/lib/admin-auth";

/**
 * UnifiedAuthContext — consolidates the historically-separate auth
 * mechanisms (institution/student, wallet, admin) behind a single provider.
 *
 * See `documentation/SYSTEM_COHESION_PLAN.md` §1.1.
 *
 * Rules:
 *  - This does NOT replace the individual hooks (`useAuth`, `useWallet`).
 *    Existing pages continue to work unchanged.
 *  - New pages that need a snapshot across all mechanisms should use
 *    `useUnifiedAuth()` for a single source of truth.
 *  - `logoutAll()` is the safe way to fully sign out — clears every store.
 */

export type PrincipalKind =
  | "institution"
  | "student"
  | "admin"
  | "wallet"
  | null;

export interface UnifiedAuthState {
  /** Any principal signed in? (institution | student | admin) */
  isAuthenticated: boolean;
  /** The primary principal kind (first non-null in priority order). */
  primaryPrincipal: PrincipalKind;

  // ── Institution / Student (from DualAuth) ─────────────────────────────────
  authType: AuthType | null;
  user: AuthUser | null;

  // ── Wallet (Reown/Wagmi/injected) ─────────────────────────────────────────
  wallet: {
    isConnected: boolean;
    address: string;
    networkId: string;
  };

  // ── Admin (cookie-session) ────────────────────────────────────────────────
  admin: {
    isAuthenticated: boolean;
    email: string | null;
    role: string | null;
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Log out ALL principals across all stores. Safe on every page. */
  logoutAll: () => Promise<void>;
  /** Log out only the primary principal (institution/student). */
  logoutPrimary: () => Promise<void>;
  /** Refresh admin session snapshot on demand. */
  refreshAdminSession: () => Promise<void>;
}

const UnifiedAuthContext = createContext<UnifiedAuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const primary = useAuth();
  const wallet = useWallet();

  const [adminSession, setAdminSession] = useState<{
    isAuthenticated: boolean;
    email: string | null;
    role: string | null;
  }>({ isAuthenticated: false, email: null, role: null });

  const refreshAdminSession = useCallback(async () => {
    try {
      const info = await AdminAuth.getSessionInfo();
      if (info?.email) {
        setAdminSession({ isAuthenticated: true, email: info.email, role: null });
      } else {
        setAdminSession({ isAuthenticated: false, email: null, role: null });
      }
    } catch {
      setAdminSession({ isAuthenticated: false, email: null, role: null });
    }
  }, []);

  useEffect(() => {
    // Only check admin session on admin routes to avoid unnecessary 401 fetches
    // on non-admin pages (registration, dashboard, etc.).
    const path = window.location.pathname;
    if (path.startsWith("/admin")) {
      refreshAdminSession();
    }
    // Re-check on window focus when on admin routes so a login in another tab is reflected.
    const onFocus = () => {
      if (window.location.pathname.startsWith("/admin")) {
        refreshAdminSession();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshAdminSession]);

  const logoutPrimary = useCallback(async () => {
    await primary.logout();
  }, [primary]);

  const logoutAll = useCallback(async () => {
    // Order matters: sign out remote sessions before clearing local state so
    // server-side revocation succeeds while we still hold the tokens.
    await Promise.allSettled([
      DualAuth.logout(),
      AdminAuth.logout().catch(() => undefined),
      wallet.isConnected ? Promise.resolve(wallet.disconnect()) : Promise.resolve(),
    ]);
    setAdminSession({ isAuthenticated: false, email: null, role: null });
    window.dispatchEvent(new CustomEvent("authStateChange"));
  }, [wallet]);

  const value = useMemo<UnifiedAuthState>(() => {
    // Priority order: institution/student session > admin > wallet
    const authed =
      primary.isAuthenticated || adminSession.isAuthenticated;
    let primaryPrincipal: PrincipalKind = null;
    if (primary.isAuthenticated && primary.authType) {
      primaryPrincipal = primary.authType as PrincipalKind;
    } else if (adminSession.isAuthenticated) {
      primaryPrincipal = "admin";
    } else if (wallet.isConnected) {
      primaryPrincipal = "wallet";
    }

    return {
      isAuthenticated: authed,
      primaryPrincipal,
      authType: primary.authType,
      user: (primary.user as AuthUser | null) ?? null,
      wallet: {
        isConnected: wallet.isConnected,
        address: wallet.walletAddress,
        networkId: wallet.networkId,
      },
      admin: adminSession,
      logoutAll,
      logoutPrimary,
      refreshAdminSession,
    };
  }, [
    primary.isAuthenticated,
    primary.authType,
    primary.user,
    wallet.isConnected,
    wallet.walletAddress,
    wallet.networkId,
    adminSession,
    logoutAll,
    logoutPrimary,
    refreshAdminSession,
  ]);

  return <UnifiedAuthContext.Provider value={value}>{children}</UnifiedAuthContext.Provider>;
}

/**
 * Hook: read the unified auth state.
 * Throws if used outside `<AuthProvider>` (fail-fast at boundary).
 */
export function useUnifiedAuth(): UnifiedAuthState {
  const ctx = useContext(UnifiedAuthContext);
  if (!ctx) {
    throw new Error("useUnifiedAuth() must be used inside <AuthProvider>");
  }
  return ctx;
}
