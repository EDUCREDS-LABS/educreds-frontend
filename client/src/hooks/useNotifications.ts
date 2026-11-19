import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";

/**
 * Returns true only when the current page has a valid institution auth token.
 * Prevents notification polling from firing unauthenticated requests that
 * trigger cascading 401 → recoverFromUnauthorized → redirect loops.
 */
function hasValidAuthToken(): boolean {
  const headers = getAuthHeaders();
  return Boolean(headers.Authorization);
}

/** Silently return a fallback value for 401/403 instead of throwing,
 *  which prevents react-query retry and recoverFromUnauthorized cascades. */
function isAuthError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

/** Check if error is a 404 (endpoint not implemented yet) or network error */
function isNotFoundOrNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 404 || err.status === 0; // 0 = network error
  }
  // Check for network errors (failed to fetch, etc.)
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('failed to fetch') || 
           msg.includes('network error') ||
           msg.includes('networkerror') ||
           msg.includes('abort');
  }
  return false;
}

export function useInstitutionNotificationPreferences() {
  return useQuery({
    queryKey: ["institution-notification-preferences"],
    queryFn: async () => {
      try {
        return await api.getInstitutionNotificationPreferences();
      } catch (err) {
        if (isAuthError(err)) return null;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: hasValidAuthToken(),
  });
}

export function useUpdateInstitutionNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateInstitutionNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-notification-preferences"] });
    },
  });
}

export function useNotifications(options?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ["notifications", options],
    queryFn: async () => {
      try {
        return await api.getNotifications(options);
      } catch (err) {
        // Return empty result on auth errors — prevents redirect cascades
        if (isAuthError(err)) return { notifications: [], total: 0 };
        // Silently handle 404/network errors - endpoint may not be implemented yet
        if (isNotFoundOrNetworkError(err)) {
          console.warn('Notifications endpoint unavailable, returning empty state:', err instanceof Error ? err.message : err);
          return { notifications: [], total: 0 };
        }
        throw err;
      }
    },
    enabled: hasValidAuthToken(),
    retry: (failureCount, error) => {
      // Don't retry auth errors or 404/network errors
      if (isAuthError(error) || isNotFoundOrNetworkError(error)) return false;
      return failureCount < 3;
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      try {
        return await api.getUnreadNotificationCount();
      } catch (err) {
        // Return zero on auth errors — prevents 30s poll from cascading 401s
        if (isAuthError(err)) return { count: 0 };
        // Silently handle 404/network errors - endpoint may not be implemented yet
        if (isNotFoundOrNetworkError(err)) {
          console.warn('Notifications unread-count endpoint unavailable, returning zero:', err instanceof Error ? err.message : err);
          return { count: 0 };
        }
        throw err;
      }
    },
    refetchInterval: hasValidAuthToken() ? 30_000 : false,
    enabled: hasValidAuthToken(),
    retry: (failureCount, error) => {
      // Don't retry auth errors or 404/network errors
      if (isAuthError(error) || isNotFoundOrNetworkError(error)) return false;
      return failureCount < 3;
    },
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => api.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useEmailHealth(hours: number = 24, enabled: boolean = true) {
  return useQuery({
    queryKey: ["email-health", hours],
    queryFn: async () => {
      try {
        return await api.getEmailHealth(hours);
      } catch (err) {
        if (isAuthError(err)) return null;
        throw err;
      }
    },
    enabled: enabled && hasValidAuthToken(),
    refetchInterval: hasValidAuthToken() ? 30_000 : false,
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return failureCount < 3;
    },
  });
}
