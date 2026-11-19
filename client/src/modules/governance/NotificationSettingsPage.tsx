// educreds-frontend/src/modules/governance/NotificationSettingsPage.tsx
import React, { Suspense, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/modern/ErrorBoundary';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from '@/services/notification-settings';
import { useAuth } from '@/hooks/useAuth';

const NotificationSettingsForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const institutionId = user?.id ?? '';
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Fetch notification preferences with useQuery
  const { data: fetchedPreferences, isLoading: isLoadingPreferences, error: preferencesError } = useQuery<NotificationPreferences, Error>({
    queryKey: ['notificationPreferences', institutionId],
    queryFn: () => getNotificationPreferences(institutionId),
    enabled: !!institutionId,
  });

  // 2. Initialize local state when fetched data is available
  useEffect(() => {
    if (fetchedPreferences) {
      setPreferences(fetchedPreferences);
    }
  }, [fetchedPreferences]);
  
  // 3. Mutation for updating preferences
  const { mutate: savePreferences, isPending: isSaving, error: saveError } = useMutation({
    mutationFn: (updatedPreferences: NotificationPreferences) => updateNotificationPreferences(institutionId, updatedPreferences),
    onSuccess: (data) => {
      setSuccess('Notification preferences updated successfully!');
      setPreferences(data.preferences);
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences', institutionId] });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (type === 'checkbox') {
      setPreferences(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'contactEmails') {
      setPreferences(prev => ({ ...prev, [name]: value.split(',').map(email => email.trim()).filter(Boolean) }));
    } else {
      setPreferences(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    savePreferences(preferences);
  };
  
  const anyError = preferencesError || saveError;

  if (isLoadingPreferences) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
      <p className="text-gray-700">Manage how you receive updates and alerts from the EduCreds platform.</p>

      {anyError && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg">
          <p>Error: {anyError.message}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 text-green-800 rounded-lg">
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <input
            id="notificationsEnabled"
            name="notificationsEnabled"
            type="checkbox"
            checked={preferences.notificationsEnabled || false}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isSaving}
          />
          <label htmlFor="notificationsEnabled" className="ml-3 block text-sm font-medium text-gray-900">
            Enable All Notifications
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event-based Alerts</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input id="proposalUpdates" name="proposalUpdates" type="checkbox" checked={preferences.proposalUpdates || false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled={isSaving} />
                <label htmlFor="proposalUpdates" className="ml-3 block text-sm text-gray-900">DAO Proposal Updates</label>
              </div>
              <div className="flex items-center">
                <input id="governanceAlerts" name="governanceAlerts" type="checkbox" checked={preferences.governanceAlerts || false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled={isSaving} />
                <label htmlFor="governanceAlerts" className="ml-3 block text-sm text-gray-900">Governance Policy Alerts</label>
              </div>
              <div className="flex items-center">
                <input id="certificateEvents" name="certificateEvents" type="checkbox" checked={preferences.certificateEvents || false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled={isSaving} />
                <label htmlFor="certificateEvents" className="ml-3 block text-sm text-gray-900">Certificate Issuance/Revocation Events</label>
              </div>
              <div className="flex items-center">
                <input id="systemAnnouncements" name="systemAnnouncements" type="checkbox" checked={preferences.systemAnnouncements || false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled={isSaving} />
                <label htmlFor="systemAnnouncements" className="ml-3 block text-sm text-gray-900">System Announcements</label>
              </div>
              <div className="flex items-center">
                <input id="verificationStatus" name="verificationStatus" type="checkbox" checked={preferences.verificationStatus || false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" disabled={isSaving} />
                <label htmlFor="verificationStatus" className="ml-3 block text-sm text-gray-900">Credential Verification Status Updates</label>
              </div>
            </div>
          </div>

          <div>
            <div>
              <label htmlFor="contactEmails" className="block text-sm font-medium text-gray-700">Contact Emails (comma-separated)</label>
              <textarea id="contactEmails" name="contactEmails" rows={3} value={preferences.contactEmails?.join(', ') || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="email1@example.com, email2@example.com" disabled={isSaving}></textarea>
            </div>
            <div className="mt-4">
              <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700">Preferred Contact Method</label>
              <select id="preferredContactMethod" name="preferredContactMethod" value={preferences.preferredContactMethod || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" disabled={isSaving}>
                <option value="email">Email</option>
                <option value="dashboard">In-Dashboard</option>
                <option value="both">Email & In-Dashboard</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};

export const NotificationSettingsPage: React.FC = () => {
  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <NotificationSettingsForm />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

export default NotificationSettingsPage;
