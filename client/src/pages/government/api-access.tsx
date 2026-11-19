/**
 * GovernmentApiAccessPage — /government/api-access
 *
 * API access for the government workspace.
 * Scopes: verify:bulk, registry:read, accreditation:read (read-only by default)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Key, Copy, Trash2, Plus, Eye, EyeOff, Gavel,
  Terminal, BookOpen, Loader2, ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { governmentRequest } from "@/lib/api";
import { GovernmentRequestError } from "./request-error";

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  usageCount?: number;
}

const GOVERNMENT_SCOPES = ["verify:bulk", "registry:read", "accreditation:read"];

async function fetchApiKeys(): Promise<ApiKey[]> {
  return governmentRequest("/api/government/api-keys");
}

async function createApiKey(name: string): Promise<{ key: string; id: string }> {
  return governmentRequest("/api/government/api-keys", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, scopes: GOVERNMENT_SCOPES }),
  });
}

async function revokeApiKey(id: string): Promise<void> {
  await governmentRequest(`/api/government/api-keys/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export default function GovernmentApiAccessPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: keys = [], isLoading, error, refetch } = useQuery<ApiKey[]>({
    queryKey: ["government-api-keys"],
    queryFn: fetchApiKeys,
    staleTime: 30_000,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["government-api-keys"] });
      toast({ title: "API key revoked" });
    },
    onError: () => toast({ title: "Failed to revoke key", variant: "destructive" }),
  });

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(newKeyName.trim());
      setNewKeyValue(result.key);
      setNewKeyName("");
      setShowKey(true);
      qc.invalidateQueries({ queryKey: ["government-api-keys"] });
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
      <GovernmentRequestError error={error} retry={() => { void refetch(); }} />
      <div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
          Government API Access
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Read-only programmatic access for audit, accreditation checks, and bulk verification.
          All operations are logged for compliance.
        </p>
      </div>

      {/* Read-only notice */}
      <Card className="rounded-3xl border border-amber-200 dark:border-amber-800/50 shadow-md bg-amber-50/50 dark:bg-amber-950/10">
        <CardContent className="p-5 flex items-start gap-3">
          <ShieldCheck className="size-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-amber-700 dark:text-amber-400">
              Read-Only Access
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              Government API keys are scoped to read-only operations. Bulk verification is
              available for audit and accreditation purposes. No issuance or modification rights.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scopes info */}
      <Card className="rounded-3xl border-0 shadow-md bg-white dark:bg-neutral-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Gavel className="size-4 text-blue-500" />
            Available Scopes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {GOVERNMENT_SCOPES.map((s) => (
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
              placeholder="Key name (e.g. NCHE Audit System)"
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
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                New API Key — Copy now. It won't be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-neutral-700 dark:text-neutral-300 break-all">
                  {showKey ? newKeyValue : "•".repeat(40)}
                </code>
                <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => copy(newKeyValue)}>
                  <Copy className="size-4" />
                </Button>
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
                    <p className="text-xs font-mono text-neutral-400 mt-0.5">{k.keyPreview}</p>
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
                    onClick={() => revokeMutation.mutate(k.id)}
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
            <Terminal className="size-4 text-blue-500" /> API Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
              Bulk Audit Verification
            </p>
            <pre className="bg-neutral-900 dark:bg-neutral-950 text-green-400 text-xs rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST https://api-dev.educreds.xyz/api/verify-proxy/verify/bulk \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"certificateIds":["id1","id2","id3"],"mode":"api"}'`}
            </pre>
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
              Query Accredited Institutions
            </p>
            <pre className="bg-neutral-900 dark:bg-neutral-950 text-green-400 text-xs rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap">
{`curl https://api-dev.educreds.xyz/api/governance/institutions \\
  -H "x-api-key: YOUR_API_KEY"`}
            </pre>
          </div>
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
