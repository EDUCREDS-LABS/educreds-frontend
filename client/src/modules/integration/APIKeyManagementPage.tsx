/**
 * Institution Integrations — API Key Management
 *
 * Route: /connect/api-keys
 * Auth:  institution JWT, Tier 1/2 (cloud-connector | enterprise-connector)
 *
 * Features:
 *   - List all API keys with metadata, scopes, usage, last used
 *   - Create key: name, description, scopes (multi-select), expiry, rate limit, IP allowlist, sandbox mode
 *   - Copy-to-clipboard one-time secret reveal with auto-dismiss
 *   - Rotate key (new secret, old invalidated immediately)
 *   - Edit key metadata in-place (name, description, scopes, rate limit, IP allowlist)
 *   - Revoke key with confirmation
 *   - Recent issuance jobs table (async job history)
 *   - Quick-start code snippet (curl / Node / Python)
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Key, Plus, Copy, Check, RotateCw, Trash2, Eye, EyeOff, Shield, Zap,
  AlertTriangle, Clock, Activity, Terminal, ChevronDown, ChevronUp, X,
  RefreshCw, Info, Loader2, CheckCircle2, XCircle, Package,
} from 'lucide-react';
import {
  listApiKeys, createApiKey, updateApiKey, rotateApiKey, revokeApiKey, listIssuanceJobs,
  ALL_SCOPES, SCOPE_LABELS, BRIEF_SCOPE_LABEL, ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest, IssuanceJob,
} from '@/api/api-keys';
import { rememberSandboxApiKey } from '@/lib/sandboxApiKey';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function maskClientId(clientId: string) {
  if (clientId.length <= 12) return clientId;
  return `${clientId.slice(0, 9)}…${clientId.slice(-4)}`;
}

function relativeTime(iso: string | null | undefined) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const RISK_COLOR: Record<string, string> = {
  low:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high:   'bg-red-50 text-red-700 border-red-200',
};

const JOB_STATUS_ICON: Record<string, { icon: React.ElementType; cls: string }> = {
  completed: { icon: CheckCircle2, cls: 'text-emerald-500' },
  failed:    { icon: XCircle,      cls: 'text-red-500'     },
  processing:{ icon: Loader2,      cls: 'text-blue-500 animate-spin' },
  queued:    { icon: Clock,        cls: 'text-neutral-400' },
  cancelled: { icon: X,            cls: 'text-neutral-400' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
        bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function ScopeTag({ scope }: { scope: string }) {
  const meta = SCOPE_LABELS[scope as keyof typeof SCOPE_LABELS];
  if (!meta) return <span className="px-2 py-0.5 rounded text-xs font-mono bg-neutral-100 text-neutral-600 border border-neutral-200">{scope}</span>;
  return (
    <span
      title={meta.description}
      className={cn('px-2 py-0.5 rounded text-xs font-semibold border', RISK_COLOR[meta.risk])}
    >
      {meta?.label ?? BRIEF_SCOPE_LABEL[scope] ?? scope}
    </span>
  );
}

function ScopeSelector({ value, onChange }: { value: string[]; onChange: (s: string[]) => void }) {
  const toggle = (s: string) => {
    onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_SCOPES.map(scope => {
        const meta = SCOPE_LABELS[scope];
        const selected = value.includes(scope);
        return (
          <button
            key={scope}
            type="button"
            onClick={() => toggle(scope)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
              selected
                ? 'bg-[#0F2044] text-white border-[#0F2044] shadow-sm'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300',
            )}
          >
            {selected && <Check className="size-3" />}
            {meta.label}
            {meta.risk === 'high' && !selected && (
              <AlertTriangle className="size-3 text-amber-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Secret Reveal Banner ──────────────────────────────────────────────────────

function SecretRevealBanner({ secret, onDismiss }: { secret: string; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 rounded-lg bg-amber-200 p-2">
            <Key className="size-4 text-amber-700" />
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm">API Key Generated — Save it now</p>
            <p className="text-xs text-amber-700 mt-0.5">This secret will not be shown again after you dismiss this banner.</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-amber-500 hover:text-amber-700 mt-0.5">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <code className={cn(
          'flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-neutral-800 break-all',
          !visible && 'blur-sm select-none',
        )}>
          {secret}
        </code>
        <button
          onClick={() => setVisible(v => !v)}
          className="flex-shrink-0 rounded-lg border border-amber-200 bg-white p-2 hover:bg-amber-50"
          title={visible ? 'Hide secret' : 'Reveal secret'}
        >
          {visible ? <EyeOff className="size-4 text-amber-600" /> : <Eye className="size-4 text-amber-600" />}
        </button>
        <CopyButton value={secret} label="Copy key" />
      </div>
      <p className="mt-2 text-xs text-amber-600">
        Use as: <code className="font-mono bg-amber-100 px-1 rounded">X-API-Key: {secret.slice(0, 28)}…</code>
      </p>
    </div>
  );
}

// ── Create Key Dialog ─────────────────────────────────────────────────────────

function CreateKeyDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (secret: string) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateApiKeyRequest>({
    name: '',
    description: '',
    scopes: ['verify'],
    sandboxMode: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ipInput, setIpInput] = useState('');
  const [ips, setIps] = useState<string[]>([]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: createApiKey,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      if (form.sandboxMode) rememberSandboxApiKey(data.xApiKey);
      onCreated(data.xApiKey);
    },
  });

  const addIp = () => {
    const trimmed = ipInput.trim();
    if (trimmed && !ips.includes(trimmed)) {
      setIps(prev => [...prev, trimmed]);
      setIpInput('');
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.scopes.length === 0) return;
    mutate({ ...form, allowedIps: ips.length ? ips : undefined });
  };

  const hasHighScope = form.scopes.some(s => SCOPE_LABELS[s as keyof typeof SCOPE_LABELS]?.risk === 'high');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div>
            <h2 className="font-bold text-neutral-900 text-lg">Create API Key</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Keys are hashed immediately — the secret is shown once only</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X className="size-5" /></button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Production Issuance Bot, CI/CD Pipeline"
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2044]/20 focus:border-[#0F2044]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Where will this key be used? What system will hold it?"
              rows={2}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2044]/20 focus:border-[#0F2044] resize-none"
            />
          </div>

          {/* Scopes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wider">
              Scopes <span className="text-red-500">*</span>
            </label>
            <ScopeSelector value={form.scopes} onChange={scopes => setForm(f => ({ ...f, scopes: scopes as any }))} />
            {hasHighScope && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="size-3.5" />
                Keys with issue or revoke scope can permanently modify credential records. Store securely.
              </p>
            )}
          </div>

          {/* Sandbox toggle */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-800">Sandbox mode</p>
              <p className="text-xs text-neutral-500">Operations run in isolation — no production data affected</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, sandboxMode: !f.sandboxMode }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                form.sandboxMode ? 'bg-[#0F2044]' : 'bg-neutral-200',
              )}
            >
              <span className={cn('inline-block size-4 rounded-full bg-white shadow transition-transform',
                form.sandboxMode ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>

          {/* Advanced */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-700"
            >
              {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              Advanced settings
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
                {/* Expiry */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Expires in (days)</label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    placeholder="Leave empty for no expiry"
                    value={form.expiresInDays ?? ''}
                    onChange={e => setForm(f => ({ ...f, expiresInDays: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2044]/20 focus:border-[#0F2044] bg-white"
                  />
                </div>

                {/* Rate limit */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    Rate limit (requests / 60s)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    placeholder="Default: 600"
                    value={form.rateLimit ?? ''}
                    onChange={e => setForm(f => ({ ...f, rateLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2044]/20 focus:border-[#0F2044] bg-white"
                  />
                </div>

                {/* IP allowlist */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                    IP Allowlist (CIDR)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="10.0.0.0/8 or 1.2.3.4/32"
                      value={ipInput}
                      onChange={e => setIpInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIp(); } }}
                      className="flex-1 rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2044]/20 focus:border-[#0F2044] bg-white font-mono"
                    />
                    <button type="button" onClick={addIp}
                      className="px-3 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 text-sm font-semibold">
                      Add
                    </button>
                  </div>
                  {ips.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ips.map(ip => (
                        <span key={ip} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 font-mono text-xs text-neutral-700">
                          {ip}
                          <button type="button" onClick={() => setIps(prev => prev.filter(x => x !== ip))}
                            className="text-neutral-400 hover:text-red-500 ml-0.5"><X className="size-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 text-xs text-neutral-400">Leave empty to allow all IPs. Add CIDRs to restrict to specific hosts/networks.</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {(error as Error).message}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={isPending || !form.name.trim() || form.scopes.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F2044] text-white text-sm font-semibold
              hover:bg-[#0F2044]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#0F2044]/20"
          >
            {isPending ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : <><Key className="size-4" /> Create API Key</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Key Row ───────────────────────────────────────────────────────────────────

function KeyRow({ apiKey, onReveal }: { apiKey: ApiKey; onReveal: (secret: string) => void }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateApiKeyRequest>({
    name: apiKey.name,
    description: apiKey.description ?? '',
    scopes: apiKey.scopes as any,
  });
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [showClientId, setShowClientId] = useState(false);

  const { mutate: rotate, isPending: rotating } = useMutation({
    mutationFn: () => rotateApiKey(apiKey.clientId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      onReveal(data.xApiKey);
      if (apiKey.sandboxMode) rememberSandboxApiKey(data.xApiKey);
    },
  });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (d: UpdateApiKeyRequest) => updateApiKey(apiKey.clientId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); setEditing(false); },
  });

  const { mutate: revoke, isPending: revoking } = useMutation({
    mutationFn: () => revokeApiKey(apiKey.clientId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); },
  });

  return (
    <div className={cn('rounded-xl border transition-all', apiKey.isActive ? 'border-neutral-200 bg-white' : 'border-neutral-100 bg-neutral-50 opacity-60')}>
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={cn('flex-shrink-0 rounded-lg p-2', apiKey.isActive ? 'bg-[#0F2044]/10' : 'bg-neutral-100')}>
          <Key className={cn('size-4', apiKey.isActive ? 'text-[#0F2044]' : 'text-neutral-400')} />
        </div>

        {/* Name + ID */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 text-sm truncate">{apiKey.name}</span>
            {apiKey.sandboxMode && (
              <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200">SANDBOX</span>
            )}
            {!apiKey.isActive && (
              <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600 border border-red-200">REVOKED</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <code className="text-xs text-neutral-400 font-mono">{showClientId ? apiKey.clientId : maskClientId(apiKey.clientId)}</code>
            <button
              type="button"
              className="text-xs font-semibold text-blue-600"
              onClick={() => setShowClientId(v => !v)}
            >
              {showClientId ? 'Hide' : 'Show'}
            </button>
            <CopyButton value={apiKey.clientId} label="Copy" />
          </div>
        </div>

        {/* Scopes */}
        <div className="hidden md:flex items-center gap-1.5 flex-wrap max-w-xs">
          {apiKey.scopes.slice(0, 3).map(s => <ScopeTag key={s} scope={s} />)}
          {apiKey.scopes.length > 3 && (
            <span className="text-xs text-neutral-400 font-medium">+{apiKey.scopes.length - 3}</span>
          )}
        </div>

        {/* Last used */}
        <div className="hidden lg:block text-xs text-neutral-500 text-right min-w-[80px]">
          <div className="font-medium text-neutral-700">{relativeTime(apiKey.lastUsedAt)}</div>
          <div className="text-neutral-400">{apiKey.usageCount.toLocaleString()} calls</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {apiKey.isActive && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                title="Edit key"
              >
                <Terminal className="size-4" />
              </button>
              <button
                onClick={() => rotate()}
                disabled={rotating}
                className="p-2 rounded-lg text-neutral-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                title="Rotate secret"
              >
                {rotating ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
              </button>
              <button
                onClick={() => setRevokeConfirm(true)}
                className="p-2 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Revoke key"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-neutral-100 px-5 py-4 bg-neutral-50/60 rounded-b-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-neutral-400 uppercase tracking-wider font-semibold mb-1">Rate limit</p>
              <p className="font-semibold text-neutral-700">{apiKey.rateLimit} req / {apiKey.rateLimitWindowSeconds}s</p>
            </div>
            <div>
              <p className="text-neutral-400 uppercase tracking-wider font-semibold mb-1">Expires</p>
              <p className="font-semibold text-neutral-700">{apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Never'}</p>
            </div>
            <div>
              <p className="text-neutral-400 uppercase tracking-wider font-semibold mb-1">Last rotated</p>
              <p className="font-semibold text-neutral-700">{apiKey.lastRotatedAt ? formatDate(apiKey.lastRotatedAt) : 'Never'}</p>
            </div>
            <div>
              <p className="text-neutral-400 uppercase tracking-wider font-semibold mb-1">Created</p>
              <p className="font-semibold text-neutral-700">{formatDate(apiKey.createdAt)}</p>
            </div>
            {apiKey.description && (
              <div className="col-span-2 md:col-span-4">
                <p className="text-neutral-400 uppercase tracking-wider font-semibold mb-1">Description</p>
                <p className="text-neutral-700">{apiKey.description}</p>
              </div>
            )}
            {apiKey.allowedIps && (
              <div className="col-span-2 md:col-span-4">
                <p className="text-neutral-400 uppercase tracking-wider font-semibold mb-1">IP Allowlist</p>
                <div className="flex flex-wrap gap-1.5">
                  {JSON.parse(apiKey.allowedIps).map((ip: string) => (
                    <code key={ip} className="px-2 py-0.5 rounded bg-white border border-neutral-200 font-mono text-xs">{ip}</code>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-2 md:col-span-4">
              <p className="text-neutral-400 uppercase tracking-wider font-semibold mb-1">All Scopes</p>
              <div className="flex flex-wrap gap-1.5">{apiKey.scopes.map(s => <ScopeTag key={s} scope={s} />)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirmation */}
      {revokeConfirm && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-4 rounded-b-xl">
          <p className="text-sm font-semibold text-red-800 mb-3">
            Revoke <span className="font-mono">{apiKey.name}</span>?
            Any system using this key will immediately lose access. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={() => revoke()} disabled={revoking}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {revoking ? <><Loader2 className="size-3.5 animate-spin" /> Revoking…</> : <><Trash2 className="size-3.5" /> Yes, revoke</>}
            </button>
            <button onClick={() => setRevokeConfirm(false)}
              className="px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit drawer */}
      {editing && (
        <div className="border-t border-neutral-100 px-5 py-4 bg-neutral-50 rounded-b-xl space-y-4">
          <p className="text-sm font-bold text-neutral-800">Edit key settings</p>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wider">Name</label>
            <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2044]/20 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wider">Scopes</label>
            <ScopeSelector value={editForm.scopes ?? []} onChange={s => setEditForm(f => ({ ...f, scopes: s as any }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => update(editForm)} disabled={updating}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F2044] text-white text-sm font-semibold hover:bg-[#0F2044]/90 disabled:opacity-50">
              {updating ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : <><Check className="size-4" /> Save changes</>}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-100">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Jobs Table ─────────────────────────────────────────────────────────────────

function IssuanceJobsTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['issuance-jobs'],
    queryFn: () => listIssuanceJobs({ limit: 20 }),
    refetchInterval: 15_000,
  });

  if (isLoading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-neutral-100 animate-pulse" />)}
    </div>
  );
  if (error) return <p className="text-sm text-red-600">Could not load job history: {(error as Error).message}</p>;
  if (!data?.jobs.length) return (
    <div className="text-center py-12 text-neutral-400">
      <Package className="size-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm font-medium">No issuance jobs yet</p>
      <p className="text-xs mt-1">Jobs appear here when credentials are issued via the API</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {data.jobs.map((job: IssuanceJob) => {
        const { icon: StatusIcon, cls } = JOB_STATUS_ICON[job.status] ?? JOB_STATUS_ICON.queued;
        return (
          <div key={job.jobId}
            className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white px-4 py-3 hover:border-neutral-200 transition-colors">
            <StatusIcon className={cn('size-4 flex-shrink-0', cls)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-neutral-500 truncate">{job.jobId.slice(0, 16)}…</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 capitalize">
                  {job.jobType}
                </span>
                <span className="text-xs text-neutral-400 capitalize">{job.triggeredBy.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <p className="font-semibold text-neutral-700">
                {job.successCount}/{job.totalCount} issued
              </p>
              <p className="text-neutral-400">{relativeTime(job.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Quick-Start Snippet ───────────────────────────────────────────────────────

function QuickStart() {
  const [lang, setLang] = useState<'curl' | 'node' | 'python'>('curl');
  const snippets = {
    curl: `curl -X POST https://api.educreds.xyz/api/v1/issue/certificate \\
  -H "X-API-Key: inst_YOUR_CLIENT_ID:YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipientName":  "Jane Nakato",
    "recipientEmail": "jane@example.com",
    "recipientWallet":"0xYourWalletAddress",
    "courseName":     "Bachelor of Science in Computer Science",
    "customData": {
      "certificateType": "Academic",
      "grade":           "First Class",
      "completionDate":  "2024-06-15"
    }
  }'`,
    node: `import { VerifyClient } from '@educreds/verify-sdk';

const client = new VerifyClient({
  baseUrl: 'https://api.educreds.xyz',
  apiKey: 'inst_YOUR_CLIENT_ID:YOUR_SECRET',
});

// Issue a credential
const result = await fetch('https://api.educreds.xyz/api/v1/issue/certificate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'inst_YOUR_CLIENT_ID:YOUR_SECRET',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    recipientName: 'Jane Nakato',
    recipientEmail: 'jane@example.com',
    recipientWallet: '0xYourWalletAddress',
    courseName: 'Bachelor of Science',
  }),
}).then(r => r.json());

console.log('Issued:', result.certificateId);`,
    python: `import requests

headers = {
    "X-API-Key": "inst_YOUR_CLIENT_ID:YOUR_SECRET",
    "Content-Type": "application/json",
}

payload = {
    "recipientName": "Jane Nakato",
    "recipientEmail": "jane@example.com",
    "recipientWallet": "0xYourWalletAddress",
    "courseName": "Bachelor of Science",
}

resp = requests.post(
    "https://api.educreds.xyz/api/v1/issue/certificate",
    headers=headers,
    json=payload,
)
resp.raise_for_status()
print("Issued:", resp.json()["certificateId"])`,
  };

  return (
    <div className="rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-950 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-300">Quick Start</span>
        </div>
        <div className="flex gap-1">
          {(['curl', 'node', 'python'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={cn('px-3 py-1 rounded text-xs font-semibold transition-colors',
                lang === l ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-200')}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <pre className="bg-neutral-950 text-neutral-200 p-5 text-xs overflow-x-auto leading-relaxed">
        <code>{snippets[lang]}</code>
      </pre>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function APIKeyManagementPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  // Tier guard: workspace-only institutions cannot use API keys
  const tier = (user as any)?.deploymentTier ?? (user as any)?.tier ?? 'workspace';
  if (tier === 'workspace') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="size-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
          <Key className="size-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">API Keys require Connector tier</h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Machine-to-machine API keys are available on the <strong>Cloud Connector</strong> and{' '}
          <strong>Enterprise Connector</strong> tiers. Upgrade your plan to enable programmatic
          credential issuance, LMS integrations, and system automation.
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold">
          Upgrade to Cloud Connector
        </div>
      </div>
    );
  }

  const { data: keys, isLoading, error, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: listApiKeys,
    staleTime: 30_000,
  });

  const activeKeys = keys?.filter(k => k.isActive) ?? [];
  const revokedKeys = keys?.filter(k => !k.isActive) ?? [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">API Keys</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Machine-to-machine credentials for AI agents, automation pipelines, and system integrations.
            Keys are hashed on creation — the raw secret is shown once only.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2044] text-white text-sm font-semibold
            hover:bg-[#0F2044]/90 transition-colors shadow-lg shadow-[#0F2044]/20 flex-shrink-0"
        >
          <Plus className="size-4" /> New API Key
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active keys',   value: activeKeys.length,                           icon: Key,      color: 'text-[#0F2044]',  bg: 'bg-[#0F2044]/10'  },
          { label: 'Total requests',value: keys?.reduce((a, k) => a + k.usageCount, 0) ?? 0, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50'  },
          { label: 'Revoked keys',  value: revokedKeys.length,                          icon: Shield,   color: 'text-neutral-500', bg: 'bg-neutral-100'   },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 flex items-center gap-3">
            <div className={cn('rounded-xl p-2.5', s.bg)}>
              <s.icon className={cn('size-5', s.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{s.value.toLocaleString()}</p>
              <p className="text-xs text-neutral-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secret reveal banner */}
      {revealedSecret && (
        <SecretRevealBanner secret={revealedSecret} onDismiss={() => setRevealedSecret(null)} />
      )}

      {/* Keys list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-neutral-800">
            Active Keys
            {activeKeys.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
                {activeKeys.length} / 20
              </span>
            )}
          </h2>
          <button onClick={() => refetch()} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600">
            <RefreshCw className="size-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-neutral-100 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="size-4 flex-shrink-0" />
            {(error as Error).message}
          </div>
        ) : activeKeys.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
            <Key className="size-10 mx-auto text-neutral-300 mb-3" />
            <p className="font-semibold text-neutral-600 text-sm">No API keys yet</p>
            <p className="text-xs text-neutral-400 mt-1 mb-4">Create your first key to start issuing credentials from any system</p>
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2044] text-white text-sm font-semibold hover:bg-[#0F2044]/90">
              <Plus className="size-4" /> Create API Key
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeKeys.map(k => (
              <KeyRow key={k.clientId} apiKey={k} onReveal={setRevealedSecret} />
            ))}
          </div>
        )}

        {revokedKeys.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-neutral-400 font-semibold cursor-pointer hover:text-neutral-600 select-none">
              {revokedKeys.length} revoked key{revokedKeys.length > 1 ? 's' : ''}
            </summary>
            <div className="mt-2 space-y-2">
              {revokedKeys.map(k => <KeyRow key={k.clientId} apiKey={k} onReveal={setRevealedSecret} />)}
            </div>
          </details>
        )}
      </div>

      {/* Security callout */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3">
        <Info className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-bold">Security best practices</p>
          <p>Never commit API keys to source control. Store them in environment variables, a secrets manager (Azure Key Vault, AWS Secrets Manager, 1Password), or a CI/CD secret store.</p>
          <p>Keys with <span className="font-semibold">issue</span> or <span className="font-semibold">revoke</span> scope can permanently modify credential records. Rotate every 90 days. Enable IP allowlists on production keys.</p>
        </div>
      </div>

      {/* Quick start */}
      <div>
        <h2 className="text-base font-bold text-neutral-800 mb-4">Quick Start</h2>
        <QuickStart />
      </div>

      {/* Issuance job history */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-bold text-neutral-800">Issuance Job History</h2>
          <Activity className="size-4 text-neutral-400" />
        </div>
        <IssuanceJobsTable />
      </div>

      {/* Create drawer */}
      {showCreate && (
        <CreateKeyDrawer
          onClose={() => setShowCreate(false)}
          onCreated={(secret) => { setRevealedSecret(secret); setShowCreate(false); }}
        />
      )}
    </div>
  );
}

// ── named export for lazy() compatibility ─────────────────────────────────────
export { APIKeyManagementPage };
