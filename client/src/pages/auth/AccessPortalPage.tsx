import { useNavigate } from "react-router-dom";
import { Building2, GraduationCap, Code2, ShieldCheck, Landmark, ArrowRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const portals = [
  {
    id: "institution",
    icon: Building2,
    title: "Academic Institution",
    subtitle: "Issue & manage credentials",
    description: "For universities, colleges, and accredited training providers issuing verifiable certificates to graduates.",
    login: "/login",
    register: "/register",
    accentLight: "bg-blue-50 border-blue-100",
    accentDark: "dark:bg-blue-950/20 dark:border-blue-800/30",
    iconBg: "bg-primary/10 dark:bg-primary/20",
    iconColor: "text-primary",
    subtitleColor: "text-primary",
    badge: null,
    restricted: false,
  },
  {
    id: "student",
    icon: GraduationCap,
    title: "Graduate / Student",
    subtitle: "Access your credentials",
    description: "View, share, and manage the verifiable digital certificates issued to you by your institution.",
    login: "/student/login",
    register: null,
    accentLight: "bg-emerald-50 border-emerald-100",
    accentDark: "dark:bg-emerald-950/20 dark:border-emerald-800/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    subtitleColor: "text-emerald-600 dark:text-emerald-400",
    badge: null,
    restricted: false,
  },
  {
    id: "developer",
    icon: Code2,
    title: "Developer",
    subtitle: "Build with EduCreds API",
    description: "API keys, webhooks, SDKs, and full integration tooling to embed verifiable credentials into your product.",
    login: "/developer/login",
    register: "/developer/register",
    accentLight: "bg-violet-50 border-violet-100",
    accentDark: "dark:bg-violet-950/20 dark:border-violet-800/30",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    subtitleColor: "text-violet-600 dark:text-violet-400",
    badge: null,
    restricted: false,
  },
  {
    id: "verifier",
    icon: ShieldCheck,
    title: "Employer / Verifier",
    subtitle: "Verify credentials",
    description: "For employers, recruiters, and organizations that need to verify the authenticity of academic credentials.",
    login: "/verifier/login",
    register: "/verifier/register",
    accentLight: "bg-amber-50 border-amber-100",
    accentDark: "dark:bg-amber-950/20 dark:border-amber-800/30",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    subtitleColor: "text-amber-600 dark:text-amber-400",
    badge: null,
    restricted: false,
  },
  {
    id: "government",
    icon: Landmark,
    title: "Government / Regulator",
    subtitle: "National oversight portal",
    description: "Oversight, institutional accreditation tracking, and credential integrity monitoring across the national network.",
    login: "/government/login",
    register: null,
    accentLight: "bg-red-50 border-red-100",
    accentDark: "dark:bg-red-950/20 dark:border-red-800/30",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600 dark:text-red-400",
    subtitleColor: "text-red-600 dark:text-red-400",
    badge: "Invite Only",
    restricted: true,
  },
];

export default function AccessPortalPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[--background] flex flex-col">
      {/* Header */}
      <header className="border-b border-[--border] bg-[--background] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl overflow-hidden bg-[--muted] border border-[--border] flex items-center justify-center">
              <img src="/logo.svg" alt="EduCreds" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-[--foreground]">EduCreds</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[--muted-foreground] ml-2">Access Portal</span>
            </div>
          </div>
          <a
            href="https://educreds.xyz"
            className="text-xs font-semibold text-[--muted-foreground] hover:text-[--foreground] transition-colors"
          >
            Learn more →
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-5xl w-full">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-[10px] font-black uppercase tracking-widest px-3 py-1">
              Secure Access
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-[--foreground] mb-3">
              Who are you signing in as?
            </h1>
            <p className="text-[--muted-foreground] text-sm max-w-md mx-auto leading-relaxed">
              EduCreds serves multiple stakeholders. Select your role to access your dedicated portal.
            </p>
          </div>

          {/* Portal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.id}
                  onClick={() => navigate(portal.login)}
                  className={`
                    relative group cursor-pointer rounded-[24px] border bg-[--card] p-6
                    transition-all duration-200 hover:-translate-y-0.5
                    hover:shadow-[var(--shadow-xl-neutral)]
                    ${portal.accentLight} ${portal.accentDark}
                  `}
                >
                  {portal.badge && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                      {portal.badge}
                    </div>
                  )}

                  <div className={`w-11 h-11 rounded-[14px] ${portal.iconBg} flex items-center justify-center mb-4 ${portal.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="font-black text-sm text-[--foreground] mb-0.5 tracking-tight">{portal.title}</h3>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${portal.subtitleColor}`}>
                    {portal.subtitle}
                  </p>
                  <p className="text-[--muted-foreground] text-xs leading-relaxed mb-5">
                    {portal.description}
                  </p>

                  <div className="flex items-center gap-3 pt-3 border-t border-[--border]">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(portal.login); }}
                      className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[--foreground] bg-[--foreground]/5 hover:bg-[--foreground]/10 transition-colors rounded-xl px-3 py-1.5"
                    >
                      Sign In <ArrowRight className="w-3 h-3" />
                    </button>
                    {portal.register && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(portal.register!); }}
                        className="text-[11px] font-semibold text-[--muted-foreground] hover:text-[--foreground] transition-colors"
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-[--muted-foreground] mt-10">
            Need help?{" "}
            <a href="mailto:support@educreds.xyz" className="text-primary hover:underline font-semibold">
              Contact support
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[--border] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[--muted-foreground]">
          <span>© {new Date().getFullYear()} EduCreds Labs Co. Ltd.</span>
          <div className="flex items-center gap-6">
            <a href="https://educreds.xyz/terms" className="hover:text-[--foreground] transition-colors">Terms</a>
            <a href="https://educreds.xyz/privacy" className="hover:text-[--foreground] transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
