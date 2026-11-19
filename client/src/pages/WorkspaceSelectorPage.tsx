import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Building2,
  CheckCircle2,
  Code2,
  Shield,
  LogOut,
  User,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DualAuth } from "@/lib/dualAuth";

interface WorkspaceOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  tagline: string;
}

const workspaces: WorkspaceOption[] = [
  {
    id: "institution",
    title: "Academic Institution",
    description: "Issue, manage, and verify credentials for your students.",
    icon: <Building2 className="w-6 h-6" />,
    href: "/login",
    color: "from-blue-500 to-blue-600",
    tagline: "Educators",
  },
  {
    id: "student",
    title: "Student",
    description: "Access your credentials and share them securely.",
    icon: <GraduationCap className="w-6 h-6" />,
    href: "/student/login",
    color: "from-emerald-500 to-emerald-600",
    tagline: "Learners",
  },
  {
    id: "verifier",
    title: "Employer / Verifier",
    description: "Verify credentials and manage verification requests.",
    icon: <CheckCircle2 className="w-6 h-6" />,
    href: "/verifier/login",
    color: "from-purple-500 to-purple-600",
    tagline: "HR & Hiring",
  },
  {
    id: "developer",
    title: "Developer",
    description: "Build with EduCreds APIs, webhooks, and SDKs.",
    icon: <Code2 className="w-6 h-6" />,
    href: "/developer/login",
    color: "from-orange-500 to-orange-600",
    tagline: "API Access",
  },
  {
    id: "government",
    title: "Government",
    description: "Monitor institutional trust and accreditation across your jurisdiction.",
    icon: <Shield className="w-6 h-6" />,
    href: "/government/login",
    color: "from-slate-600 to-slate-700",
    tagline: "Governance",
  },
];

export default function WorkspaceSelectorPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  async function handleLogout() {
    await DualAuth.logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <h1 className="text-xl font-black text-neutral-900 dark:text-white">EduCreds</h1>
          </div>
          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white mb-4">
            Choose Your Workspace
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            {isAuthenticated
              ? `Welcome, ${user?.name || "back"}! Select a workspace or sign out to switch accounts.`
              : "Sign in to access your EduCreds workspace. Each role has its own portal."}
          </p>
        </div>

        {/* Workspace Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {workspaces.map((workspace) => (
            <Link key={workspace.id} to={workspace.href}>
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group border border-neutral-200 dark:border-neutral-800">
                <CardHeader className={`bg-gradient-to-br ${workspace.color} text-white pb-8 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 opacity-10">
                    {workspace.icon}
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all">
                      {workspace.icon}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded text-white">
                      {workspace.tagline}
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{workspace.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex flex-col h-full">
                  <CardDescription className="text-base mb-6 flex-grow">
                    {workspace.description}
                  </CardDescription>
                  <Button className="w-full group-hover:gap-2 transition-all">
                    Get Started
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="border border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg">First Time?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-600 dark:text-neutral-400">
              Select your role above and create an account. Most verifications take less than a minute.
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-600 dark:text-neutral-400">
              Check out our <a href="https://docs.educreds.xyz" className="text-blue-600 hover:text-blue-700 font-semibold">documentation</a> or contact <a href="mailto:support@educreds.xyz" className="text-blue-600 hover:text-blue-700 font-semibold">support</a>.
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg">Secure & Trusted</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-600 dark:text-neutral-400">
              All data is encrypted. We comply with SOC 2 and international data protection standards.
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>&copy; 2026 EduCreds Labs. All rights reserved.</p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <a href="https://educreds.xyz/terms" className="hover:text-neutral-900 dark:hover:text-white transition">Terms</a>
            <a href="https://educreds.xyz/privacy" className="hover:text-neutral-900 dark:hover:text-white transition">Privacy</a>
            <a href="https://docs.educreds.xyz" className="hover:text-neutral-900 dark:hover:text-white transition">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
