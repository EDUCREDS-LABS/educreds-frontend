import { Switch, Route, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppKitProvider } from "@/lib/appkit-provider";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ChatWidget } from "@/components/ChatWidget";
const RegisterVerifyOtp = lazy(() => import("@/pages/auth/register-verify-otp"));
const EduCredsLabsLanding = lazy(() => import("@/pages/EduCredsLabsLanding"));
const Landing = lazy(() => import("@/pages/landing"));
const Login = lazy(() => import("@/pages/auth/login"));
const Register = lazy(() => import("@/pages/auth/register"));
const InstitutionDashboard = lazy(() => import("@/pages/institution/dashboard"));
const Certificates = lazy(() => import("@/pages/institution/certificates"));
const Verification = lazy(() => import("@/pages/institution/verification"));
const GovernanceVerification = lazy(() => import("@/pages/institution/governance-verification"));
const GovernanceDashboard = lazy(() => import("@/pages/institution/governance"));
const GovernanceWorkspace = lazy(() => import("@/pages/institution/governance-workspace"));
const ProposalDetail = lazy(() => import("@/pages/institution/governance/proposal-detail"));
const SubscriptionPage = lazy(() => import("@/pages/institution/subscription"));
const InstitutionProfile = lazy(() => import("@/pages/institution/profile"));
const InstitutionSettings = lazy(() => import("@/pages/institution/settings"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminGovernanceDashboard = lazy(() => import("@/pages/admin/governance-dashboard"));
const DAODashboard = lazy(() => import("@/pages/DAODashboard"));
const PublicWalletVotingPage = lazy(() => import("@/pages/governance/public-wallet-voting"));
const MarketplacePage = lazy(() => import("@/pages/marketplace/index"));
const MarketplaceLogin = lazy(() => import("@/pages/marketplace/login"));
const MarketplaceRegister = lazy(() => import("@/pages/marketplace/register"));
const MarketplaceVerify = lazy(() => import("@/pages/marketplace/verify"));
const DesignerPage = lazy(() => import("@/pages/designer/index"));
const DesignerEditor = lazy(() => import("@/pages/designer/editor"));
const TemplateDetailsPage = lazy(() => import("@/pages/marketplace/[id]"));
const TemplatesPage = lazy(() => import("@/pages/templates"));
const BrowseTemplatesPage = lazy(() => import("@/pages/templates/Browse"));
const MyTemplatesPage = lazy(() => import("@/pages/templates/MyTemplates"));
const CreateTemplatePage = lazy(() => import("@/pages/templates/Create"));
const TemplateDesignerPage = lazy(() => import("@/pages/templates/Designer"));
const SmartAIPage = lazy(() => import("@/pages/templates/SmartAI"));
const AnalyticsPage = lazy(() => import("@/pages/institution/analytics"));
const NotFound = lazy(() => import("@/pages/not-found"));
const TermsOfService = lazy(() => import("@/pages/legal/terms"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/privacy"));
const AboutUsPage = lazy(() => import("@/pages/about"));
const CareersPage = lazy(() => import("@/pages/careers"));
const BlogPage = lazy(() => import("@/pages/blog"));
const PressKitPage = lazy(() => import("@/pages/press"));
const DocumentationPage = lazy(() => import("@/pages/documentation"));
const ApiReferencePage = lazy(() => import("@/pages/api-reference"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const W3CTestPage = lazy(() => import("@/pages/w3c-test"));
const StudentPortalPage = lazy(() => import("@/pages/student-portal"));
const VerificationPortalPage = lazy(() => import("@/pages/verification-portal"));
const TrustRegistryPage = lazy(() => import("@/pages/registry"));
const SystemTest = lazy(() => import("@/pages/system-test"));
const ManageSpecs = lazy(() => import("@/components/institution/ManageSpecs"));
const InstitutionIssuePage = lazy(() => import("@/pages/institution/issue"));
const DeveloperPortalPage = lazy(() => import("@/pages/developer-portal"));
// import MarketplaceProtectedRoute from "@/components/MarketplaceProtectedRoute";

function Router() {
  function LegacyStudentRedirect() {
    const [, setLocation] = useLocation();

    useEffect(() => {
      setLocation("/student-portal");
    }, [setLocation]);

    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-neutral-600">
          Loading...
        </div>
      }
    >
      <Switch>
      <Route path="/" component={EduCredsLabsLanding} />
      <Route path="/infra" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/register/verify-otp" component={RegisterVerifyOtp} />
      <Route path="/student" component={LegacyStudentRedirect} />
      <Route path="/student-portal" component={StudentPortalPage} />
      <Route path="/verification-portal" component={VerificationPortalPage} />
      <Route path="/trust-registry" component={TrustRegistryPage} />
      <Route path="/w3c-test" component={W3CTestPage} />

      {/* Public Routes */}
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/marketplace/login" component={MarketplaceLogin} />
      <Route path="/marketplace/register" component={MarketplaceRegister} />
      <Route path="/marketplace/verify" component={MarketplaceVerify} />
      <Route path="/marketplace/:id" component={TemplateDetailsPage} />
      {/* Temporarily disabled marketplace protected routes */}
      {/* <MarketplaceProtectedRoute>
        <Route path="/designer" component={DesignerPage} />
        <Route path="/designer/editor" component={DesignerEditor} />
      </MarketplaceProtectedRoute> */}
      <Route path="/designer" component={DesignerPage} />
      <Route path="/designer/editor" component={DesignerEditor} />

      {/* Legal Pages */}
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/about" component={AboutUsPage} />
      <Route path="/careers" component={CareersPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/press" component={PressKitPage} />
      <Route path="/documentation" component={DocumentationPage} />
      <Route path="/api-reference" component={ApiReferencePage} />

      {/* Developer Portal - Protected */}
      <Route path="/developer-portal">
        <ProtectedRoute>
          <Layout>
            <DeveloperPortalPage />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Public Pricing Page */}
      <Route path="/pricing" component={PricingPage} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/governance" component={AdminGovernanceDashboard} />
      <Route path="/dao" component={DAODashboard} />
      <Route path="/governance/public-vote">
        <Layout>
          <PublicWalletVotingPage />
        </Layout>
      </Route>

      {/* Protected Institution Routes */}
      <Route path="/institution/dashboard">
        <ProtectedRoute>
          <Layout>
            <InstitutionDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/certificates">
        <ProtectedRoute>
          <Layout>
            <Certificates />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/verification">
        <ProtectedRoute>
          <Layout>
            <Verification />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/governance-verification">
        <ProtectedRoute>
          <Layout>
            <GovernanceVerification />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/governance-workspace">
        <ProtectedRoute>
          <Layout>
            <GovernanceWorkspace />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Legacy governance route - redirects to workspace */}
      <Route path="/institution/governance">
        <ProtectedRoute>
          <Layout>
            <GovernanceDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/governance/proposals/:id">
        <ProtectedRoute>
          <Layout>
            <ProposalDetail />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/subscription">
        <ProtectedRoute>
          <Layout>
            <SubscriptionPage />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/profile">
        <ProtectedRoute>
          <Layout>
            <InstitutionProfile />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/settings">
        <ProtectedRoute>
          <Layout>
            <InstitutionSettings />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/analytics">
        <ProtectedRoute>
          <Layout>
            <AnalyticsPage />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/issue">
        <ProtectedRoute>
          <Layout>
            <InstitutionIssuePage />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/manage-specs">
        <ProtectedRoute>
          <Layout>
            <ManageSpecs />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/templates">
        <ProtectedRoute>
          <Layout>
            <TemplatesPage />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/templates/browse">
        <ProtectedRoute>
          <Layout>
            <BrowseTemplatesPage />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/templates/my-templates">
        <ProtectedRoute>
          <Layout>
            <MyTemplatesPage />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/institution/templates/create">
        <ProtectedRoute>
          <Layout>
            <CreateTemplatePage />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Designer is a full-screen workspace — no Layout wrapper to avoid
          triple-header stacking (Layout nav + outer header + TemplateDesigner header) */}
      <Route path="/institution/templates/designer">
        <ProtectedRoute>
          <TemplateDesignerPage />
        </ProtectedRoute>
      </Route>

      <Route path="/institution/templates/smart-ai">
        <ProtectedRoute>
          <Layout>
            <SmartAIPage />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/system-test">
        <ProtectedRoute>
          <Layout>
            <SystemTest />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <AppKitProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatWidget />
        </TooltipProvider>
      </QueryClientProvider>
    </AppKitProvider>
  );
}

export default App;
