/**
 * Institution Overview — the registrar's operational home.
 * Every number comes from a live endpoint; missing data renders "—" or an explicit
 * unavailable state. No hardcoded health, rates or placeholder metrics.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Zap, Link2, ShieldCheck, Star, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { API_CONFIG } from "@/config/api";
import { getAuthHeaders } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { getTierInfo, isConnectorTier } from "@/lib/institutionTiers";
import { OnboardingChecklist, type SetupStep } from "@/components/institution/overview/OnboardingChecklist";
import { MetricTile, Panel, Unavailable } from "@/components/institution/overview/MetricTile";
import { LifecyclePanel, type PipelineSummary } from "@/components/institution/overview/LifecyclePanel";
import { SystemHealthPanel, type HealthStatus } from "@/components/institution/overview/SystemHealthPanel";
import { RecentCredentials } from "@/components/institution/overview/RecentCredentials";

const getJson = async <T,>(path: string): Promise<T> => {
  const res = await fetch(`${API_CONFIG.CERT}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
};

export default function InstitutionOverview() {
  const { user } = useAuth();
  const tier = getTierInfo(user?.deploymentTier);
  const connector = isConnectorTier(user?.deploymentTier);
  const on = { enabled: !!user, staleTime: 30_000 };

  const profile = useQuery({ queryKey: ["/api/institutions/profile"], queryFn: () => api.getProfile(), ...on });
  const stats = useQuery({ queryKey: ["/api/stats", user?.id], queryFn: () => api.getStats(user?.id), ...on });
  const analytics = useQuery({ queryKey: ["institution-analytics"], queryFn: () => getJson<any>("/api/institutions/me/analytics"), ...on });
  const pipeline = useQuery({ queryKey: ["pipeline-summary"], queryFn: () => getJson<PipelineSummary>("/api/certificates/institution/pipeline-summary"), ...on });
  const trust = useQuery({ queryKey: ["/api/institutions/trust-summary"], queryFn: () => getJson<any>("/api/institutions/trust-summary"), ...on });
  const staff = useQuery({ queryKey: ["institution-staff"], queryFn: () => getJson<any>("/api/institutions/staff"), ...on });
  const p = profile.data as any;
  const health = useQuery({
    queryKey: ["institution-health", p?.id],
    queryFn: () => getJson<HealthStatus>(`/api/institutions/${p.id}/health-status`),
    enabled: !!p?.id, staleTime: 60_000,
  });

  const issued = stats.data?.totalCertificates ?? analytics.data?.totalCredentials ?? null;
  const approved = p?.verificationStatus === "approved" || p?.isVerified === true;
  const steps: SetupStep[] = [
    { id: "registered", title: "Institution registered", detail: "Account and administrator email created.", done: !!p },
    { id: "approved", title: "Approved by EduCreds", detail: approved ? "Registration reviewed and approved." : `Status: ${p?.verificationStatus ?? "pending"}. EduCreds reviews every institution.`, done: approved, href: "/institution/profile", action: "Review profile" },
    { id: "did", title: "Institutional identity (DID) created", detail: "Your DID signs every credential you issue.", done: !!p?.did, href: "/institution/did-management", action: "Open identity & keys" },
    { id: "iin", title: "Institution Identity NFT issued", detail: "Required before credentials can be issued. Granted after compliance verification.", done: p?.iinTokenId != null, href: "/compliance/trust-score", action: "Submit verification" },
    connector
      ? { id: "connect", title: "Connect your SIS", detail: "Point your student information system at EduCreds.", done: !!(p?.connectorEndpoint || p?.connectorApiUrl), href: "/connect/connector", action: "Configure connector" }
      : { id: "first-credential", title: "Issue your first credential", detail: "Issue to one graduate to confirm your setup.", done: (issued ?? 0) > 0, href: "/institution/issue", action: "Issue credential" },
    { id: "team", title: "Invite your team", detail: "Give registrars scoped access instead of sharing one login.", done: (staff.data?.total ?? 0) > 0, href: "/institution/staff", action: "Invite staff" },
  ];

  const poic = p?.poicScore ?? stats.data?.poicScore ?? null;
  const baselineTrust = trust.data && Number(trust.data.verificationVolume ?? 0) === 0;
  const verifications = analytics.data?.verificationCount ?? trust.data?.verificationVolume ?? null;

  return (
    <div className="space-y-6" data-testid="institution-overview">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-neutral-500" data-testid="overview-tier-label">{tier.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50" data-testid="overview-institution-name">
            {p?.name ?? "Your institution"}
          </h1>
          <p className="text-sm text-neutral-500 mt-1 max-w-2xl">{tier.issuance}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" data-testid="overview-verify-btn">
            <a href="/verify" target="_blank" rel="noreferrer"><ShieldCheck className="size-4 mr-2" />Verify a credential<ExternalLink className="size-3 ml-1.5" /></a>
          </Button>
          {connector ? (
            <Button asChild data-testid="overview-primary-action"><Link to="/connect/health-dashboard"><Link2 className="size-4 mr-2" />Connection health</Link></Button>
          ) : (
            <Button asChild data-testid="overview-primary-action"><Link to="/institution/issue"><Zap className="size-4 mr-2" />Issue credential</Link></Button>
          )}
        </div>
      </header>

      {profile.isSuccess && <OnboardingChecklist steps={steps} />}
      {profile.isError && <Unavailable message="Your institution profile could not be loaded. Some setup information is unavailable." />}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Key metrics">
        <MetricTile testId="metric-issued" label="Credentials issued" value={issued} loading={stats.isLoading} href="/institution/certificates" definition="All credentials your institution has issued, excluding archived ones." />
        <MetricTile testId="metric-month" label="Issued this month" value={stats.data?.monthlyIssuance ?? analytics.data?.issuedThisMonth} loading={stats.isLoading} href="/institution/activity" definition="Credentials issued since the first day of the current calendar month." />
        <MetricTile testId="metric-verifications" label="Verifications" value={verifications} loading={analytics.isLoading} href="/institution/analytics" definition="Times an employer or third party checked one of your credentials." />
        <MetricTile testId="metric-revoked" label="Revoked" value={pipeline.data?.byStatus?.revoked ?? analytics.data?.revokedCount} loading={pipeline.isLoading} tone={(pipeline.data?.byStatus?.revoked ?? 0) > 0 ? "warn" : undefined} href="/institution/certificates" definition="Credentials your institution has withdrawn. They verify as revoked." />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <RecentCredentials />
          <LifecyclePanel data={pipeline.data} error={pipeline.isError} />
        </div>
        <div className="space-y-4">
          <Panel
            title="Trust score (PoIC)"
            description="Proof of Institutional Credibility: assessed from verification documents, issuance accuracy, revocations and audit outcomes."
            testId="trust-score-panel"
            action={<Link to="/compliance/trust-score" className="text-xs font-semibold text-primary hover:underline">Details</Link>}
          >
            {poic == null ? <Unavailable message="No score yet. Submit verification documents to receive your first assessment." /> : (
              <div>
                <div className="flex items-baseline gap-2">
                  <Star className="size-4 text-amber-500" />
                  <span className="text-3xl font-semibold tabular-nums" data-testid="trust-score-value">{poic}</span>
                  <span className="text-sm text-neutral-500">/ 100</span>
                </div>
                <div className="h-2 mt-3 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, Number(poic))}%` }} />
                </div>
                {baselineTrust && (
                  <p className="text-[11px] text-neutral-500 mt-3">Trust signals are at baseline until your credentials accumulate verification activity.</p>
                )}
              </div>
            )}
          </Panel>
          <SystemHealthPanel data={health.data} error={health.isError} />
          <Panel title="Explore" testId="overview-explore">
            <ul className="space-y-1 text-sm">
              {[
                { to: "/institution/analytics", label: "Reports & analytics" },
                { to: "/institution/audit-trail", label: "Audit trail" },
                { to: "/institution/staff", label: "Team & access" },
                { to: "/institution/subscription", label: "Plan & billing" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {l.label}<ArrowRight className="size-3.5 text-neutral-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
