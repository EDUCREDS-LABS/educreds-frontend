/**
 * Developer Portal — API Explorer
 * Categorised API endpoint browser with Try It panel.
 * Categories: Credentials, Verification, Institutions, Students, Webhooks
 */

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { explorerAuthHeaders, rememberSandboxApiKey } from "@/lib/sandboxApiKey";
import { developerPortalApi } from "@/lib/developerPortalApi";
import { API_CONFIG } from "@/config/api";
import { Loader2, Play, ChevronDown, ChevronRight } from "lucide-react";

// ── Endpoint catalogue ─────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Param {
  name: string;
  type: "path" | "query" | "body";
  required?: boolean;
  description?: string;
}

interface Endpoint {
  method: HttpMethod;
  path: string;
  description: string;
  params?: Param[];
}

interface Category {
  id: string;
  label: string;
  endpoints: Endpoint[];
}

const BASE = API_CONFIG.CERT;

const CATEGORIES: Category[] = [
  {
    id: "credentials",
    label: "Credentials",
    endpoints: [
      { method: "GET",  path: "/api/certificates/institution", description: "List all credentials for the authenticated institution.", params: [{ name: "status", type: "query", description: "Filter by status (active/revoked/pending)" }, { name: "page", type: "query" }, { name: "limit", type: "query" }] },
      { method: "POST", path: "/api/certificates/issue",       description: "Issue a new credential to a student.", params: [{ name: "body", type: "body", description: "JSON payload with studentAddress, courseName, grade, etc." }] },
      { method: "GET",  path: "/api/certificates/:id",          description: "Get a specific credential by ID.", params: [{ name: "id", type: "path", required: true }] },
      { method: "POST", path: "/api/certificates/:id/revoke",   description: "Revoke a credential.", params: [{ name: "id", type: "path", required: true }, { name: "body", type: "body", description: "{ reasonCode, reasonText, detailsUri }" }] },
      { method: "GET",  path: "/api/certificates/:id/share",    description: "Get sharing links for a credential.", params: [{ name: "id", type: "path", required: true }] },
    ],
  },
  {
    id: "verification",
    label: "Verification",
    endpoints: [
      { method: "POST", path: "/api/verify-proxy/verify",      description: "Verify a credential by hash or token.", params: [{ name: "body", type: "body", description: "{ credentialHash } or { token }" }] },
      { method: "POST", path: "/api/verify-proxy/verify/bulk", description: "Bulk verify multiple credentials.", params: [{ name: "body", type: "body", description: "Array of credential hashes" }] },
      { method: "GET",  path: "/api/verify-proxy/result/:jobId", description: "Poll async verification result.", params: [{ name: "jobId", type: "path", required: true }] },
      { method: "GET",  path: "/api/verify-proxy/status",       description: "Check verification service health." },
    ],
  },
  {
    id: "institutions",
    label: "Institutions",
    endpoints: [
      { method: "GET",  path: "/api/institutions/profile",     description: "Get your institution profile." },
      { method: "PUT",  path: "/api/institutions/profile",     description: "Update institution profile.", params: [{ name: "body", type: "body" }] },
      { method: "GET",  path: "/api/institutions/did-profile", description: "Get DID profile and key details." },
      { method: "GET",  path: "/api/institutions/users",       description: "List institution team members." },
      { method: "POST", path: "/api/institutions/users/invite", description: "Invite a team member.", params: [{ name: "body", type: "body", description: "{ email, role }" }] },
    ],
  },
  {
    id: "students",
    label: "Students",
    endpoints: [
      { method: "GET",  path: "/api/students",           description: "List enrolled students for the institution." },
      { method: "POST", path: "/api/students",           description: "Enrol a new student.", params: [{ name: "body", type: "body" }] },
      { method: "GET",  path: "/api/students/:id",       description: "Get student details.", params: [{ name: "id", type: "path", required: true }] },
      { method: "GET",  path: "/api/students/:id/credentials", description: "Get all credentials for a student.", params: [{ name: "id", type: "path", required: true }] },
    ],
  },
  {
    id: "webhooks",
    label: "Webhooks",
    endpoints: [
      { method: "GET",    path: "/api/webhooks",     description: "List registered webhooks." },
      { method: "POST",   path: "/api/webhooks",     description: "Register a new webhook endpoint.", params: [{ name: "body", type: "body", description: "{ url, events[], secret? }" }] },
      { method: "DELETE", path: "/api/webhooks/:id", description: "Remove a webhook.", params: [{ name: "id", type: "path", required: true }] },
      { method: "POST",   path: "/api/webhooks/:id/test", description: "Send a test event to a webhook.", params: [{ name: "id", type: "path", required: true }] },
    ],
  },
];

// ── Method badge colours ───────────────────────────────────────────────────────

const METHOD_COLOUR: Record<HttpMethod, string> = {
  GET:    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  POST:   "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  PUT:    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  PATCH:  "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

// ── TryItPanel ─────────────────────────────────────────────────────────────────

interface TryItPanelProps {
  endpoint: Endpoint;
  baseUrl: string;
}

function TryItPanel({ endpoint, baseUrl }: TryItPanelProps) {
  const pathParams = (endpoint.params ?? []).filter((p) => p.type === "path");
  const queryParams = (endpoint.params ?? []).filter((p) => p.type === "query");
  const bodyParam = (endpoint.params ?? []).find((p) => p.type === "body");

  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [bodyValue, setBodyValue] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const buildUrl = () => {
    let url = endpoint.path;
    for (const p of pathParams) {
      url = url.replace(`:${p.name}`, encodeURIComponent(pathValues[p.name] ?? `:${p.name}`));
    }
    const qs = queryParams
      .filter((p) => queryValues[p.name])
      .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(queryValues[p.name])}`)
      .join("&");
    return `${baseUrl}${url}${qs ? `?${qs}` : ""}`;
  };

  const run = async () => {
    setLoading(true);
    setResponse(null);
    setStatusCode(null);
    try {
      const authHeaders = explorerAuthHeaders();
      const opts: RequestInit = {
        method: endpoint.method,
        headers: { ...authHeaders, "Content-Type": "application/json" },
      };
      if (["POST", "PUT", "PATCH"].includes(endpoint.method) && bodyValue) {
        opts.body = bodyValue;
      }
      const res = await fetch(buildUrl(), opts);
      setStatusCode(res.status);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (e: unknown) {
      setResponse(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
      <p className="text-xs font-black uppercase tracking-wider text-neutral-400">Try It</p>

      {/* Path params */}
      {pathParams.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Path Parameters</p>
          {pathParams.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-500 w-24 shrink-0">{p.name}</span>
              <Input
                size={1}
                placeholder={`{${p.name}}`}
                value={pathValues[p.name] ?? ""}
                onChange={(e) => setPathValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                className="h-8 rounded-lg text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {/* Query params */}
      {queryParams.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Query Parameters</p>
          {queryParams.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-500 w-24 shrink-0">{p.name}</span>
              <Input
                size={1}
                placeholder={p.description ?? p.name}
                value={queryValues[p.name] ?? ""}
                onChange={(e) => setQueryValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                className="h-8 rounded-lg text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      {bodyParam && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
            Request Body {bodyParam.description ? `— ${bodyParam.description}` : ""}
          </p>
          <Textarea
            placeholder='{ "key": "value" }'
            value={bodyValue}
            onChange={(e) => setBodyValue(e.target.value)}
            className="font-mono text-xs rounded-xl min-h-[80px]"
          />
        </div>
      )}

      {/* Execute */}
      <Button size="sm" onClick={run} disabled={loading} className="gap-2 rounded-lg font-bold">
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
        {loading ? "Running…" : "Send Request"}
      </Button>

      {/* Response */}
      {(response !== null || statusCode !== null) && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">Response</p>
            {statusCode !== null && (
              <Badge className={cn(
                "text-xs font-bold border-0 rounded-md px-2",
                statusCode < 300 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              )}>
                {statusCode}
              </Badge>
            )}
          </div>
          <pre className="bg-neutral-950 text-emerald-400 text-xs font-mono rounded-xl p-4 overflow-auto max-h-64">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

function FeaturedBuilders() {
  const [active, setActive] = useState("verify");
  const [credentialId, setCredentialId] = useState("");
  const [batchIds, setBatchIds] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [courseName, setCourseName] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [usedMock, setUsedMock] = useState(false);

  const send = async (url: string, body: unknown, mock: unknown) => {
    setLoading(true);
    setResponse(null);
    setUsedMock(false);
    try {
      const authHeaders = explorerAuthHeaders();
      const res = await fetch(url, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text || `${res.status} ${res.statusText}`);
      }
    } catch {
      // TODO: connect to staging
      setUsedMock(true);
      setResponse(JSON.stringify(mock, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Core endpoints</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={setActive}>
          <TabsList>
            <TabsTrigger value="verify">Verify Credential</TabsTrigger>
            <TabsTrigger value="batch">Batch Verify</TabsTrigger>
            <TabsTrigger value="issue">Issue Credential</TabsTrigger>
          </TabsList>

          <TabsContent value="verify" className="space-y-3 pt-4">
            <p className="text-xs font-mono text-muted-foreground">POST /v1/evf/verify</p>
            <div className="space-y-1.5">
              <Label htmlFor="credential-id">credentialId</Label>
              <Input
                id="credential-id"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="Credential ID"
              />
            </div>
            <Button
              disabled={loading || !credentialId.trim()}
              onClick={() =>
                void send(
                  API_CONFIG.VERIFY_PROXY.VERIFY,
                  { credentialId: credentialId.trim() },
                  {
                    status: "verified",
                    issuer: "Kampala Business School",
                    issuedAt: "2025-12-12",
                    evidence: {
                      credentialIntegrity: true,
                      issuerIdentity: true,
                      revocationStatus: "active",
                      trustScore: 94,
                    },
                  },
                )
              }
            >
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Send Request
            </Button>
          </TabsContent>

          <TabsContent value="batch" className="space-y-3 pt-4">
            <p className="text-xs font-mono text-muted-foreground">POST /v1/evf/verify/batch</p>
            <div className="space-y-1.5">
              <Label htmlFor="batch-ids">Credential IDs (one per line)</Label>
              <Textarea
                id="batch-ids"
                value={batchIds}
                onChange={(e) => setBatchIds(e.target.value)}
                placeholder={"cred_123\ncred_456"}
                className="min-h-[96px] font-mono text-sm"
              />
            </div>
            <Button
              disabled={loading || !batchIds.trim()}
              onClick={() => {
                const ids = batchIds.split(/\s+/).map((id) => id.trim()).filter(Boolean);
                return send(API_CONFIG.VERIFY_PROXY.VERIFY_BULK, { credentialIds: ids }, {
                  results: ids.map((id) => ({ credentialId: id, status: "verified" })),
                });
              }}
            >
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Send Request
            </Button>
          </TabsContent>

          <TabsContent value="issue" className="space-y-3 pt-4">
            <p className="text-xs font-mono text-muted-foreground">POST /v1/credentials/issue</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="student-email">Student email</Label>
                <Input id="student-email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="course-name">Course name</Label>
                <Input id="course-name" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} />
              </div>
            </div>
            <Button
              disabled={loading || !studentEmail.trim() || !courseName.trim()}
              onClick={() =>
                void send(
                  API_CONFIG.CERTIFICATES.ISSUE,
                  { studentEmail: studentEmail.trim(), courseName: courseName.trim(), grade: grade.trim() || undefined },
                  { status: "issued", studentEmail, courseName },
                )
              }
            >
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Send Request
            </Button>
          </TabsContent>
        </Tabs>

        {response !== null && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground">
              {usedMock ? "Mock response (staging call failed) — TODO: connect to staging" : "Response"}
            </p>
            <pre className="bg-neutral-950 text-emerald-400 text-xs font-mono rounded-xl p-4 overflow-auto max-h-64">
              {response}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── EndpointRow ────────────────────────────────────────────────────────────────

function EndpointRow({ endpoint, baseUrl }: { endpoint: Endpoint; baseUrl: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <Badge className={cn("text-xs font-black border-0 rounded-md w-16 justify-center shrink-0", METHOD_COLOUR[endpoint.method])}>
          {endpoint.method}
        </Badge>
        <code className="text-sm font-mono text-neutral-700 dark:text-neutral-300 flex-1">{endpoint.path}</code>
        <span className="text-xs text-neutral-500 flex-1 hidden sm:block">{endpoint.description}</span>
        {expanded ? <ChevronDown className="size-4 text-neutral-400 shrink-0" /> : <ChevronRight className="size-4 text-neutral-400 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{endpoint.description}</p>
          <TryItPanel endpoint={endpoint} baseUrl={baseUrl} />
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ApiExplorerPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const cat = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];

  useEffect(() => {
    void developerPortalApi.getKeys().then((keys) => {
      const sandbox = keys.find((key) =>
        Boolean(key.apiKey) &&
        (key.environment === "sandbox" ||
          key.name.toLowerCase().includes("sandbox") ||
          key.prefix.toLowerCase().includes("test")),
      );
      if (sandbox?.apiKey) rememberSandboxApiKey(sandbox.apiKey);
    }).catch(() => undefined);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">API Explorer</h1>
        <p className="text-sm text-neutral-500 mt-1">Try the three core endpoints with form fields, then browse the rest of the catalogue.</p>
      </div>

      <FeaturedBuilders />

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="w-44 shrink-0 space-y-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors",
                activeCategory === c.id
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900/40"
              )}
            >
              {c.label}
            </button>
          ))}
        </nav>

        {/* Endpoint list */}
        <div className="flex-1 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
            {cat.label} — {cat.endpoints.length} endpoints
          </p>
          {cat.endpoints.map((ep) => (
            <EndpointRow key={`${ep.method}-${ep.path}`} endpoint={ep} baseUrl={BASE} />
          ))}
        </div>
      </div>
    </div>
  );
}
