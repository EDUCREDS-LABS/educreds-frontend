import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Bell, Mail, Smartphone, Globe, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function InstitutionSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    securityAlerts: true,
    publicProfile: true,
    apiAccess: false,
    twoFactorAuth: false
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Institution Settings</h1>
        <p className="text-neutral-600">Manage your account preferences and security settings</p>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-neutral-600">Add an extra layer of security to your account</p>
            </div>
            <div className="flex items-center gap-2">
              {settings.twoFactorAuth ? (
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
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
              <Input type="password" placeholder="Current password" />
              <Input type="password" placeholder="New password" />
            </div>
            <Button size="sm">Update Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* API Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable API Access</Label>
              <p className="text-sm text-neutral-600">Allow programmatic access to your institution data</p>
            </div>
            <Switch
              checked={settings.apiAccess}
              onCheckedChange={(checked) => setSettings({ ...settings, apiAccess: checked })}
            />
          </div>
          
          {settings.apiAccess && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input value="sk_test_..." readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="sm">Regenerate</Button>
                </div>
                <p className="text-xs text-neutral-600">Keep your API key secure and never share it publicly</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-600" />
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-neutral-600">Receive updates about certificates and activities</p>
              </div>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-neutral-600" />
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-neutral-600">Get important alerts via text message</p>
              </div>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-neutral-600" />
              <div>
                <Label>Security Alerts</Label>
                <p className="text-sm text-neutral-600">Notifications about security events</p>
              </div>
            </div>
            <Switch
              checked={settings.securityAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, securityAlerts: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-600" />
              <div>
                <Label>Marketing Emails</Label>
                <p className="text-sm text-neutral-600">Product updates and educational content</p>
              </div>
            </div>
            <Switch
              checked={settings.marketingEmails}
              onCheckedChange={(checked) => setSettings({ ...settings, marketingEmails: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Privacy & Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Public Profile</Label>
              <p className="text-sm text-neutral-600">Make your institution discoverable in public directories</p>
            </div>
            <Switch
              checked={settings.publicProfile}
              onCheckedChange={(checked) => setSettings({ ...settings, publicProfile: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}