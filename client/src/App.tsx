import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { CryptoPaymentProvider } from "@/components/payment/CryptoPaymentProvider";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RegisterVerifyOtp from "@/pages/auth/register-verify-otp";
import EduCredsLabsLanding from "@/pages/EduCredsLabsLanding";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import InstitutionDashboard from "@/pages/institution/dashboard";
import Certificates from "@/pages/institution/certificates";
import Verification from "@/pages/institution/verification";
import GovernanceVerification from "@/pages/institution/governance-verification";
import GovernanceDashboard from "@/pages/institution/governance";
import GovernanceWorkspace from "@/pages/institution/governance-workspace";
import ProposalDetail from "@/pages/institution/governance/proposal-detail";
import SubscriptionPage from "@/pages/institution/subscription";
import InstitutionProfile from "@/pages/institution/profile";
import InstitutionSettings from "@/pages/institution/settings";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminGovernanceDashboard from "@/pages/admin/governance-dashboard";
import DAODashboard from "@/pages/DAODashboard";
import MarketplacePage from "@/pages/marketplace/index";
import MarketplaceLogin from "@/pages/marketplace/login";
import MarketplaceRegister from "@/pages/marketplace/register";
import MarketplaceVerify from "@/pages/marketplace/verify";
import DesignerPage from "@/pages/designer/index";
import DesignerEditor from "@/pages/designer/editor";
import TemplateDetailsPage from "@/pages/marketplace/[id]";

import TemplatesPage from "@/pages/templates";
import BrowseTemplatesPage from "@/pages/templates/Browse";
import MyTemplatesPage from "@/pages/templates/MyTemplates";
import CreateTemplatePage from "@/pages/templates/Create";
import TemplateDesignerPage from "@/pages/templates/Designer";
import AnalyticsPage from "@/pages/institution/analytics";
import NotFound from "@/pages/not-found";
import verify from "@/pages/employer/verify";
import TermsOfService from "@/pages/legal/terms";
import PrivacyPolicy from "@/pages/legal/privacy";
import AboutUsPage from "@/pages/about";
import CareersPage from "@/pages/careers";
import BlogPage from "@/pages/blog";
import PressKitPage from "@/pages/press";
import DocumentationPage from "@/pages/documentation";
import ApiReferencePage from "@/pages/api-reference";
import PricingPage from "@/pages/pricing";
import W3CTestPage from "@/pages/w3c-test";
import StudentPortalPage from "@/pages/student-portal";
import VerificationPortalPage from "@/pages/verification-portal";
import SystemTest from "@/pages/system-test";
import ManageSpecs from "@/components/institution/ManageSpecs";
import CertificateIssuanceDashboard from '@/pages/certificate-issuance';
import DeveloperPortalPage from "@/pages/developer-portal";
// import MarketplaceProtectedRoute from "@/components/MarketplaceProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={EduCredsLabsLanding} />
      <Route path="/infra" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/register/verify-otp" component={RegisterVerifyOtp} />
      <Route path="/student-portal" component={StudentPortalPage} />
      <Route path="/verification-portal" component={VerificationPortalPage} />
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
            <CertificateIssuanceDashboard />
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

      <Route path="/institution/templates/designer">
        <ProtectedRoute>
          <Layout>
            <TemplateDesignerPage />
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CryptoPaymentProvider>
          <Toaster />
          <Router />
          <Analytics />
          <SpeedInsights />
        </CryptoPaymentProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;