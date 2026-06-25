import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInstitutionNotificationPreferences() {
  return useQuery({
    queryKey: ["institution-notification-preferences"],
    queryFn: () => api.getInstitutionNotificationPreferences(),
    staleTime: 5 * 60 * 1000,
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
    queryFn: () => api.getNotifications(options),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => api.getUnreadNotificationCount(),
    refetchInterval: 30_000,
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
    queryFn: () => api.getEmailHealth(hours),
    enabled,
    refetchInterval: 30_000,
  });
}
