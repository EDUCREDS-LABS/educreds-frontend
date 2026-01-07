import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RegisterVerifyOtp from "@/pages/auth/register-verify-otp";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import InstitutionDashboard from "@/pages/institution/dashboard";
import Certificates from "@/pages/institution/certificates";
import Verification from "@/pages/institution/verification";
import SubscriptionPage from "@/pages/institution/subscription";
import StudentPage from "@/pages/student/StudentPage";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import MarketplacePage from "@/pages/marketplace/index";
import MarketplaceLogin from "@/pages/marketplace/login";
import MarketplaceRegister from "@/pages/marketplace/register";
import MarketplaceVerify from "@/pages/marketplace/verify";
import DesignerPage from "@/pages/designer/index";
import DesignerEditor from "@/pages/designer/editor";
import TemplateDetailsPage from "@/pages/marketplace/[id]";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { MarketplacePage as CertMarketplacePage } from "@/pages/MarketplacePage";
import { DesignerPage as CertDesignerPage } from "@/pages/DesignerPage";
import { TemplateLibraryPage } from "@/pages/TemplateLibraryPage";
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
import UsagePage from "@/pages/usage";
import BulkIssuancePage from "@/pages/bulk-issuance";
import PdfCertificatesPage from "@/pages/pdf-certificates";
import CertificateIssuanceDashboard from "@/pages/certificate-issuance";
import CertificateManagement from "@/pages/certificate-management";
import TemplateDesigner from "@/pages/designer";
import SystemTest from "@/pages/system-test";
import TemplateManagement from "@/pages/template-management";
// import MarketplaceProtectedRoute from "@/components/MarketplaceProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/register/verify-otp" component={RegisterVerifyOtp} />
      <Route path="/student" component={StudentPage} />
      <Route path="/student-portal" component={StudentPortalPage} />
      <Route path="/verify" component= {verify} />
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
      
      {/* Certificate Marketplace Routes */}
      <Route path="/cert-marketplace" component={CertMarketplacePage} />
      <Route path="/cert-designer" component={CertDesignerPage} />
      
      {/* Legal Pages */}
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/about" component={AboutUsPage} />
      <Route path="/careers" component={CareersPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/press" component={PressKitPage} />
      <Route path="/documentation" component={DocumentationPage} />
      <Route path="/api-reference" component={ApiReferencePage} />
      
      {/* Public Pricing Page */}
      <Route path="/pricing" component={PricingPage} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />

      {/* Protected Institution Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <InstitutionDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/certificates">
        <ProtectedRoute>
          <Layout>
            <Certificates />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/verification">
        <ProtectedRoute>
          <Layout>
            <Verification />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/subscription">
        <ProtectedRoute>
          <Layout>
            <SubscriptionPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/usage">
        <ProtectedRoute>
          <Layout>
            <UsagePage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/bulk-issuance">
        <ProtectedRoute>
          <Layout>
            <BulkIssuancePage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/pdf-certificates">
        <ProtectedRoute>
          <Layout>
            <PdfCertificatesPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/template-management">
        <ProtectedRoute>
          <Layout>
            <TemplateManagement />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/certificate-issuance">
        <ProtectedRoute>
          <Layout>
            <CertificateIssuanceDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/certificate-management">
        <ProtectedRoute>
          <Layout>
            <CertificateManagement />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/template-designer">
        <ProtectedRoute>
          <Layout>
            <TemplateDesigner />
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
      
      <Route path="/templates">
        <ProtectedRoute>
          <Layout>
            <TemplatesPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/template-library">
        <ProtectedRoute>
          <Layout>
            <TemplateLibraryPage />
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
        <Toaster />
        <Router />
        <Analytics />
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
