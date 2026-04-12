import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_CONFIG } from "@/config/api";
import { transformDocumentsForBackend } from "@/utils/documentTransform";

const getAdminHeaders = () => ({
  'Content-Type': 'application/json',
});

export function useVerificationRequests() {
  return useQuery({
    queryKey: ["/api/admin/verification-requests"],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.ADMIN.VERIFICATION_REQUESTS, {
        headers: getAdminHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch verification requests");
      return response.json();
    },
    refetchInterval: 30000,
  });
}

export function useRevenueData() {
  return useQuery({
    queryKey: ["/api/admin/revenue"],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.ADMIN.REVENUE, {
        headers: getAdminHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch revenue data");
      return response.json();
    },
    refetchInterval: 60000,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.ADMIN.USERS, {
        headers: getAdminHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch admin users");
      return response.json();
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["/api/admin/audit-logs"],
    queryFn: async () => {
      const response = await fetch(API_CONFIG.ADMIN.AUDIT_LOGS, {
        headers: getAdminHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
  });
}

export function useAdminNotificationSettings(adminEmail: string | null) {
  return useQuery({
    queryKey: ["/api/admin/notifications/settings", adminEmail],
    enabled: !!adminEmail,
    queryFn: async () => {
      const response = await fetch(API_CONFIG.ADMIN.NOTIFICATIONS_SETTINGS(adminEmail!), {
        headers: getAdminHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to fetch notification settings");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAdminNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ adminEmail, settings }: { adminEmail: string; settings: any }) => {
      const response = await fetch(API_CONFIG.ADMIN.NOTIFICATIONS_SETTINGS(adminEmail), {
        method: 'PUT',
        headers: getAdminHeaders(),
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to update notification settings');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/settings", variables.adminEmail] });
    },
  });
}

export function useReviewVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, status, comments, documents }: any) => {
      const transformedData = {
        status,
        comments,
        verificationDocuments: documents ? transformDocumentsForBackend(documents) : []
      };

      const response = await fetch(`${API_CONFIG.ADMIN.VERIFICATION_REQUESTS}/${requestId}/review`, {
        method: 'POST',
        headers: getAdminHeaders(),
        credentials: 'include',
        body: JSON.stringify(transformedData)
      });

      if (!response.ok) throw new Error('Operation failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification-requests"] });
    },
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch(API_CONFIG.ADMIN.USERS, {
        method: "POST",
        headers: getAdminHeaders(),
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error("Failed to create user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, updates }: any) => {
      const response = await fetch(`${API_CONFIG.ADMIN.USERS}/${userId}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_CONFIG.ADMIN.USERS}/${userId}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });
}
