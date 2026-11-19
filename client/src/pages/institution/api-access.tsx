/**
 * InstitutionApiAccessPage — /institution/api-access
 *
 * API key management scoped to the institution workspace.
 * Scopes: issue, issue:batch, read, verify, revoke, webhook:manage, keys:manage
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Key, Copy, Trash2, Plus, Eye, EyeOff, Building2,
  Terminal, BookOpen, Loader2, Webhook,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";

interface ApiKey {
  id: string;
  name: string;
  clientId: string;
  keyPreview: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  usageCount?: number;
}

// These must match VALID_API_KEY_SCOPES in institution-api-key.entity.ts
const INSTITUTION_SCOPES = [
  "issue",
  "issue:batch",
  "read",
  "webhook:manage",
];

async function fetchApiKeys(): Promise<ApiKey[]> {
  const res = await fetch(`${API_CONFIG.CERT}/api/institutions/api-keys`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}

async function createApiKey(name: string): Promise<{ key: string; clientId: string; xApiKey: string; id: string }> {
  const res = await fetch(`${API_CONFIG.CERT}/api/institutions/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ name, scopes: INSTITUTION_SCOPES }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // Backend returns { clientId, clientSecret, xApiKey } — normalise
  return {
    ...data,
    key: data.clientSecret ?? data.key ?? "",
    xApiKey: data.xApiKey ?? (data.clientId && data.clientSecret ? `${data.clientId}:${data.clientSecret}` : ""),
  };
}

// Backend route param is :clientId (the inst_xxx string), NOT the UUID primary key.
async function revokeApiKey(clientId: string): Promise<void> {
  const res = await fetch(`${API_CONFIG.CERT}/api/institutions/api-keys/${clientId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export default function InstitutionApiAccessPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["institution-api-keys"],
    queryFn: fetchApiKeys,
    staleTime: 30_000,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institution-api-keys"] });
      toast({ title: "API key revoked" });
    },
    onError: () => toast({ title: "Failed to revoke key", variant: "destructive" }),
  });

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(newKeyName.trim());
      setNewKeyValue(result.xApiKey || result.key); // store full combined key
      setNewClientId(result.clientId ?? null);
      setNewKeyName("");
      setShowKey(true);
      qc.invalidateQueries({ queryKey: ["institution-api-keys"] });
      toast({ title: "API key created — copy it now, it won't be shown again" });
    } catch {
      toast({ title: "Failed to create API key", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
          Institution API Access
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          M2M API keys for programmatic credential issuance, LMS integrations, and webhooks.
        </p>
      </div>

      {/* Scopes info */}
      <Card className="rounded-3xl border-0 shadow-md bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Building2 className="size-4 text-blue-500" />
            Available Scopes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {INSTITUTION_SCOPES.map((s) => (
            <Badge key={s} variant="outline" className="font-mono text-xs">
              {s}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Create key */}
      <Card className="rounded-3xl border-0 shadow-md bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Plus className="size-4 text-blue-500" /> Create New API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g. LMS Integration, ATS Connector)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
              className="rounded-xl font-black shrink-0"
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : "Create"}
            </Button>
          </div>

          {newKeyValue && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                New API Key — Copy now. Secret will never be shown again.
              </p>

              {/* Client ID row */}
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Client ID</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 break-all bg-white dark:bg-neutral-900 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    {newClientId ?? "—"}
                  </code>
                  {newClientId && (
                    <Button variant="ghost" size="icon" onClick={() => copy(newClientId)}>
                      <Copy className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Full key (clientId:secret) row */}
              <div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
                  Full API Key <span className="text-emerald-600">(use in X-API-Key header)</span>
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 break-all bg-white dark:bg-neutral-900 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700">
                    {showKey ? newKeyValue : "•".repeat(50)}
                  </code>
                  <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => copy(newKeyValue ?? "")}>
                    <Copy className="size-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Format: <code className="font-mono">clientId:secret</code> — both parts required
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing keys */}
      <Card className="rounded-3xl border-0 shadow-md bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Key className="size-4 text-blue-500" /> Your API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-neutral-300" />
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">
              No API keys yet. Create one above.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-neutral-800 dark:text-neutral-100 truncate">
                      {k.name}
                    </p>
                    <p className="text-xs font-mono text-neutral-500 mt-0.5">
                      <span className="text-neutral-400">Client ID: </span>{k.clientId ?? k.keyPreview}
                    </p>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                      Full key: <span className="text-neutral-500">{k.clientId ?? k.keyPreview}:••••••••</span>
                      <span className="text-neutral-400 ml-2">(secret only shown at creation)</span>
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(k.scopes ?? []).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px] font-mono py-0">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[10px] text-neutral-400">
                      Created {new Date(k.createdAt).toLocaleDateString()}
                    </p>
                    {k.usageCount != null && (
                      <p className="text-[10px] text-neutral-400">{k.usageCount} calls</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                    onClick={() => revokeMutation.mutate(k.clientId)}
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage examples */}
      <Card className="rounded-3xl border-0 shadow-md bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Terminal className="size-4 text-blue-500" /> Integration Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
              Issue a Credential (M2M)
            </p>
            <pre className="bg-neutral-900 dark:bg-neutral-950 text-green-400 text-xs rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST https://api-dev.educreds.xyz/api/v1/issue/certificate \\
  -H "X-API-Key: <clientId>:<secret>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientName": "Jane Doe",
    "recipientEmail": "jane@example.com",
    "courseName": "BSc Computer Science",
    "customData": {
      "grade": "First Class Honours",
      "completionDate": "2024-06-15",
      "certificateType": "Academic"
    }
  }'`}
            </pre>
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
              Webhook Payload (verification events)
            </p>
            <pre className="bg-neutral-900 dark:bg-neutral-950 text-green-400 text-xs rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap">
{`POST /your-webhook-endpoint
{
  "event": "verification.completed",
  "certificateId": "...",
  "status": "VALID",
  "verifiedAt": "2024-09-23T04:52:00Z",
  "purpose": "employment_verification"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks shortcut */}
      <Card className="rounded-3xl border-0 shadow-md bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Webhook className="size-4 text-blue-500" /> Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500 mb-4">
            Configure webhook endpoints to receive real-time notifications when credentials are
            verified. Manage webhooks in the dedicated Webhooks section.
          </p>
          <a href="/institution/webhooks">
            <Button variant="outline" className="rounded-xl font-bold">
              Manage Webhooks →
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Docs link */}
      <div className="flex items-center justify-center gap-2 pb-4">
        <BookOpen className="size-4 text-neutral-400" />
        <a
          href="https://docs.educreds.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline"
        >
          Full API Documentation →
        </a>
      </div>
    </div>
  );
}
