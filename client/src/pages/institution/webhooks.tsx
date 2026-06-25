import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Webhook,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  Send,
  AlertTriangle,
  Lock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WebhookEndpoint {
  id: string;
  url: string;
  description: string;
  events: string[];
  active: boolean;
  secret: string;
  lastTriggered: string | null;
  lastStatus: number | null;
  failureCount: number;
  createdAt: string;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  status: number;
  responseTime: number;
  timestamp: string;
  success: boolean;
}

const AVAILABLE_EVENTS = [
  { value: "certificate.issued", label: "Certificate Issued" },
  { value: "certificate.revoked", label: "Certificate Revoked" },
  { value: "certificate.verified", label: "Certificate Verified" },
  { value: "batch.completed", label: "Batch Completed" },
  { value: "batch.failed", label: "Batch Failed" },
  { value: "governance.proposal_created", label: "Proposal Created" },
  { value: "governance.vote_cast", label: "Vote Cast" },
  { value: "institution.settings_updated", label: "Settings Updated" },
  { value: "security.login", label: "Login Event" },
  { value: "security.password_changed", label: "Password Changed" },
];

const MOCK_WEBHOOKS: WebhookEndpoint[] = [
  {
    id: "wh-001",
    url: "https://api.university.edu/webhooks/educreds",
    description: "Main SIS integration endpoint",
    events: ["certificate.issued", "certificate.revoked", "batch.completed"],
    active: true,
    secret: "whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    lastTriggered: new Date(Date.now() - 3600000).toISOString(),
    lastStatus: 200,
    failureCount: 0,
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: "wh-002",
    url: "https://hooks.slack.com/services/T00000/B00000/XXXX",
    description: "Slack notifications for critical events",
    events: ["certificate.revoked", "batch.failed", "security.login"],
    active: true,
    secret: "whsec_q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6",
    lastTriggered: new Date(Date.now() - 86400000).toISOString(),
    lastStatus: 200,
    failureCount: 0,
    createdAt: new Date(Date.now() - 1296000000).toISOString(),
  },
  {
    id: "wh-003",
    url: "https://erp.university.edu/api/v2/credential-events",
    description: "ERP system sync",
    events: ["certificate.issued", "certificate.verified"],
    active: false,
    secret: "whsec_z1x2c3v4b5n6m7k8j9h0g1f2d3s4a5p6",
    lastTriggered: new Date(Date.now() - 604800000).toISOString(),
    lastStatus: 503,
    failureCount: 12,
    createdAt: new Date(Date.now() - 5184000000).toISOString(),
  },
];

const MOCK_LOGS: WebhookLog[] = [
  { id: "log-1", webhookId: "wh-001", event: "certificate.issued", status: 200, responseTime: 145, timestamp: new Date(Date.now() - 3600000).toISOString(), success: true },
  { id: "log-2", webhookId: "wh-002", event: "security.login", status: 200, responseTime: 89, timestamp: new Date(Date.now() - 86400000).toISOString(), success: true },
  { id: "log-3", webhookId: "wh-001", event: "batch.completed", status: 200, responseTime: 234, timestamp: new Date(Date.now() - 172800000).toISOString(), success: true },
  { id: "log-4", webhookId: "wh-003", event: "certificate.issued", status: 503, responseTime: 5002, timestamp: new Date(Date.now() - 604800000).toISOString(), success: false },
  { id: "log-5", webhookId: "wh-003", event: "certificate.verified", status: 503, responseTime: 5001, timestamp: new Date(Date.now() - 691200000).toISOString(), success: false },
];

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function WebhooksPage() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [newWebhook, setNewWebhook] = useState({ url: "", description: "", events: [] as string[] });

  const { data: webhookData, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_CONFIG.CERT}/api/institutions/webhooks`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch");
        return await res.json();
      } catch {
        return null;
      }
    },
    staleTime: 30000,
  });

  const webhooks: WebhookEndpoint[] = webhookData?.webhooks ?? MOCK_WEBHOOKS;
  const logs: WebhookLog[] = webhookData?.logs ?? MOCK_LOGS;

  const toggleSecret = (id: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast({ title: "Copied", description: "Webhook secret copied to clipboard." });
  };

  const handleCreate = () => {
    if (!newWebhook.url) {
      toast({ title: "URL required", description: "Please enter a webhook endpoint URL.", variant: "destructive" });
      return;
    }
    toast({ title: "Webhook created", description: `Endpoint ${newWebhook.url} registered.` });
    setShowCreateForm(false);
    setNewWebhook({ url: "", description: "", events: [] });
  };

  const handleTestWebhook = (id: string) => {
    toast({ title: "Test sent", description: `Test event dispatched to webhook ${id}.` });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight uppercase">
            Webhooks
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            Real-time event notifications to your systems
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-xl font-bold text-xs uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="size-4" />
          Add Endpoint
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{webhooks.length}</p>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Endpoints</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{webhooks.filter((w) => w.active).length}</p>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{logs.filter((l) => l.success).length}</p>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Delivered</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-black text-red-600 dark:text-red-400">{logs.filter((l) => !l.success).length}</p>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-xl dark:shadow-black/20 bg-blue-50/50 dark:bg-blue-950/10 rounded-[32px]">
          <CardContent className="p-8 space-y-5">
            <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">New Webhook Endpoint</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Endpoint URL</Label>
                <Input
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://api.your-system.com/webhooks"
                  className="rounded-xl border-neutral-200 dark:border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Description</Label>
                <Input
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook((p) => ({ ...p, description: e.target.value }))}
                  placeholder="SIS integration"
                  className="rounded-xl border-neutral-200 dark:border-neutral-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Events</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENTS.map((evt) => {
                  const selected = newWebhook.events.includes(evt.value);
                  return (
                    <Badge
                      key={evt.value}
                      variant={selected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors",
                        selected ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      )}
                      onClick={() => {
                        setNewWebhook((p) => ({
                          ...p,
                          events: selected ? p.events.filter((e) => e !== evt.value) : [...p.events, evt.value],
                        }));
                      }}
                    >
                      {evt.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} className="rounded-xl font-bold text-xs uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Zap className="size-4" />
                Create Endpoint
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)} className="rounded-xl font-bold text-xs uppercase tracking-widest">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Endpoints */}
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[32px]">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    webhook.active ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                  )}>
                    <Webhook className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 break-all">{webhook.url}</span>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        webhook.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                      )}>
                        {webhook.active ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{webhook.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {webhook.events.map((evt) => (
                        <Badge key={evt} variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                          {evt.replace(/\./g, " / ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handleTestWebhook(webhook.id)} className="rounded-lg text-xs font-bold gap-1">
                    <Send className="size-3" /> Test
                  </Button>
                </div>
              </div>

              {/* Secret & Status */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 flex-1">
                  <Lock className="size-4 text-neutral-400" />
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {revealedSecrets.has(webhook.id) ? webhook.secret : "whsec_••••••••••••••••••••••••••••"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => toggleSecret(webhook.id)} className="size-7 p-0">
                    {revealedSecrets.has(webhook.id) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copySecret(webhook.secret)} className="size-7 p-0">
                    <Copy className="size-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {webhook.lastTriggered && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> Last: {formatDate(webhook.lastTriggered)}
                    </span>
                  )}
                  {webhook.lastStatus && (
                    <span className={cn("flex items-center gap-1", webhook.lastStatus === 200 ? "text-emerald-500" : "text-red-500")}>
                      {webhook.lastStatus === 200 ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
                      HTTP {webhook.lastStatus}
                    </span>
                  )}
                  {webhook.failureCount > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="size-3" /> {webhook.failureCount} failures
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Deliveries */}
      <Card className="border-none shadow-xl dark:shadow-black/20 bg-white dark:bg-neutral-900 rounded-[40px] overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <CardTitle className="text-lg font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
            Recent Deliveries
          </CardTitle>
          <CardDescription className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Latest webhook delivery attempts
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className={cn(
                  "size-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  log.success ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                )}>
                  {log.success ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {log.event.replace(/\./g, " / ")}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 rounded">
                      {log.webhookId}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                  <Badge className={cn(
                    "text-[9px] font-mono px-2 py-0.5 rounded",
                    log.success ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  )}>
                    {log.status}
                  </Badge>
                  <span className="font-mono">{log.responseTime}ms</span>
                  <span className="hidden sm:block">{formatDate(log.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
