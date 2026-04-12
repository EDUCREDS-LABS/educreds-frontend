import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Key, Bell, Mail, Smartphone, Globe, AlertTriangle, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { developerPortalApi } from "@/lib/developerPortalApi";
import BatchSigningSettings from "./BatchSigningSettings";

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
  <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
        {Icon}
      </div>
      <div className="flex-1">
        <Label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{label}</Label>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center">
        {checked ? (
          <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 font-bold text-xs px-3 py-1">
            <Check className="w-3 h-3 mr-1" />
            Enabled
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs px-3 py-1">
            <X className="w-3 h-3 mr-1" />
            Disabled
          </Badge>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="ml-2"
      />
    </div>
  </div>
);

export default function InstitutionSettings() {
  const { user } = useAuth();
  const institutionId = user?.institutionId || user?.id;
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

      toast({
        title: "Settings saved",
        description: "Your institution preferences have been updated.",
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
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Institution Settings</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">Manage your account preferences and security settings</p>
      </div>

      {/* Batch Signing Settings - NEW */}
      <BatchSigningSettings />

      {/* Security Settings */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <Shield className="w-5 h-5 text-primary" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Two-Factor Authentication</Label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Add an extra layer of security to your account</p>
            </div>
            <div className="flex items-center gap-3">
              {settings.twoFactorAuth ? (
                <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 font-bold text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs">
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
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Change Password</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input type="password" placeholder="Current password" disabled />
              <Input type="password" placeholder="New password" disabled />
            </div>
            <Button size="sm" disabled>Update Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* API Access */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <Key className="w-5 h-5 text-primary" />
            API Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Enable API Access</Label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Allow programmatic access to your institution data</p>
            </div>
            <Switch
              checked={settings.apiAccess}
              onCheckedChange={handleApiAccessToggle}
              disabled={isKeyLoading || isKeyAction}
            />
          </div>
          
          {settings.apiAccess && (
            <>
              <Separator />
              <div className="space-y-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">API Key</Label>
                <div className="flex gap-2">
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
                    className="font-mono text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateKey}
                    disabled={isKeyLoading || isKeyAction}
                    className="border-neutral-200 dark:border-neutral-700"
                  >
                    {isKeyAction ? "Working..." : "Regenerate"}
                  </Button>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Keep your API key secure and never share it publicly. Full keys are only shown once after creation.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <Bell className="w-5 h-5 text-primary" />
            Notification Preferences
          </CardTitle>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Manage how and when you receive notifications from EduCreds</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <NotificationItem
            icon={<Mail className="w-4 h-4" />}
            label="Email Notifications"
            description="Receive updates about certificates and activities"
            checked={settings.emailNotifications}
            onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
          />
          
          <NotificationItem
            icon={<Smartphone className="w-4 h-4" />}
            label="SMS Notifications"
            description="Get important alerts via text message"
            checked={settings.smsNotifications}
            onChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
          />
          
          <NotificationItem
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Security Alerts"
            description="Notifications about security events and suspicious activity"
            checked={settings.securityAlerts}
            onChange={(checked) => setSettings({ ...settings, securityAlerts: checked })}
          />
          
          <NotificationItem
            icon={<Mail className="w-4 h-4" />}
            label="Marketing Emails"
            description="Product updates and educational content"
            checked={settings.marketingEmails}
            onChange={(checked) => setSettings({ ...settings, marketingEmails: checked })}
          />
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <Globe className="w-5 h-5 text-primary" />
            Privacy & Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Public Profile</Label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Make your institution discoverable in public directories</p>
            </div>
            <Switch
              checked={settings.publicProfile}
              onCheckedChange={(checked) => setSettings({ ...settings, publicProfile: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex justify-end pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-2.5 rounded-lg transition-all shadow-lg"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
