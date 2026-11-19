/**
 * Verifier Portal — /verifier/verify
 *
 * Professional verification dashboard for authenticated verifiers.
 * Replaces the old bare VerificationCenter wrapper.
 * /employer/verify redirects here for backward compatibility.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeaders } from "@/lib/auth";
import { API_CONFIG } from "@/config/api";
import { Link } from "react-router-dom";
import { VerificationCenter } from "@/components/verification/VerificationCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Zap, BarChart3, Clock, CheckCircle2, XCircle,
  Upload, Webhook, Key, TrendingUp, TrendingDown, ArrowRight,
  FileText, Download, AlertTriangle, Activity, Lock, RefreshCw,
} from "lucide-react";

// ── KPI card ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, change, changeDir, icon: Icon, color = "blue" }: {
  label: string; value: string | number; sub?: string;
  change?: string; changeDir?: "up" | "down";
  icon: typeof ShieldCheck; color?: "blue" | "green" | "amber" | "red";
}) {
  const c = {
    blue:  { bg: "bg-blue-50 dark:bg-blue-950/30",   ic: "text-blue-600 dark:text-blue-400"   },
    green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", ic: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30",  ic: "text-amber-600 dark:text-amber-400" },
    red:   { bg: "bg-red-50 dark:bg-red-950/30",     ic: "text-red-600 dark:text-red-400"    },
  }[color];
  return (
    <Card className="rounded-[20px] border border-[--border] bg-[--card]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground]">{label}</p>
            <p className="text-2xl font-black text-[--foreground] leading-none">{value ?? "—"}</p>
            {change && (
              <p className={cn("text-[11px] font-bold flex items-center gap-1", changeDir === "up" ? "text-emerald-600" : "text-red-500")}>
                {changeDir === "up" ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                {change}
              </p>
            )}
            {sub && <p className="text-[11px] text-[--muted-foreground]">{sub}</p>}
          </div>
          <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
            <Icon className={cn("size-5", c.ic)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Rate usage meter ───────────────────────────────────────────────────────────
function UsageMeter({ label, used, limit, locked }: { label: string; used: number; limit: number; locked?: boolean }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const atLimit = pct >= 100;
  const nearLimit = pct >= 80;
  return (
    <div className={cn("p-4 rounded-2xl border", atLimit ? "border-red-200 bg-red-50 dark:bg-red-950/20" : nearLimit ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "border-[--border] bg-[--muted]/30")}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {locked && <Lock className="w-3 h-3 text-[--muted-foreground]/60" />}
          <span className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground]">{label}</span>
        </div>
        <span className={cn("text-xs font-black", atLimit ? "text-red-600" : nearLimit ? "text-amber-600" : "text-[--muted-foreground]")}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
      {atLimit && <p className="text-[10px] text-red-600 font-bold mt-1">Limit reached · resets monthly</p>}
    </div>
  );
}

// ── Recent check row ───────────────────────────────────────────────────────────
function CheckRow({ check }: { check: any }) {
  const passed = check.status === "verified" || check.status === "valid" || check.result === "pass";
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[--border] last:border-0">
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", passed ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-red-50 dark:bg-red-950/20")}>
        {passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[--foreground] truncate">{check.credentialId ?? check.id ?? "—"}</p>
        <p className="text-xs text-[--muted-foreground]">{check.institution ?? check.issuer ?? "—"} · {check.method ?? "EVF"}</p>
      </div>
      <div className="text-right shrink-0">
        <Badge className={cn("text-[10px] font-black border", passed ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400")}>
          {passed ? "Verified" : "Failed"}
        </Badge>
        <p className="text-[10px] text-[--muted-foreground] mt-0.5">{check.latencyMs ? `${check.latencyMs}ms` : ""}</p>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function VerifierVerifyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"verify" | "bulk" | "automation">("verify");

  const rawPlan = (user as any)?.subscriptionPlan ?? "Free";
  const plan = rawPlan === "Starter"
    ? "Starter (30-day trial)"
    : (rawPlan === "Professional" ? "Pro" : rawPlan);
  const isPaid = plan !== "Free";

  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ["verifier-stats"],
    queryFn: async () => {
      try { return await fetch(`${API_CONFIG.CERT}/api/verifier/stats`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null); }
      catch { return null; }
    },
    staleTime: 120_000,
  });

  const { data: recent } = useQuery({
    queryKey: ["verifier-recent-checks"],
    queryFn: async () => {
      try { return await fetch(`${API_CONFIG.CERT}/api/verifier/checks?limit=8`, { headers: getAuthHeaders() }).then(r => r.ok ? r.json() : null); }
      catch { return null; }
    },
    staleTime: 60_000,
  });

  const checks: any[] = Array.isArray(recent) ? recent : (recent?.checks ?? []);
  const usage = stats?.usage ?? { evf: 0, evfAi: 0, evfLimit: 500, evfAiLimit: 50 };

  const kpis = [
    { label: "Checks This Month",  value: stats?.checksThisMonth  ?? "—", sub: "All methods",          icon: ShieldCheck,  color: "blue"  as const, change: stats?.checksDelta,  changeDir: "up" as const },
    { label: "Pass Rate",          value: stats?.passRate          ? `${stats.passRate}%` : "—", sub: "Verified credentials", icon: CheckCircle2, color: "green" as const },
    { label: "Avg. Response Time", value: stats?.avgLatencyMs      ? `${stats.avgLatencyMs}ms` : "—", sub: "End-to-end",   icon: Clock,        color: "amber" as const },
    { label: "EVF + AI Checks",    value: stats?.evfAiChecks       ?? "—", sub: "This month",           icon: Zap,          color: isPaid ? "blue" as const : "amber" as const },
  ];

  const TABS = [
    { id: "verify",     label: "Single Verify",  icon: ShieldCheck },
    { id: "bulk",       label: "Bulk Screening", icon: Upload,     locked: !isPaid },
    { id: "automation", label: "Automation",     icon: Webhook,    locked: !isPaid },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="size-4 text-primary" />
            <p className="text-[10px] font-black text-[--muted-foreground] uppercase tracking-widest">Verifier Portal</p>
          </div>
          <h1 className="text-3xl font-black text-[--foreground] tracking-tighter">Verification Hub</h1>
          <p className="text-sm text-[--muted-foreground] mt-1">Single checks, bulk screening, automation, analytics — all in one place</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("font-black text-[10px] uppercase tracking-widest px-3 py-1.5 border",
            plan === "Pro" ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400" :
            plan === "Starter (30-day trial)" ? "bg-primary/10 text-primary border-primary/20" :
            "bg-[--muted] text-[--muted-foreground] border-[--border]")}>
            {plan} Plan
          </Badge>
          {!isPaid && (
            <Link to="/verifier/billing/plan">
              <Button size="sm" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                <Zap className="w-3.5 h-3.5" /> Upgrade
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-[20px]"/>)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => <KpiCard key={k.label} {...k} />)}
        </div>
      )}

      {/* Usage meters + quick analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[--muted-foreground]">Monthly Usage</p>
          <UsageMeter label="EVF Verifications"    used={usage.evf}   limit={usage.evfLimit}   />
          <UsageMeter label="EVF + AI Verifications" used={usage.evfAi} limit={usage.evfAiLimit} locked={!isPaid} />
          {!isPaid && (
            <div className="p-3 rounded-2xl bg-[--muted]/40 border border-[--border] text-center">
              <p className="text-xs text-[--muted-foreground] mb-2">Need more volume?</p>
              <Link to="/verifier/billing/plan">
                <Button size="sm" variant="outline" className="w-full rounded-xl font-black text-xs gap-2">
                  <ArrowRight className="w-3.5 h-3.5" /> View Plans
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent checks */}
        <div className="lg:col-span-2">
          <Card className="rounded-[24px] border border-[--border] bg-[--card] h-full">
            <CardHeader className="px-5 py-4 border-b border-[--border] flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-[--foreground] flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Recent Checks
              </CardTitle>
              <Link to="/verifier/analytics">
                <Button variant="ghost" size="sm" className="text-xs font-bold rounded-xl gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-5 py-0">
              {checks.length === 0 ? (
                <div className="text-center py-10">
                  <ShieldCheck className="size-8 text-[--muted-foreground]/20 mx-auto mb-2" />
                  <p className="text-sm text-[--muted-foreground]">No checks yet</p>
                  <p className="text-xs text-[--muted-foreground] mt-1">Your verification history will appear here</p>
                </div>
              ) : checks.map((c, i) => <CheckRow key={c.id ?? i} check={c} />)}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabbed verification tools */}
      <Card className="rounded-[24px] border border-[--border] bg-[--card]">
        {/* Tab bar */}
        <div className="border-b border-[--border] px-5 pt-4">
          <div className="flex items-center gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isLocked = "locked" in tab && tab.locked;
              return (
                <button key={tab.id} onClick={() => !isLocked && setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px",
                    activeTab === tab.id
                      ? "bg-[--card] border-primary text-primary"
                      : isLocked
                        ? "border-transparent text-[--muted-foreground]/40 cursor-not-allowed"
                        : "border-transparent text-[--muted-foreground] hover:text-[--foreground]"
                  )}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {isLocked && <Lock className="w-3 h-3 ml-0.5 opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>

        <CardContent className="p-6">
          {/* Single Verify */}
          {activeTab === "verify" && (
            <VerificationCenter mode="both" plan={plan} isAuthenticated={true} />
          )}

          {/* Bulk Screening */}
          {activeTab === "bulk" && !isPaid && (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-[--muted] flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-[--muted-foreground]" />
              </div>
              <h3 className="font-black text-lg text-[--foreground] mb-2">Bulk CSV Screening</h3>
              <p className="text-sm text-[--muted-foreground] max-w-sm mx-auto mb-6">
                Upload a CSV of credential IDs and screen hundreds of applicants in seconds. Available on Starter (30-day trial) and Pro plans.
              </p>
              <Link to="/verifier/billing/plan">
                <Button className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                  <Zap className="w-3.5 h-3.5" /> Upgrade to Unlock
                </Button>
              </Link>
            </div>
          )}

          {activeTab === "bulk" && isPaid && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold gap-2 text-xs"
                  onClick={() => window.open('/api/verify-proxy/batch-template', '_blank')}
                >
                  <FileText className="w-3.5 h-3.5" /> Download CSV Template
                </Button>
              </div>
              <div className="border-2 border-dashed border-[--border] rounded-2xl p-10 text-center hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-[--muted-foreground] mx-auto mb-3" />
                <p className="font-bold text-[--foreground] mb-1">Drop your CSV here</p>
                <p className="text-xs text-[--muted-foreground] mb-4">Columns: certificateId, notes (optional)</p>
                <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2">
                  <FileText className="w-3.5 h-3.5" /> Choose File
                </Button>
              </div>
            </div>
          )}

          {/* Automation */}
          {activeTab === "automation" && !isPaid && (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-[--muted] flex items-center justify-center mx-auto mb-4">
                <Webhook className="w-7 h-7 text-[--muted-foreground]" />
              </div>
              <h3 className="font-black text-lg text-[--foreground] mb-2">Automation & Webhooks</h3>
              <p className="text-sm text-[--muted-foreground] max-w-sm mx-auto mb-6">
                Trigger verifications from your ATS (Greenhouse, Lever, Workday) or receive webhook callbacks when a check completes. Starter (30-day trial) and Pro only.
              </p>
              <Link to="/verifier/billing/plan">
                <Button className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                  <Zap className="w-3.5 h-3.5" /> Upgrade to Unlock
                </Button>
              </Link>
            </div>
          )}

          {activeTab === "automation" && isPaid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Key,      title: "API Keys",       desc: "Generate and manage API keys for programmatic access.",       href: "/verifier/api-keys" },
                { icon: Webhook,  title: "Webhooks",       desc: "Push verification results to your ATS or internal systems.",  href: "/verifier/webhooks" },
                { icon: FileText, title: "Audit Export",   desc: "Export full audit trail of all checks (CSV, PDF).",           href: "/verifier/analytics" },
                { icon: BarChart3,title: "Analytics API",  desc: "Query verification volume and pass rates programmatically.",  href: "/verifier/analytics" },
              ].map(({ icon: Icon, title, desc, href }) => (
                <Link key={title} to={href}>
                  <Card className="rounded-2xl border border-[--border] hover:border-primary/30 transition-all cursor-pointer group">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-[--foreground]">{title}</p>
                        <p className="text-xs text-[--muted-foreground] mt-0.5">{desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[--muted-foreground] group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Locked features teaser (free only) */}
      {!isPaid && (
        <Card className="rounded-[24px] border-2 border-dashed border-[--border] bg-[--muted]/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-black text-sm text-[--foreground]">Unlock Professional Tools</p>
                <p className="text-xs text-[--muted-foreground]">Starter (30-day trial) from $49/month</p>
              </div>
              <Link to="/verifier/billing/plan" className="ml-auto">
                <Button size="sm" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
                  View Plans <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Upload,   label: "Bulk CSV Screening",       desc: "Screen hundreds at once" },
                { icon: Webhook,  label: "Webhook Callbacks",        desc: "Push to your ATS" },
                { icon: Key,      label: "API Access",               desc: "Programmatic integration" },
                { icon: BarChart3,label: "Advanced Analytics",       desc: "Volume & trend reports" },
                { icon: FileText, label: "Audit Trail Export",       desc: "Compliance records PDF/CSV" },
                { icon: Zap,      label: "EVF + AI Intelligence",    desc: "AI confidence & risk flags" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl bg-[--muted]/50">
                  <div className="w-7 h-7 rounded-lg bg-[--card] border border-[--border] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[--muted-foreground]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[--foreground]">{label}</p>
                    <p className="text-[10px] text-[--muted-foreground]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
