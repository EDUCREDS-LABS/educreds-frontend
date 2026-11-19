// educreds-frontend/src/api/notification-settings.ts
import axios from 'axios';
import { API_BASE } from '@/config/api';
import { getAnyAuthToken } from '@/lib/authStorage';

const getAuthToken = () =>
  getAnyAuthToken() || '';

export interface NotificationPreferences {
  proposalUpdates?: boolean;
  governanceAlerts?: boolean;
  certificateEvents?: boolean;
  systemAnnouncements?: boolean;
  verificationStatus?: boolean;
  notificationsEnabled?: boolean;
  contactEmails?: string[];
  preferredContactMethod?: 'email' | 'dashboard' | 'both';
}

export const getNotificationPreferences = async (institutionId: string): Promise<NotificationPreferences> => {
  const authToken = getAuthToken();
  try {
    const response = await axios.get<{ preferences: NotificationPreferences }>(
      `${API_BASE}/institutions/${institutionId}/notification-preferences`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}` 
        },
      }
    );
    return response.data.preferences;
  } catch (error: any) {
    console.error('API call to get notification preferences failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch notification preferences.');
  }
};

export const updateNotificationPreferences = async (
  institutionId: string,
  preferences: NotificationPreferences
): Promise<{ message: string; preferences: NotificationPreferences }> => {
  const authToken = getAuthToken();
  try {
    const response = await axios.patch<{ message: string; preferences: NotificationPreferences }>(
      `${API_BASE}/institutions/${institutionId}/notification-preferences`,
      preferences,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` 
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('API call to update notification preferences failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to update notification preferences.');
  }
};
