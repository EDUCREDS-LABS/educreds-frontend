/**
 * Verifier Settings — /verifier/settings
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Bell, Shield, Building2, Key, Save, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type SettingsTab = "profile" | "notifications" | "security" | "api";

export default function VerifierSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<SettingsTab>("profile");

  const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
    { id: "profile",       label: "Profile",       icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell       },
    { id: "security",      label: "Security",      icon: Shield     },
    { id: "api",           label: "API Access",    icon: Key        },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your verifier workspace preferences</p>
      </div>

      {/* Tab nav */}
      <div className="flex rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-1 gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 flex-1 min-w-max py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                tab === t.id
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Profile */}
      {tab === "profile" && (
        <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
          <CardContent className="p-6 space-y-5">
            <p className="font-black text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">Organisation Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Organisation name",  value: (user as any)?.name ?? "" },
                { label: "Email",              value: user?.email ?? "" },
                { label: "Industry",           value: (user as any)?.industry ?? "" },
                { label: "Country",            value: (user as any)?.country ?? "" },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{f.label}</p>
                  <Input defaultValue={f.value} className="rounded-xl border-neutral-200 dark:border-neutral-700" />
                </div>
              ))}
            </div>
            <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="size-4" /> Save changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
          <CardContent className="p-6 space-y-4">
            <p className="font-black text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-widest mb-2">Notification Preferences</p>
            {[
              { label: "Verification complete",        sub: "Notify when a verification finishes",             on: true  },
              { label: "Verification failed",          sub: "Notify on failed or revoked credentials",          on: true  },
              { label: "Queue items pending",          sub: "Alert when queue exceeds 10 pending items",        on: false },
              { label: "Weekly summary",               sub: "Weekly digest of verification activity",           on: true  },
              { label: "API usage alerts",             sub: "Notify when approaching API rate limits",          on: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                <div>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{item.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{item.sub}</p>
                </div>
                <div className={cn("size-10 rounded-full flex items-center justify-center cursor-pointer transition-colors", item.on ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-700")}>
                  <div className={cn("size-4 rounded-full bg-white transition-transform", item.on ? "translate-x-1.5" : "-translate-x-1.5")} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Security */}
      {tab === "security" && (
        <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
          <CardContent className="p-6 space-y-4">
            <p className="font-black text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-widest mb-2">Security Settings</p>
            {[
              { label: "Two-factor authentication",  value: "Enabled",  badge: "green" },
              { label: "Session timeout",            value: "4 hours",  badge: "blue"  },
              { label: "IP allowlist",               value: "Disabled", badge: "amber" },
              { label: "Audit log retention",        value: "90 days",  badge: "blue"  },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-3 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{s.label}</p>
                <Badge className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-0",
                  s.badge === "green" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" :
                  s.badge === "amber" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400" :
                  "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                )}>
                  {s.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* API */}
      {tab === "api" && (
        <Card className="rounded-[24px] border-none shadow-md bg-white dark:bg-neutral-900">
          <CardContent className="p-6 space-y-4">
            <p className="font-black text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-widest mb-2">API Access</p>
            <p className="text-sm text-neutral-500">
              API keys and developer tools are managed in the Developer Portal.
            </p>
            <Button variant="outline" className="rounded-xl gap-2" asChild>
              <a href="/developer-portal" target="_blank" rel="noopener noreferrer">
                <Key className="size-4" /> Open Developer Portal
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
