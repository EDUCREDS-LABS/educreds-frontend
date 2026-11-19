/**
 * Institution Webhooks — /institution/webhooks
 * Full CRUD: list, add, delete, test webhook endpoints.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Play, Copy, Check, RefreshCw, Globe, Zap, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { API_CONFIG } from "@/config/api";
import { getAnyAuthToken } from "@/lib/authStorage";

const WEBHOOKS_URL = `${API_CONFIG.INSTITUTIONS.BASE}/me/webhooks`;

/** Institution endpoints are bearer-authenticated and live on the cert backend,
 *  which is a different origin from the static frontend in deployed envs. */
function authHeaders(withBody = false): Record<string, string> {
  const token = getAnyAuthToken();
  return {
    ...(withBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const EVENT_OPTIONS = [
  { id: "credential.issued",       label: "Credential Issued",       desc: "Fires when a credential is successfully issued." },
  { id: "credential.revoked",      label: "Credential Revoked",      desc: "Fires when a credential is revoked." },
  { id: "verification.completed",  label: "Verification Completed",  desc: "Fires when a third party verifies a credential." },
  { id: "batch.completed",         label: "Batch Completed",         desc: "Fires when a bulk issuance batch finishes." },
];

function generateSecret(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  /** Present only on create / rotate responses — never on list. */
  secret?: string;
  secretPreview?: string;
  createdAt: string;
}

interface WebhookFormData {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  /** When editing, only send a new secret if the operator regenerated it. */
  rotateSecret?: boolean;
}

/** Mirrors the backend WebhookDeliveryLog entity (webhook_delivery_logs).
 *  Note the backend keys these by institutionId and targetUrl, not by a
 *  webhook id, so history is institution-wide rather than per-webhook. */
interface WebhookDelivery {
  id: string;
  eventType: string;
  targetUrl: string;
  payload: string;
  attempt: number;
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
  latencyMs: number | null;
  createdAt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="ml-1 text-neutral-400 hover:text-neutral-600 transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function WebhooksPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebhookFormData>({
    url: "", events: [], secret: generateSecret(), active: true, rotateSecret: false,
  });
  const [urlError, setUrlError] = useState("");
  const [secretPreview, setSecretPreview] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  // ── Fetch webhooks ────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<Webhook[]>({
    queryKey: ["institution-webhooks"],
    queryFn: async () => {
      const res = await fetch(WEBHOOKS_URL, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load webhooks");
      const json = await res.json();
      return Array.isArray(json) ? json : (json.webhooks ?? []);
    },
    staleTime: 60_000,
  });
  const webhooks: Webhook[] = data ?? [];

  // ── Delivery history (live webhook_delivery_logs) ─────────────────────────
  const {
    data: deliveryData,
    isLoading: deliveriesLoading,
    isError: deliveriesError,
    refetch: refetchDeliveries,
  } = useQuery<{ deliveries: WebhookDelivery[] }>({
    queryKey: ["institution-webhook-deliveries"],
    queryFn: async () => {
      const res = await fetch(`${WEBHOOKS_URL}/deliveries?limit=50`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load delivery history");
      const json = await res.json();
      const rows = Array.isArray(json) ? json : (json.deliveries ?? []);
      return { deliveries: rows as WebhookDelivery[] };
    },
    staleTime: 30_000,
  });

  const deliveries = deliveryData?.deliveries ?? [];
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

  // ── Add webhook ───────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async (body: WebhookFormData) => {
      const res = await fetch(WEBHOOKS_URL, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to add webhook");
      return res.json();
    },
    onSuccess: (created: Webhook) => {
      toast({
        title: "Webhook added",
        description: created.secret
          ? "Copy the signing secret now — it will not be shown again."
          : "Your webhook endpoint has been registered.",
      });
      if (created.secret) setRevealedSecret(created.secret);
      qc.invalidateQueries({ queryKey: ["institution-webhooks"] });
      setDialogOpen(false);
      setForm({ url: "", events: [], secret: generateSecret(), active: true, rotateSecret: false });
      setSecretPreview(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ── Delete webhook ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const res = await fetch(`${WEBHOOKS_URL}/${webhookId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete webhook");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Webhook removed" });
      qc.invalidateQueries({ queryKey: ["institution-webhooks"] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ── Test webhook ──────────────────────────────────────────────────────────
  const testMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const res = await fetch(`${WEBHOOKS_URL}/${webhookId}/test`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Test ping failed");
      return res.json();
    },
    onSuccess: (result: { success?: boolean; error?: string }) => {
      if (result?.success === false) {
        toast({
          title: "Test failed",
          description: result.error ?? "Delivery was refused or the endpoint did not accept the payload.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Test sent", description: "A signed test payload was delivered to your endpoint." });
    },
    onError: (err: Error) => toast({ title: "Test failed", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: WebhookFormData }) => {
      const payload: Record<string, unknown> = {
        url: body.url,
        events: body.events,
        active: body.active,
      };
      if (body.rotateSecret) {
        payload.rotateSecret = true;
        payload.secret = body.secret;
      }
      const res = await fetch(`${WEBHOOKS_URL}/${id}`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to update webhook");
      }
      return res.json();
    },
    onSuccess: (updated: Webhook) => {
      toast({
        title: "Webhook updated",
        description: updated.secret
          ? "Copy the new signing secret now — it will not be shown again."
          : undefined,
      });
      if (updated.secret) setRevealedSecret(updated.secret);
      qc.invalidateQueries({ queryKey: ["institution-webhooks"] });
      setDialogOpen(false);
      setEditingId(null);
      setSecretPreview(null);
    },
    onError: (err: Error) => toast({ title: "Could not save changes", description: err.message, variant: "destructive" }),
  });

  const retryMutation = useMutation({
    mutationFn: async (delivery: WebhookDelivery) => {
      const res = await fetch(`${WEBHOOKS_URL}/deliveries/${delivery.id}/retry`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Retry failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Retry sent", description: "Payload was re-delivered to the original endpoint." });
      qc.invalidateQueries({ queryKey: ["institution-webhook-deliveries"] });
    },
    onError: (err: Error) => toast({ title: "Retry failed", description: err.message, variant: "destructive" }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEventToggle = (eventId: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const handleSubmit = () => {
    if (!form.url.startsWith("https://")) {
      setUrlError("URL must start with https://");
      return;
    }
    if (form.events.length === 0) {
      toast({ title: "Select at least one event", variant: "destructive" });
      return;
    }
    setUrlError("");
    if (editingId) {
      updateMutation.mutate({ id: editingId, body: form });
      return;
    }
    addMutation.mutate(form);
  };

  const openDialog = () => {
    setEditingId(null);
    setForm({ url: "", events: [], secret: generateSecret(), active: true, rotateSecret: false });
    setSecretPreview(null);
    setUrlError("");
    setDialogOpen(true);
  };

  const openEdit = (webhook: Webhook) => {
    setEditingId(webhook.id);
    setForm({
      url: webhook.url,
      events: webhook.events ?? [],
      secret: "",
      active: webhook.active,
      rotateSecret: false,
    });
    setSecretPreview(webhook.secretPreview ?? "••••");
    setUrlError("");
    setDialogOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="size-4 text-primary" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Institution</p>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Webhooks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Receive real-time HTTP notifications when events occur in your institution.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" className="rounded-xl h-9 gap-2" onClick={openDialog}>
            <Plus className="w-3.5 h-3.5" /> Add Webhook
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configured" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="configured" className="rounded-lg">Configured</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">Delivery History</TabsTrigger>
        </TabsList>

        <TabsContent value="configured">
      {/* List */}
      <Card className="rounded-[24px] border">
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-base font-bold">Configured Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-0">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : isError ? (
            <div className="text-center py-16">
              <Globe className="size-10 text-destructive/30 mx-auto mb-3" />
              <p className="font-bold text-destructive">Could not load your webhooks.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check that you are still signed in, then try again.
              </p>
              <Button size="sm" variant="outline" className="mt-4 rounded-xl gap-2" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </Button>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="size-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-bold text-muted-foreground">No webhooks configured.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add one to receive real-time notifications.
              </p>
              <Button size="sm" className="mt-4 rounded-xl gap-2" onClick={openDialog}>
                <Plus className="w-3.5 h-3.5" /> Add Webhook
              </Button>
            </div>
          ) : (
            webhooks.map((wh, i) => (
              <div key={wh.id ?? i} className="py-4 border-b last:border-0 group">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <code className="text-sm font-mono font-bold truncate max-w-xs">{wh.url}</code>
                      <Badge className={cn(
                        "text-[10px] font-black rounded-full px-2 py-0.5",
                        wh.active
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-neutral-100 text-neutral-500 border-neutral-200"
                      )}>
                        {wh.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(wh.events ?? []).map(ev => (
                        <span key={ev} className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {ev}
                        </span>
                      ))}
                    </div>
                    {wh.createdAt && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Created {format(new Date(wh.createdAt), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 text-xs font-bold rounded-xl gap-1"
                        onClick={() => openEdit(wh)}
                      >
                        Edit
                      </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-8 text-xs font-bold rounded-xl text-blue-600 gap-1"
                      onClick={() => testMutation.mutate(wh.id)}
                      disabled={testMutation.isPending}
                    >
                      <Play className="w-3 h-3" /> Test
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-8 w-8 p-0 rounded-xl text-destructive"
                      onClick={() => deleteMutation.mutate(wh.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-[24px] border">
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-base font-bold">Delivery History</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-0">
              {deliveriesError && (
                <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-destructive font-medium">Could not load delivery history.</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl" onClick={() => refetchDeliveries()}>
                    Retry
                  </Button>
                </div>
              )}

              {deliveriesLoading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : deliveries.length === 0 && !deliveriesError ? (
                <div className="text-center py-16">
                  <Zap className="size-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="font-bold text-muted-foreground">No deliveries yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Attempts appear here once an event fires.
                  </p>
                </div>
              ) : (
                deliveries.map(d => (
                  <div key={d.id} className="py-4 border-b last:border-0 group">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <code className="text-sm font-mono font-bold">{d.eventType}</code>
                          <Badge className={cn(
                            "text-[10px] font-black rounded-full px-2 py-0.5",
                            d.success
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          )}>
                            {d.statusCode ? d.statusCode : "No response"}
                            {d.success ? " OK" : " Failed"}
                          </Badge>
                          {d.attempt > 1 && (
                            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              attempt {d.attempt}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(d.createdAt), "dd MMM yyyy HH:mm")}
                          {d.latencyMs !== null && ` · ${d.latencyMs} ms`}
                        </p>
                        {d.errorMessage && (
                          <p className="text-xs text-destructive mt-1 truncate">{d.errorMessage}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!d.success && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-8 text-xs font-bold rounded-xl"
                            onClick={() => retryMutation.mutate(d)}
                            disabled={retryMutation.isPending}
                          >
                            Retry
                          </Button>
                        )}
                        <Button
                          size="sm" variant="ghost"
                          className="h-8 text-xs font-bold rounded-xl text-blue-600"
                          onClick={() => setSelectedDelivery(d)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delivery detail */}
      <Dialog open={Boolean(selectedDelivery)} onOpenChange={open => !open && setSelectedDelivery(null)}>
        <DialogContent className="max-w-lg rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Delivery Detail</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest">Event</Label>
                <p className="text-sm font-mono">{selectedDelivery.eventType}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest">Target</Label>
                <p className="text-sm font-mono break-all">{selectedDelivery.targetUrl}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest">Result</Label>
                <p className="text-sm">
                  {selectedDelivery.statusCode ?? "No response"}
                  {" · attempt "}{selectedDelivery.attempt}
                  {selectedDelivery.latencyMs !== null && ` · ${selectedDelivery.latencyMs} ms`}
                </p>
                {selectedDelivery.errorMessage && (
                  <p className="text-xs text-destructive">{selectedDelivery.errorMessage}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest">Payload</Label>
                <pre className="text-xs font-mono bg-muted rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
                  {selectedDelivery.payload}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedDelivery && !selectedDelivery.success && (
              <Button
                className="rounded-xl"
                onClick={() => {
                  retryMutation.mutate(selectedDelivery);
                  setSelectedDelivery(null);
                }}
                disabled={retryMutation.isPending}
              >
                Retry
              </Button>
            )}
            <Button variant="outline" className="rounded-xl" onClick={() => setSelectedDelivery(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add webhook dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingId ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* URL */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest">Endpoint URL *</Label>
              <Input
                value={form.url}
                onChange={e => { setForm(prev => ({ ...prev, url: e.target.value })); setUrlError(""); }}
                placeholder="https://your-server.com/webhook"
                className="rounded-xl font-mono text-sm"
              />
              {urlError && <p className="text-xs text-destructive">{urlError}</p>}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" /> Must use HTTPS.
              </p>
            </div>

            {/* Events */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest">Events *</Label>
              <div className="space-y-2">
                {EVENT_OPTIONS.map(ev => (
                  <label key={ev.id} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.events.includes(ev.id)}
                      onChange={() => handleEventToggle(ev.id)}
                      className="mt-0.5 rounded"
                    />
                    <div>
                      <p className="text-sm font-semibold font-mono">{ev.id}</p>
                      <p className="text-xs text-muted-foreground">{ev.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Secret — plaintext only on create or explicit rotate */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest">Signing Secret</Label>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <code className="text-xs font-mono flex-1 truncate">
                  {editingId && !form.rotateSecret
                    ? (secretPreview ?? "••••")
                    : form.secret}
                </code>
                {(!editingId || form.rotateSecret) && form.secret && (
                  <CopyButton text={form.secret} />
                )}
                <button
                  onClick={() =>
                    setForm(prev => ({
                      ...prev,
                      secret: generateSecret(),
                      rotateSecret: editingId ? true : prev.rotateSecret,
                    }))
                  }
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  title={editingId ? "Rotate secret" : "Regenerate"}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {editingId && !form.rotateSecret
                  ? "Secret is masked after create. Click refresh to rotate — the new value is shown once."
                  : <>Used to verify payload signatures via <code className="bg-muted px-1 rounded">X-EduCreds-Signature</code>.</>}
              </p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive webhooks won't receive events.</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={v => setForm(prev => ({ ...prev, active: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleSubmit} disabled={addMutation.isPending || updateMutation.isPending}>
              {addMutation.isPending || updateMutation.isPending ? "Saving…" : editingId ? "Save Changes" : "Save Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(revealedSecret)} onOpenChange={(open) => { if (!open) setRevealedSecret(null); }}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Copy signing secret</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This value is shown once. Store it with your webhook consumer — list views only show a masked preview.
          </p>
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
            <code className="text-xs font-mono flex-1 break-all">{revealedSecret}</code>
            {revealedSecret && <CopyButton text={revealedSecret} />}
          </div>
          <DialogFooter>
            <Button className="rounded-xl" onClick={() => setRevealedSecret(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
