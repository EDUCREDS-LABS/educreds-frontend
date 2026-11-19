import { useEffect, lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppKitProvider } from "@/lib/appkit-provider";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/PublicLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import WorkspaceRoute from "@/components/WorkspaceRoute";
import { TierGuard } from "@/components/TierGuard";
import { AuthType } from "@/lib/dualAuth";
import { DevProvider } from "./DevContext";
import { ChatWidget } from "@/components/ChatWidget";
import { DevBypassBar } from "@/components/DevBypassBar";
import { PageLoader } from "@/components/PageLoader";
import { useThemeStore } from "@/store/themeStore";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { useAuth } from "@/hooks/useAuth";
import type { DeploymentTier } from "@/lib/deploymentTier";
import { useActiveWorkspace } from "@/lib/useActiveWorkspace";
import { WORKSPACES } from "@/lib/workspaces";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
// Admin panel has been moved to the internal trust-agent-dashboard (SWA).
// The /admin/* routes below return 404 to prevent exposure on the public domain.

// --- Providers from new architecture ---
import { RegionProvider } from '@/components/modern/RegionProvider';
import { AuthProvider } from '@/providers/AuthProvider';

// --- Auth and Public Pages (New and Existing) ---
const WorkspaceSelectorPage = lazy(() => import("@/pages/WorkspaceSelectorPage"));
const LandingPage = lazy(() => import("@/pages/auth/LandingPage"));
const LoginPage = lazy(() => import("@/pages/auth/login"));
const DeveloperLoginPage = lazy(() => import("@/pages/auth/DeveloperLoginPage"));
const DeveloperRegisterPage = lazy(() => import("@/pages/auth/DeveloperRegisterPage"));
const VerifierLoginPage = lazy(() => import("@/pages/auth/VerifierLoginPage"));
const VerifierRegisterPage = lazy(() => import("@/pages/auth/VerifierRegisterPage"));
const GovernmentLoginPage = lazy(() => import("@/pages/auth/GovernmentLoginPage"));
const AccessPortalPage = lazy(() => import("@/pages/auth/AccessPortalPage"));
const StudentLoginPage = lazy(() => import("@/pages/auth/StudentLoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/register"));
const RegisterVerifyOtp = lazy(() => import("@/pages/auth/register-verify-otp"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/auth/reset-password"));
const NotFound = lazy(() => import("@/pages/not-found"));
const EnterpriseTrustLayer = lazy(() => import("@/pages/trust-layer/index"));
const TrustLayerDoc = lazy(() => import("@/pages/trust-layer/TrustLayerDoc"));
const StudentPortalPage = lazy(() => import("@/pages/student-portal"));
const TrustRegistryPage = lazy(() => import("@/pages/registry"));
const VerifyPage = lazy(() => import("@/pages/verify"));
const VerifyCardPage = lazy(() => import("@/pages/verify/card"));
const VerificationPortalPage = lazy(() => import("@/pages/employer/verify"));
// Verifier workspace pages
const VerifierDashboardPage = lazy(() => import("@/pages/verifier/dashboard"));
const VerifierVerifyPage = lazy(() => import("@/pages/verifier/verify"));
const VerifierQueuePage = lazy(() => import("@/pages/verifier/queue"));
const VerifierHistoryPage = lazy(() => import("@/pages/verifier/history"));
const VerifierAnalyticsPage = lazy(() => import("@/pages/verifier/analytics"));
const VerifierSettingsPage = lazy(() => import("@/pages/verifier/settings"));
const VerifierBillingPage = lazy(() => import("@/pages/verifier/billing/plan"));
const GovernancePublicVotePage = lazy(() => import("@/pages/governance/public-wallet-voting"));
const DeveloperPortalPage = lazy(() => import("@/pages/developer-portal"));
// Template/designer pages removed — credential rendering architecture decision 2026-10-29
// Templates replaced by Credential Branding in institution settings
const InstitutionIssuePage = lazy(() => import("@/pages/institution/issue"));
const InstitutionCertificatesPage = lazy(() => import("@/pages/institution/certificates"));
const InstitutionCredentialDetailPage = lazy(() => import("@/pages/institution/credential-detail"));
const InstitutionProfilePage = lazy(() => import("@/pages/institution/profile"));
const InstitutionSettingsPage = lazy(() => import("@/pages/institution/settings"));
const InstitutionGovernanceWorkspace = lazy(() => import("@/pages/institution/governance-workspace"));
const InstitutionProposalDetail = lazy(() => import("@/pages/institution/governance/proposal-detail"));
const InstitutionSubscriptionPage = lazy(() => import("@/pages/institution/subscription"));
const VerifierSubscriptionPage = lazy(() => import("@/pages/verifier/subscription"));
const InstitutionLmsImportPage = lazy(() => import("@/pages/institution/lms-import"));
const InstitutionStudentsPage = lazy(() => import("@/pages/institution/students"));
const InstitutionEnrollmentPage = lazy(() => import("@/pages/institution/enrollment"));
const InstitutionProgramsPage = lazy(() => import("@/pages/institution/programs"));
const InstitutionCohortsPage = lazy(() => import("@/pages/institution/cohorts"));
const InstitutionLoginPage = lazy(() => import("@/pages/auth/InstitutionLoginPage"));
const PendingApprovalPage = lazy(() => import("@/pages/institution/PendingApprovalPage"));
const CredentialDesignPage = lazy(() => import("@/pages/institution/credential-design"));

// New Identity Pages
const ClaimCredentialPage = lazy(() => import("@/pages/claim/ClaimCredentialPage"));
const EduCredsIdentityPage = lazy(() => import("@/pages/identity/EduCredsIdentityPage"));

// Institution DID Management (fix/frontend-audit-aug9)
const InstitutionDIDManagementPage = lazy(() => import("@/pages/institution/did-management"));
const InstitutionStaffManagementPage = lazy(() => import("@/pages/institution/staff-management"));
const InstitutionInvoicesPage = lazy(() => import("@/pages/institution/billing/invoices"));
const InstitutionUpgradePage = lazy(() => import("@/pages/institution/billing/upgrade"));
const StudentSharePage = lazy(() => import("@/pages/student-portal/share"));
const StudentDashboardPage = lazy(() => import("@/pages/student/dashboard"));
const StudentCredentialsPage = lazy(() => import("@/pages/student/credentials"));
const StudentCredentialDetailPage = lazy(() => import("@/pages/student/credential-detail"));
const StudentIdentityPage = lazy(() => import("@/pages/student/identity"));
const StudentActivityPage = lazy(() => import("@/pages/student/activity"));
const StudentCampaignsPage = lazy(() => import("@/pages/student/campaigns"));
const StudentSettingsPage = lazy(() => import("@/pages/student/settings"));
const DeveloperApiExplorerPage = lazy(() => import("@/pages/developer-portal/api-explorer"));
const DeveloperUsagePage = lazy(() => import("@/pages/developer-portal/usage"));

// Workspace API Access Pages (Problem 5)
const VerifierApiAccessPage    = lazy(() => import("@/pages/verifier/api-access"));
const GovernmentApiAccessPage  = lazy(() => import("@/pages/government/api-access"));

// Government Workspace (fix/frontend-audit-aug9 — was a shell, now functional)
const GovernmentDashboardPage       = lazy(() => import("@/pages/government/dashboard"));
const GovernmentInstitutionsPage    = lazy(() => import("@/pages/government/institutions"));
const GovernmentTrustMonitoringPage = lazy(() => import("@/pages/government/trust-monitoring"));
const GovernmentAccreditationPage   = lazy(() => import("@/pages/government/accreditation"));
const GovernmentInvestigationsPage  = lazy(() => import("@/pages/government/investigations"));
const GovernmentAnalyticsPage       = lazy(() => import("@/pages/government/analytics"));

// --- New Enterprise Feature Modules ---
// Workspace (canonical: /institution/*)
const WorkspaceEnhancedAnalyticsPage = lazy(() => import("@/modules/workspace/EnhancedAnalyticsPage"));
const WorkspaceBatchOperationsPage = lazy(() => import("@/modules/workspace/BatchOperationsPage"));
const WorkspaceAuditTrailPage = lazy(() => import("@/modules/workspace/AuditTrailPage"));
const WorkspaceWebhooksPage = lazy(() => import("@/modules/workspace/WebhooksPage"));
const WorkspaceWhiteLabelPage = lazy(() => import("@/modules/workspace/WhiteLabelPage"));
const WorkspaceIssuanceMonitorPage = lazy(() => import("@/pages/institution/issuance-monitor"));
// Integration (canonical: /connect/*)
const IntegrationConnectorPage = lazy(() => import("@/modules/integration/ConnectorPage"));
const IntegrationAPIKeyManagementPage = lazy(() => import("@/modules/integration/APIKeyManagementPage"));
const IntegrationDataMappingPage = lazy(() => import("@/modules/integration/DataMappingPage"));
const IntegrationHealthDashboardPage = lazy(() => import("@/modules/integration/HealthDashboardPage"));
const IntegrationDelegatedSigningPage = lazy(() => import("@/modules/integration/DelegatedSigningPage"));
// Governance (canonical: /compliance/*)
const GovernanceEnterpriseOverviewPage = lazy(() => import("@/modules/governance/EnterpriseOverviewPage"));
const GovernanceIntelligencePage = lazy(() => import("@/modules/governance/IntelligencePage"));
const GovernancePoICSubmissionPage = lazy(() => import("@/modules/governance/PoICSubmissionPage"));
const GovernanceNotificationSettingsPage = lazy(() => import("@/modules/governance/NotificationSettingsPage"));

// --- Existing Pages ---
const InstitutionOverview = lazy(() => import("@/pages/institution/overview"));

const InstitutionDashboard = lazy(() => import("@/pages/institution/dashboard"));

// Hard redirect to external URL — React Router Navigate can't do external URLs
function ExternalRedirect({ to }: { to: string }) {
  window.location.replace(to);
  return null;
}

function AppContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workspaces, active, setActive } = useActiveWorkspace();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingTier, setOnboardingTier] = useState<DeploymentTier>('workspace');

  // Phase0 — Workspace resolution. After login, if the user belongs to more than
  // one workspace and hasn't picked one yet, show the Select Workspace screen
  // (Azure tenant-picker behaviour). A single-workspace user skips this; their
  // one workspace is implicitly active.
  const isAuthed = Boolean(user);
  const forcePicker = window.location.pathname === "/select-workspace";
  const singleWorkspaceHome =
    isAuthed && workspaces.length === 1 ? WORKSPACES[workspaces[0]].homePath : "/";
  const needsWorkspacePicker =
    isAuthed &&
    workspaces.length > 1 &&
    (!active || !workspaces.includes(active) || forcePicker);

  useEffect(() => {
    const handleStartOnboarding = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.tier) {
        setOnboardingTier(detail.tier as DeploymentTier);
      } else {
        setOnboardingTier((user?.deploymentTier as DeploymentTier) ?? 'workspace');
      }
      setShowOnboarding(true);
    };
    window.addEventListener('startOnboarding', handleStartOnboarding as EventListener);
    return () => window.removeEventListener('startOnboarding', handleStartOnboarding as EventListener);
  }, [user?.deploymentTier]);

  // Auto-offer the guided tour on first load (and whenever the tier is first known)
  useEffect(() => {
    if (!user?.deploymentTier) return;
    const seen = window.localStorage.getItem('educreds_onboarding_v2');
    if (!seen) {
      setOnboardingTier(user.deploymentTier as DeploymentTier);
      setShowOnboarding(true);
      window.localStorage.setItem('educreds_onboarding_v2', user.deploymentTier);
    }
  }, [user?.deploymentTier]);

  if (needsWorkspacePicker) {
    return (
      <WorkspaceSelector
        workspaces={workspaces}
        onSelect={(id) => setActive(id)}
        onCancel={() => navigate("/")}
      />
    );
  }

  return (
    <>
      <DevBypassBar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public and Auth Routes */}
          <Route path="/" element={<WorkspaceSelectorPage />} />
          {/* Phase0 — addressable workspace selection. Multi-workspace users
              hit the picker (global gate) here; single-workspace users are
              redirected to their workspace home. */}
          <Route path="/select-workspace" element={<Navigate to={singleWorkspaceHome} replace />} />
          <Route path="/about" element={<Navigate to="https://educreds.xyz/about" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/verify-otp" element={<RegisterVerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Developer Auth Routes */}
          <Route path="/developer/login" element={<DeveloperLoginPage />} />
          <Route path="/developer/register" element={<DeveloperRegisterPage />} />

          {/* Verifier Auth Routes */}
          <Route path="/verifier/login" element={<VerifierLoginPage />} />
          <Route path="/verifier/register" element={<VerifierRegisterPage />} />

          {/* Government Auth Routes */}
          <Route path="/government/login" element={<GovernmentLoginPage />} />
          <Route path="/access" element={<AccessPortalPage />} />
          <Route path="/infra" element={<Navigate to="https://educreds.xyz" replace />} />
          <Route path="/claim/:token" element={<PublicLayout><ClaimCredentialPage /></PublicLayout>} />
          <Route path="/identity/:eduCredsId" element={<PublicLayout><EduCredsIdentityPage /></PublicLayout>} />

          {/* Legal Pages */}
          <Route path="/terms" element={<Navigate to="https://educreds.xyz/terms" replace />} />
          <Route path="/privacy" element={<Navigate to="https://educreds.xyz/privacy" replace />} />
          {/* Enterprise Trust Layer — sales package */}
          <Route path="/trust-layer" element={<Layout><EnterpriseTrustLayer /></Layout>} />
          <Route path="/trust-layer/security/*" element={<Layout><TrustLayerDoc /></Layout>} />
          <Route path="/trust-layer/privacy/*" element={<Layout><TrustLayerDoc /></Layout>} />
          <Route path="/trust-layer/governance/*" element={<Layout><TrustLayerDoc /></Layout>} />
          <Route path="/trust-layer/operational/*" element={<Layout><TrustLayerDoc /></Layout>} />
          <Route path="/trust-layer/legal/*" element={<Layout><TrustLayerDoc /></Layout>} />
          <Route path="/careers" element={<Navigate to="https://educreds.xyz/careers" replace />} />
          <Route path="/blog" element={<Navigate to="https://educreds.xyz/blog" replace />} />
          <Route path="/press" element={<Navigate to="https://educreds.xyz/press" replace />} />
          <Route path="/documentation" element={<Navigate to="https://docs.educreds.xyz" replace />} />
          <Route path="/documentation/:slug" element={<Navigate to="https://docs.educreds.xyz" replace />} />
          <Route path="/api-reference" element={<Navigate to="/documentation/developers" replace />} />
          <Route path="/pricing" element={<ExternalRedirect to="https://educreds.xyz/pricing" />} />
          <Route path="/student-portal" element={<PublicLayout><StudentPortalPage /></PublicLayout>} />
          <Route path="/student-portal/share/:credentialId" element={<PublicLayout><StudentSharePage /></PublicLayout>} />

          {/* Student workspace (authenticated) */}
          <Route path="/student/dashboard"    element={<WorkspaceRoute workspace="student"><Layout><StudentDashboardPage /></Layout></WorkspaceRoute>} />
          <Route path="/student/credentials"  element={<WorkspaceRoute workspace="student"><Layout><StudentCredentialsPage /></Layout></WorkspaceRoute>} />
          <Route path="/student/credentials/:id" element={<ProtectedRoute requiredType={AuthType.STUDENT}><Layout><StudentCredentialDetailPage /></Layout></ProtectedRoute>} />
          <Route path="/student/identity"     element={<WorkspaceRoute workspace="student"><Layout><StudentIdentityPage /></Layout></WorkspaceRoute>} />
          <Route path="/student/activity"     element={<WorkspaceRoute workspace="student"><Layout><StudentActivityPage /></Layout></WorkspaceRoute>} />
          <Route path="/student/campaigns"   element={<WorkspaceRoute workspace="student"><Layout><StudentCampaignsPage /></Layout></WorkspaceRoute>} />
          <Route path="/student/settings"   element={<WorkspaceRoute workspace="student"><Layout><StudentSettingsPage /></Layout></WorkspaceRoute>} />
          <Route path="/trust-registry" element={<PublicLayout><TrustRegistryPage /></PublicLayout>} />
          <Route path="/verify" element={<PublicLayout><VerifyPage /></PublicLayout>} />
          <Route path="/verify/:certificateId" element={<PublicLayout><VerifyCardPage /></PublicLayout>} />
          {/* /employer/verify kept for backward compat (emails, external links) — redirects to verifier workspace */}
          <Route path="/employer/verify" element={<Navigate to="/verifier/verify" replace />} />
          <Route path="/verifier/subscription" element={<PublicLayout><VerifierSubscriptionPage /></PublicLayout>} />

          {/* Verifier workspace */}
          <Route path="/verifier/dashboard"    element={<WorkspaceRoute workspace="verifier"><Layout><VerifierDashboardPage /></Layout></WorkspaceRoute>} />
          <Route path="/verifier/verify"       element={<WorkspaceRoute workspace="verifier"><Layout><VerifierVerifyPage /></Layout></WorkspaceRoute>} />
          <Route path="/verifier/queue"        element={<WorkspaceRoute workspace="verifier"><Layout><VerifierQueuePage /></Layout></WorkspaceRoute>} />
          <Route path="/verifier/history"      element={<WorkspaceRoute workspace="verifier"><Layout><VerifierHistoryPage /></Layout></WorkspaceRoute>} />
          <Route path="/verifier/analytics"    element={<WorkspaceRoute workspace="verifier"><Layout><VerifierAnalyticsPage /></Layout></WorkspaceRoute>} />
          <Route path="/verifier/settings"     element={<WorkspaceRoute workspace="verifier"><Layout><VerifierSettingsPage /></Layout></WorkspaceRoute>} />
          <Route path="/verifier/billing/plan" element={<WorkspaceRoute workspace="verifier"><Layout><VerifierBillingPage /></Layout></WorkspaceRoute>} />
          <Route path="/verifier/api-access"   element={<WorkspaceRoute workspace="verifier"><Layout><VerifierApiAccessPage /></Layout></WorkspaceRoute>} />
          <Route path="/verifier"              element={<Navigate to="/verifier/dashboard" replace />} />
          <Route path="/governance/public-vote" element={<PublicLayout><GovernancePublicVotePage /></PublicLayout>} />
          <Route path="/developer-portal" element={<WorkspaceRoute workspace="developer"><Layout><DeveloperPortalPage /></Layout></WorkspaceRoute>} />
          <Route path="/developer-portal/api-explorer" element={<WorkspaceRoute workspace="developer"><Layout><DeveloperApiExplorerPage /></Layout></WorkspaceRoute>} />
          <Route path="/developer-portal/usage" element={<WorkspaceRoute workspace="developer"><Layout><DeveloperUsagePage /></Layout></WorkspaceRoute>} />
          <Route path="/developer-portal/webhooks" element={<WorkspaceRoute workspace="developer"><Layout><WorkspaceWebhooksPage /></Layout></WorkspaceRoute>} />
          {/* Template routes removed — redirect to settings for bookmarks */}
          <Route path="/templates/*" element={<Navigate to="/institution/settings" replace />} />
          <Route path="/designer" element={<Navigate to="/institution/settings" replace />} />

          {/* Institution SSO & Pending Approval */}
          <Route path="/institution/login" element={<PublicLayout><InstitutionLoginPage /></PublicLayout>} />
          <Route path="/institution/pending-approval" element={<PublicLayout><PendingApprovalPage /></PublicLayout>} />

          {/* Institution Routes (canonical) */}
          <Route path="/institution/dashboard" element={<Navigate to="/institution/overview" replace />} />
          <Route path="/institution/overview" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionOverview /></Layout></ProtectedRoute>} />
          <Route path="/institution/permissions" element={<Navigate to="/institution/staff" replace />} />
          <Route path="/institution/issue" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><InstitutionIssuePage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/bulk-issuance" element={<Navigate to="/institution/issue" replace />} />
          <Route path="/institution/certificates" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionCertificatesPage /></Layout></ProtectedRoute>} />
          <Route path="/institution/credentials/:id" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionCredentialDetailPage /></Layout></ProtectedRoute>} />
          <Route path="/institution/manage-specs" element={<Navigate to="/institution/settings" replace />} />
          <Route path="/institution/lms-import" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><InstitutionLmsImportPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/students" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><InstitutionStudentsPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/enrollment" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><InstitutionEnrollmentPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/programs" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><InstitutionProgramsPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/cohorts" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><InstitutionCohortsPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/profile" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/institution/settings" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionSettingsPage /></Layout></ProtectedRoute>} />
          <Route path="/institution/subscription" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionSubscriptionPage /></Layout></ProtectedRoute>} />
          <Route path="/institution/governance-workspace" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionGovernanceWorkspace /></Layout></ProtectedRoute>} />
          <Route path="/institution/governance/proposals/:id" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionProposalDetail /></Layout></ProtectedRoute>} />

          {/* Workspace Tier — canonical: /institution/* (Tier 3 only) */}
          <Route path="/institution/analytics" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><WorkspaceEnhancedAnalyticsPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/bulk-issue" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><WorkspaceBatchOperationsPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/batch-operations" element={<Navigate to="/institution/bulk-issue" replace />} />
          <Route path="/institution/audit-trail" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><WorkspaceAuditTrailPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/webhooks" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace', 'cloud-connector', 'enterprise-connector']}><WorkspaceWebhooksPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/white-label" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><WorkspaceWhiteLabelPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/credential-design" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace']}><CredentialDesignPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/institution/issuance-monitor" element={<Navigate to="/institution/activity" replace />} />
          <Route path="/institution/activity" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace','cloud-connector','enterprise-connector']}><WorkspaceIssuanceMonitorPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/activity" element={<Navigate to="/institution/activity" replace />} />
          {/* DID Control Panel (fix/frontend-audit-aug9) */}
          <Route path="/institution/did-management" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionDIDManagementPage /></Layout></ProtectedRoute>} />
          <Route path="/institution/verification" element={<Navigate to="/compliance/trust-score" replace />} />
          {/* Institution Users */}
          <Route path="/institution/users" element={<Navigate to="/institution/staff" replace />} />
          <Route path="/institution/admin/staff" element={<Navigate to="/institution/staff" replace />} />
          <Route path="/institution/staff" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionStaffManagementPage /></Layout></ProtectedRoute>} />
          {/* Institution Billing */}
          <Route path="/institution/billing/invoices" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionInvoicesPage /></Layout></ProtectedRoute>} />
          <Route path="/institution/billing/upgrade" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><InstitutionUpgradePage /></Layout></ProtectedRoute>} />

          {/* Integration — wizard covers all three deployment tiers */}
          <Route path="/connect/connector" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['workspace', 'cloud-connector', 'enterprise-connector']}><IntegrationConnectorPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/connect/api-keys" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><IntegrationAPIKeyManagementPage /></Layout></ProtectedRoute>} />
          <Route path="/connect/data-mapping" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['cloud-connector', 'enterprise-connector']}><IntegrationDataMappingPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/connect/health-dashboard" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['cloud-connector', 'enterprise-connector']}><IntegrationHealthDashboardPage /></TierGuard></Layout></ProtectedRoute>} />
          <Route path="/connect/delegated-signing" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><TierGuard allowedTiers={['cloud-connector', 'enterprise-connector']}><IntegrationDelegatedSigningPage /></TierGuard></Layout></ProtectedRoute>} />

          {/* Governance Tier — canonical: /compliance/* */}
          <Route path="/compliance/enterprise-overview" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><GovernanceEnterpriseOverviewPage /></Layout></ProtectedRoute>} />
          {/* Trust Score hub — PoIC submission + current score + governance action */}
          <Route path="/compliance/trust-score" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><GovernancePoICSubmissionPage /></Layout></ProtectedRoute>} />
          <Route path="/compliance/intelligence" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><GovernanceIntelligencePage /></Layout></ProtectedRoute>} />
          <Route path="/compliance/notification-settings" element={<ProtectedRoute requiredType={AuthType.INSTITUTION}><Layout><GovernanceNotificationSettingsPage /></Layout></ProtectedRoute>} />
          {/* Redirects: old /compliance/verification and /compliance/poic-submission → new canonical */}
          <Route path="/compliance/verification" element={<Navigate to="/compliance/trust-score" replace />} />
          <Route path="/compliance/poic-submission" element={<Navigate to="/compliance/trust-score" replace />} />

          {/* Legacy redirects — old paths → canonical paths */}
          <Route path="/workspace/analytics" element={<Navigate to="/institution/analytics" replace />} />
          <Route path="/workspace/enhanced-analytics" element={<Navigate to="/institution/analytics" replace />} />
          <Route path="/workspace/batch-operations" element={<Navigate to="/institution/bulk-issue" replace />} />
          <Route path="/workspace/audit-trail" element={<Navigate to="/institution/audit-trail" replace />} />
          <Route path="/workspace/webhooks" element={<Navigate to="/institution/webhooks" replace />} />
          <Route path="/workspace/white-label" element={<Navigate to="/institution/white-label" replace />} />
          <Route path="/workspace/issuance-monitor" element={<Navigate to="/institution/activity" replace />} />
          <Route path="/integration/connector" element={<Navigate to="/connect/connector" replace />} />
          <Route path="/integration/api-keys" element={<Navigate to="/connect/api-keys" replace />} />
          <Route path="/integration/data-mapping" element={<Navigate to="/connect/data-mapping" replace />} />
          <Route path="/integration/health-dashboard" element={<Navigate to="/connect/health-dashboard" replace />} />
          <Route path="/integration/delegated-signing" element={<Navigate to="/connect/delegated-signing" replace />} />
          <Route path="/governance/enterprise-overview" element={<Navigate to="/compliance/enterprise-overview" replace />} />
          <Route path="/governance/intelligence" element={<Navigate to="/compliance/intelligence" replace />} />
          <Route path="/governance/poic-submission" element={<Navigate to="/compliance/trust-score" replace />} />
          <Route path="/governance/notification-settings" element={<Navigate to="/compliance/notification-settings" replace />} />
          <Route path="/institution/enhanced-analytics" element={<Navigate to="/institution/analytics" replace />} />
          <Route path="/institution/templates/*" element={<Navigate to="/institution/settings" replace />} />
          <Route path="/institution/governance-verification" element={<Navigate to="/compliance/trust-score" replace />} />
          <Route path="/institution/issuance" element={<Navigate to="/institution/issue" replace />} />
          <Route path="/institution/lms-migration" element={<Navigate to="/institution/lms-import" replace />} />
          <Route path="/certificate-issuance/manage-specs" element={<Navigate to="/institution/settings" replace />} />
          <Route path="/certificate-issuance/:method" element={<Navigate to="/institution/issue" replace />} />
          <Route path="/certificate-issuance" element={<Navigate to="/institution/issue" replace />} />

          {/* Workspace API Access Pages */}
          <Route path="/institution/api-access" element={<Navigate to="/connect/api-keys" replace />} />
          <Route path="/government/api-access"  element={<WorkspaceRoute workspace="government"><Layout><GovernmentApiAccessPage /></Layout></WorkspaceRoute>} />

          {/* Government Workspace */}
          <Route path="/government"                    element={<WorkspaceRoute workspace="government"><Layout><GovernmentDashboardPage /></Layout></WorkspaceRoute>} />
          <Route path="/government/dashboard"          element={<WorkspaceRoute workspace="government"><Layout><GovernmentDashboardPage /></Layout></WorkspaceRoute>} />
          <Route path="/government/institutions"       element={<WorkspaceRoute workspace="government"><Layout><GovernmentInstitutionsPage /></Layout></WorkspaceRoute>} />
          <Route path="/government/trust-monitoring"   element={<WorkspaceRoute workspace="government"><Layout><GovernmentTrustMonitoringPage /></Layout></WorkspaceRoute>} />
          <Route path="/government/accreditation"      element={<WorkspaceRoute workspace="government"><Layout><GovernmentAccreditationPage /></Layout></WorkspaceRoute>} />
          <Route path="/government/investigations"     element={<WorkspaceRoute workspace="government"><Layout><GovernmentInvestigationsPage /></Layout></WorkspaceRoute>} />
          <Route path="/government/analytics"          element={<WorkspaceRoute workspace="government"><Layout><GovernmentAnalyticsPage /></Layout></WorkspaceRoute>} />

          {/* Admin panel moved to internal trust-agent-dashboard SWA — not accessible here */}
          <Route path="/admin/*" element={<NotFound />} />

          {/* Fallback to 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showOnboarding && <OnboardingFlow tier={onboardingTier} onComplete={() => setShowOnboarding(false)} onSkip={() => setShowOnboarding(false)} />}
      <ChatWidget />
    </>
  );
}

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <DevProvider>
      <AppKitProvider>
        <QueryClientProvider client={queryClient}>
          <RegionProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </RegionProvider>
        </QueryClientProvider>
      </AppKitProvider>
    </DevProvider>
  );
}

export default App;
