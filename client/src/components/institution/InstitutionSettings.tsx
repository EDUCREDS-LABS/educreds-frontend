import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Shield, Key, Bell, Mail, Smartphone, Globe, AlertTriangle, Check, X, ShieldCheck, ExternalLink, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { api } from "@/lib/api";
import { developerPortalApi } from "@/lib/developerPortalApi";
import {
  useInstitutionNotificationPreferences,
  useUpdateInstitutionNotificationPreferences,
} from "@/hooks/useNotifications";


// Notification setting item with enhanced visual feedback
const NotificationItem = ({ 
  icon: Icon, 
  label, 
  description, 
  checked, 
  onChange 
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 transition-colors">
    <div className="flex items-center gap-5 flex-1">
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center text-primary shadow-sm">
        {Icon}
      </div>
      <div className="flex-1">
        <Label className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">{label}</Label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Badge className={cn(
        "border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm",
        checked 
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" 
            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      )}>
        {checked ? "Enabled" : "Disabled"}
      </Badge>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  </div>
);

export default function InstitutionSettings() {
  const { user } = useAuth();
  const institutionId = user?.organizationId || user?.id;
  const tier = (user as any)?.deploymentTier ?? (user as any)?.tier ?? 'workspace';
  const hasApiAccess = tier === 'connector' || tier === 'enterprise' || (user as any)?.plan?.apiAccess === true;
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    securityAlerts: true,
    publicProfile: true,
    apiAccess: false,
    twoFactorAuth: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState<string | null>(null);
  const [apiKeyPrefix, setApiKeyPrefix] = useState<string | null>(null);
  const [apiKeyId, setApiKeyId] = useState<string | null>(null);
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [isKeyAction, setIsKeyAction] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    notificationsEnabled: true,
    proposalUpdates: true,
    governanceAlerts: true,
    certificateEvents: true,
    systemAnnouncements: true,
    verificationStatus: true,
    preferredContactMethod: "email",
  });
  const { data: notificationPreferencesData, isLoading: notificationSettingsLoading } = useInstitutionNotificationPreferences();
  const updateNotificationPreferencesMutation = useUpdateInstitutionNotificationPreferences();

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_CONFIG.INSTITUTIONS.PROFILE_SETTINGS, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
          }
        });

        if (!response.ok) {
          throw new Error("Failed to load institution settings");
        }

        const data = await response.json();
        setSettings((prevSettings) => ({
          ...prevSettings,
          ...data.settings
        }));
      } catch (error) {
        console.error(error);
        toast({
          title: "Unable to load settings",
          description: "Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [institutionId, toast]);

  useEffect(() => {
    const payload = notificationPreferencesData?.preferences || notificationPreferencesData;
    if (!payload || typeof payload !== "object" || !("proposalUpdates" in payload)) {
      return;
    }

    setNotificationSettings((prev) => ({
      ...prev,
      notificationsEnabled: payload.notificationsEnabled ?? prev.notificationsEnabled,
      proposalUpdates: payload.proposalUpdates ?? prev.proposalUpdates,
      governanceAlerts: payload.governanceAlerts ?? prev.governanceAlerts,
      certificateEvents: payload.certificateEvents ?? prev.certificateEvents,
      systemAnnouncements: payload.systemAnnouncements ?? prev.systemAnnouncements,
      verificationStatus: payload.verificationStatus ?? prev.verificationStatus,
      preferredContactMethod: payload.preferredContactMethod ?? prev.preferredContactMethod,
    }));
  }, [notificationPreferencesData]);

  useEffect(() => {
    if (!institutionId) {
      return;
    }

    let isCancelled = false;
    const fetchApiKeys = async () => {
      setIsKeyLoading(true);
      try {
        const keys = await developerPortalApi.getKeys();
        if (isCancelled) return;
        const activeKeys = keys.filter((key) => key.isActive);
        if (activeKeys.length > 0) {
          const latestKey = activeKeys.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          setApiKeyPrefix(latestKey.prefix);
          setApiKeyId(latestKey.id);
          setSettings((prevSettings) => ({ ...prevSettings, apiAccess: true }));
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Unable to load API keys",
          description: "Please try again later.",
          variant: "destructive"
        });
      } finally {
        if (!isCancelled) {
          setIsKeyLoading(false);
        }
      }
    };

    fetchApiKeys();
    return () => {
      isCancelled = true;
    };
  }, [institutionId, toast]);

  const createApiKey = async () => {
    setIsKeyAction(true);
    try {
      const createdKey = await developerPortalApi.generateKey({
        name: "Institution API Key",
        expiry: "never"
      });

      setApiKeyValue(createdKey.apiKey ?? null);
      setApiKeyPrefix(createdKey.prefix);
      setApiKeyId(createdKey.id);

      toast({
        title: "API key generated",
        description: "Copy your key now. You won't be able to view it again.",
        variant: "default"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "API key creation failed",
        description: "Please try again or manage keys in the Developer Portal.",
        variant: "destructive"
      });
      setSettings((prevSettings) => ({ ...prevSettings, apiAccess: false }));
    } finally {
      setIsKeyAction(false);
    }
  };

  const revokeApiKey = async () => {
    if (!apiKeyId) return;
    setIsKeyAction(true);
    try {
      await developerPortalApi.revokeKey(apiKeyId);
      setApiKeyValue(null);
      setApiKeyPrefix(null);
      setApiKeyId(null);
      toast({
        title: "API key revoked",
        description: "API access has been disabled.",
        variant: "default"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to revoke key",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsKeyAction(false);
    }
  };

  const handleApiAccessToggle = async (checked: boolean) => {
    const hasKey = Boolean(apiKeyId || apiKeyPrefix || apiKeyValue);
    if (checked) {
      setSettings((prevSettings) => ({ ...prevSettings, apiAccess: true }));
      if (!hasKey) {
        await createApiKey();
      }
      return;
    }

    setSettings((prevSettings) => ({ ...prevSettings, apiAccess: false }));
    if (apiKeyId) {
      await revokeApiKey();
    } else {
      setApiKeyValue(null);
      setApiKeyPrefix(null);
      setApiKeyId(null);
    }
  };

  const handleRegenerateKey = async () => {
    setIsKeyAction(true);
    try {
      if (apiKeyId) {
        await developerPortalApi.revokeKey(apiKeyId);
      }

      const createdKey = await developerPortalApi.generateKey({
        name: "Institution API Key",
        expiry: "never"
      });

      setApiKeyValue(createdKey.apiKey ?? null);
      setApiKeyPrefix(createdKey.prefix);
      setApiKeyId(createdKey.id);
      setSettings((prevSettings) => ({ ...prevSettings, apiAccess: true }));

      toast({
        title: "API key regenerated",
        description: "Copy your new key now. You won't be able to view it again.",
        variant: "default"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Regeneration failed",
        description: "Please try again or manage keys in the Developer Portal.",
        variant: "destructive"
      });
    } finally {
      setIsKeyAction(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(API_CONFIG.INSTITUTIONS.PROFILE_SETTINGS, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      await updateNotificationPreferencesMutation.mutateAsync({
        notificationsEnabled: notificationSettings.notificationsEnabled,
        proposalUpdates: notificationSettings.proposalUpdates,
        governanceAlerts: notificationSettings.governanceAlerts,
        certificateEvents: notificationSettings.certificateEvents,
        systemAnnouncements: notificationSettings.systemAnnouncements,
        verificationStatus: notificationSettings.verificationStatus,
        preferredContactMethod: notificationSettings.preferredContactMethod as "email" | "dashboard" | "both",
      });

      toast({
        title: "Settings saved",
        description: "Your institution and notification preferences have been updated.",
        variant: "default"
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Save failed",
        description: "Could not update your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordInputChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Incomplete information",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation must match.",
        variant: "destructive"
      });
      return;
    }

    setIsPasswordUpdating(true);
    try {
      await api.changeInstitutionPassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast({
        title: "Password updated",
        description: "Your institution password has been changed successfully.",
        variant: "default"
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update your password.",
        variant: "destructive"
      });
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-72 rounded-md" />
          <Skeleton className="mt-2 h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-10 p-2 sm:p-4">
      <div className="pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tighter">Institution Settings</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-3 text-lg font-medium">Manage your account preferences and security parameters.</p>
      </div>

      {/* Credential Signing Authority */}
      <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="size-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">Credential Signing Authority</h3>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed">
              All credentials issued by your institution are cryptographically signed by EduCreds on your behalf using your institution's embedded identity. No manual key management is required.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Platform Managed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900 dark:text-neutral-100">
            <Shield className="w-6 h-6 text-primary" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-10">
          <div className="flex items-center justify-between p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="space-y-1">
              <Label className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">Two-Factor Authentication</Label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Add an extra layer of security to your account.</p>
            </div>
            <div className="flex items-center gap-3">
              {settings.twoFactorAuth ? (
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                  <Check className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                  <X className="w-3 h-3 mr-1" />
                  Disabled
                </Badge>
              )}
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
              />
            </div>
          </div>
          
          <div className="space-y-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <h3 className="text-lg font-black tracking-tight">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                type="password"
                placeholder="Current password"
                className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
                value={passwordForm.currentPassword}
                onChange={(event) => handlePasswordInputChange('currentPassword', event.target.value)}
              />
              <Input
                type="password"
                placeholder="New password"
                className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
                value={passwordForm.newPassword}
                onChange={(event) => handlePasswordInputChange('newPassword', event.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                className="h-14 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
                value={passwordForm.confirmPassword}
                onChange={(event) => handlePasswordInputChange('confirmPassword', event.target.value)}
              />
            </div>
            <Button size="lg" onClick={handleUpdatePassword} disabled={isPasswordUpdating} className="h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-2xl">
              {isPasswordUpdating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
...

      {/* API Access - Tier Gated */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900 dark:text-neutral-100">
            <Key className="w-6 h-6 text-primary" />
            API Access
          </CardTitle>
          <CardDescription className="text-neutral-500 dark:text-neutral-400 font-medium mt-1">Programmatic access to your institution data</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          {hasApiAccess ? (
            <>
              <div className="flex items-center justify-between p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="space-y-1">
                  <Label className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">Enable API Access</Label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Allow programmatic access to your institution data</p>
                </div>
                <Switch
                  checked={settings.apiAccess}
                  onCheckedChange={handleApiAccessToggle}
                  disabled={isKeyLoading || isKeyAction}
                />
              </div>
              
              {settings.apiAccess && (
                <div className="space-y-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                    <Label className="text-xs font-black uppercase tracking-widest text-neutral-400">API Key</Label>
                    <div className="flex gap-4">
                      <Input
                        value={
                          apiKeyValue
                            ? apiKeyValue
                            : apiKeyPrefix
                            ? `${apiKeyPrefix}••••••••`
                            : ""
                        }
                        placeholder={isKeyLoading ? "Loading API key..." : "No API key generated yet"}
                        readOnly
                        className="h-14 rounded-2xl font-mono text-sm bg-neutral-50 dark:bg-neutral-800 border-none shadow-inner"
                      />
                      <Button
                        variant="outline"
                        onClick={handleRegenerateKey}
                        disabled={isKeyLoading || isKeyAction}
                        className="h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
                      >
                        {isKeyAction ? "Working..." : "Regenerate"}
                      </Button>
                    </div>
                  </div>
              )}
            </>
          ) : (
            <div className="p-6 rounded-3xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-neutral-900 dark:text-neutral-100">API Access Requires Upgrade</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    API access is available on Connector and Enterprise tiers. Upgrade your subscription to enable programmatic access to your institution data.
                  </p>
                  <Button variant="outline" className="rounded-xl font-black text-xs uppercase tracking-widest mt-2" asChild>
                    <Link to="/institution/billing">View Plans</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900 dark:text-neutral-100">
            <Bell className="w-6 h-6 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-neutral-400">Manage how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-6">
          <NotificationItem
            icon={<Mail className="w-5 h-5" />}
            label="Master Notifications"
            description="Enable or disable all institution notifications"
            checked={notificationSettings.notificationsEnabled}
            onChange={(checked) =>
              setNotificationSettings((prev) => ({
                ...prev,
                notificationsEnabled: checked,
              }))
            }
          />

          <NotificationItem
            icon={<Bell className="w-5 h-5" />}
            label="Certificate Events"
            description="Issuance and revocation updates"
            checked={notificationSettings.certificateEvents}
            onChange={(checked) =>
              setNotificationSettings((prev) => ({
                ...prev,
                certificateEvents: checked,
              }))
            }
          />

          <NotificationItem
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Governance Alerts"
            description="Critical governance and policy notifications"
            checked={notificationSettings.governanceAlerts}
            onChange={(checked) =>
              setNotificationSettings((prev) => ({
                ...prev,
                governanceAlerts: checked,
              }))
            }
          />

          <NotificationItem
            icon={<Mail className="w-5 h-5" />}
            label="Proposal Updates"
            description="Proposal submissions, reviews, and status updates"
            checked={notificationSettings.proposalUpdates}
            onChange={(checked) =>
              setNotificationSettings((prev) => ({
                ...prev,
                proposalUpdates: checked,
              }))
            }
          />

          <NotificationItem
            icon={<Shield className="w-5 h-5" />}
            label="Verification Status"
            description="Institution verification and compliance status alerts"
            checked={notificationSettings.verificationStatus}
            onChange={(checked) =>
              setNotificationSettings((prev) => ({
                ...prev,
                verificationStatus: checked,
              }))
            }
          />

          <NotificationItem
            icon={<Globe className="w-5 h-5" />}
            label="System Announcements"
            description="Platform maintenance and system-wide updates"
            checked={notificationSettings.systemAnnouncements}
            onChange={(checked) =>
              setNotificationSettings((prev) => ({
                ...prev,
                systemAnnouncements: checked,
              }))
            }
          />

          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">
            {notificationSettingsLoading ? "Loading synced notification preferences..." : "Notification preferences are synced with backend on save."}
          </p>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900 dark:text-neutral-100">
            <Globe className="w-6 h-6 text-primary" />
            Privacy & Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10">
          <div className="flex items-center justify-between p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="space-y-1">
              <Label className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">Public Profile</Label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">Make your institution discoverable in public directories</p>
            </div>
            <Switch
              checked={settings.publicProfile}
              onCheckedChange={(checked) => setSettings({ ...settings, publicProfile: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Identity & Keys - Navigation to DID Management */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900 dark:text-neutral-100">
            <Key className="w-6 h-6 text-primary" />
            Identity & Keys
          </CardTitle>
          <CardDescription className="text-neutral-500 dark:text-neutral-400 font-medium mt-1">Manage your decentralized identity, blockchain registration, and key rotation</CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-[24px] border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">DID Control Panel</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  View your DID status, blockchain registration, wallet address, and rotate keys.
                </p>
              </div>
              <Link to="/institution/did-management">
                <Button variant="outline" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                  Manage Identity <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credential Issuance Settings */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900 dark:text-neutral-100">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Credential Issuance Defaults
          </CardTitle>
          <CardDescription className="text-neutral-500 dark:text-neutral-400 font-medium mt-1">Default settings applied to all newly issued credentials</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Default Credential Expiry (days)</Label>
              <input
                type="number"
                min={0}
                placeholder="365 (0 = never expires)"
                className="flex h-14 w-full rounded-2xl border-none bg-neutral-50 dark:bg-neutral-900 px-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Batch Size Limit</Label>
              <div className="flex h-14 items-center px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 shadow-inner">
                <span className="text-sm font-bold text-neutral-500">500 credentials / batch (plan limit)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="space-y-1">
              <Label className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">Auto-Issuance</Label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">Automatically issue credentials when student records are verified</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings - Navigation to White-Label */}
      <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
        <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900 dark:text-neutral-100">
            <Palette className="w-6 h-6 text-primary" />
            Branding & White-Label
          </CardTitle>
          <CardDescription className="text-neutral-500 dark:text-neutral-400 font-medium mt-1">Customize your institution's appearance on EduCreds</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-4">
          {/* Credential Design - PDF Certificate Templates */}
          <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-[24px] border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Credential Design Studio</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Design how your academic certificates look when downloaded as PDFs. Choose from templates or upload custom layouts.
                </p>
              </div>
              <Link to="/institution/credential-design">
                <Button variant="outline" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                  Design Credentials <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* White Label - Verification Card Branding */}
          <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-[24px] border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">White Label Branding</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Customize your institution logo, brand colors, and email settings for verification cards and public-facing pages.
                </p>
              </div>
              <Link to="/institution/white-label">
                <Button variant="outline" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                  Brand Settings <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connector Settings — only for connector-tier institutions */}
      {(() => {
        const tier = (user as any)?.deploymentTier ?? (user as any)?.tier ?? 'workspace';
        if (tier === 'workspace') return null;
        return (
          <Card className="border-none shadow-2xl shadow-neutral-200/50 dark:shadow-black/20 rounded-[40px] overflow-hidden bg-white dark:bg-neutral-900">
            <CardHeader className="p-10 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-neutral-900 dark:text-neutral-100">
                <AlertTriangle className="w-6 h-6 text-primary" />
                Connector Settings
              </CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400 font-medium mt-1">
                Configure your LMS / SIS connector endpoint and sync schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Connector API URL</Label>
                  <input
                    type="url"
                    placeholder="https://your-lms.edu/api/educreds-connector"
                    className="flex h-14 w-full rounded-2xl border-none bg-neutral-50 dark:bg-neutral-900 px-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Sync Interval</Label>
                  <select className="flex h-14 w-full rounded-2xl border-none bg-neutral-50 dark:bg-neutral-900 px-4 text-sm font-bold shadow-inner outline-none">
                    <option value="manual">Manual</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Connector Status</Label>
                  <div className="flex h-14 items-center gap-3 px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 shadow-inner">
                    <div className="size-2 rounded-full bg-neutral-300" />
                    <span className="text-sm font-bold text-neutral-500">Not configured</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Save Changes */}
      <div className="flex justify-end pt-10 border-t border-neutral-100 dark:border-neutral-800">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || updateNotificationPreferencesMutation.isPending}
          className="h-16 px-12 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-primary text-white shadow-2xl transition-all hover:scale-[1.02]"
        >
          {isSaving || updateNotificationPreferencesMutation.isPending ? "Synchronizing..." : "Synchronize Settings"}
        </Button>
      </div>
    </div>
  );
}
