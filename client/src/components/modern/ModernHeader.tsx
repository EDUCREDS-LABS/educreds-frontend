/**
 * ModernHeader — workspace-aware nav.
 *
 * Public (unauthenticated): product discovery nav
 * Institution: issue, verify, governance, subscription
 * Verifier: verify, analytics, bulk, upgrade
 * Government: overview, analytics, investigations, accreditation
 * Developer: API docs, API keys, usage
 */
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu, X, Moon, Sun, ChevronDown,
  ShieldCheck, BarChart3, Award, Users,
  Key, Activity, Landmark, Building2,
  AlertTriangle, Globe, CreditCard, Zap, LayoutDashboard,
} from "lucide-react";
import { useState } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useAuth } from "@/hooks/useAuth";
import { useActiveWorkspace } from "@/lib/useActiveWorkspace";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ModernHeaderProps {
  onStudentPortalClick?: () => void;
}

// ── Nav config per workspace ───────────────────────────────────────────────────

const NAV_BY_WORKSPACE = {
  public: [
    { label: "Verify a Credential", to: "/verify",         icon: ShieldCheck },
    { label: "Trust Registry",      to: "/trust-registry", icon: Globe },
    { label: "Developers",          to: "/developer/login", icon: Key },
  ],
  institution: [
    { label: "Dashboard",    to: "/institution/overview",     icon: LayoutDashboard },
    { label: "Issue",        to: "/institution/issue",         icon: Award },
    { label: "Verify",       to: "/verify",                    icon: ShieldCheck },
    { label: "Governance",   to: "/institution/governance-workspace", icon: Globe },
  ],
  verifier: [
    { label: "Verify",        to: "/verifier/verify",    icon: ShieldCheck },
    { label: "Queue",         to: "/verifier/queue",     icon: Activity },
    { label: "Analytics",     to: "/verifier/analytics", icon: BarChart3 },
    { label: "Bulk Screening",to: "/verifier/verify",    icon: Users },
  ],
  government: [
    { label: "Control Center",   to: "/government/dashboard",      icon: LayoutDashboard },
    { label: "Institutions",     to: "/government/institutions",   icon: Building2 },
    { label: "Analytics",        to: "/government/analytics",      icon: BarChart3 },
    { label: "Investigations",   to: "/government/investigations", icon: AlertTriangle },
    { label: "Accreditation",    to: "/government/accreditation",  icon: Landmark },
  ],
  developer: [
    { label: "API Portal",  to: "/developer-portal", icon: Key },
    { label: "Usage",       to: "/developer-portal", icon: Activity },
    { label: "Docs",        to: "https://docs.educreds.xyz", icon: Globe },
  ],
  student: [
    { label: "My Credentials", to: "/student/login", icon: Award },
    { label: "Verify",          to: "/verify",          icon: ShieldCheck },
  ],
};

// ── Right-side CTA per workspace ───────────────────────────────────────────────

function WorkspaceCTA({ workspace, plan }: { workspace: string; plan?: string }) {
  if (workspace === "verifier") {
    const isPaid = plan && plan !== "Free" && plan !== "Starter";
    if (!isPaid) return (
      <Link to="/verifier/billing/plan">
        <Button size="sm" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2 bg-primary">
          <Zap className="w-3.5 h-3.5" /> Upgrade Plan
        </Button>
      </Link>
    );
    return (
      <Badge className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/30 font-black text-[10px] uppercase tracking-widest px-3 py-1.5">
        {plan}
      </Badge>
    );
  }
  if (workspace === "institution") {
    return (
      <Link to="/institution/issue">
        <Button size="sm" className="rounded-xl font-black text-xs uppercase tracking-widest">
          <Award className="w-3.5 h-3.5 mr-1.5" /> Issue Credential
        </Button>
      </Link>
    );
  }
  if (workspace === "government") {
    return (
      <Link to="/government/investigations">
        <Button size="sm" variant="outline" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> Investigations
        </Button>
      </Link>
    );
  }
  if (workspace === "developer") {
    return (
      <Link to="/developer-portal">
        <Button size="sm" className="rounded-xl font-black text-xs uppercase tracking-widest gap-2">
          <Key className="w-3.5 h-3.5" /> API Keys
        </Button>
      </Link>
    );
  }
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ModernHeader({ onStudentPortalClick }: ModernHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user, logout } = useAuth();
  const { active } = useActiveWorkspace();
  const navigate = useNavigate();

  const workspace = isAuthenticated ? (active ?? "institution") : "public";
  const navItems = NAV_BY_WORKSPACE[workspace as keyof typeof NAV_BY_WORKSPACE] ?? NAV_BY_WORKSPACE.public;

  return (
    <header className="sticky top-0 z-50 bg-[--background]/95 backdrop-blur border-b border-[--border]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to={isAuthenticated ? `/${workspace === "public" ? "" : workspace + "/dashboard"}` : "/"}>
            <div className="flex items-center gap-3 group">
              <div className="relative h-9 w-9 rounded-xl bg-[--card] border border-[--border] shadow-sm flex items-center justify-center">
                <img src="/logo.svg" alt="EduCreds" className="h-5 w-5 object-contain" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[--background]" />
              </div>
              <div>
                <h1 className="text-base font-black text-[--foreground] tracking-tight leading-none">EduCreds</h1>
                {workspace !== "public" && (
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[--muted-foreground] leading-none mt-0.5">
                    {workspace === "institution" ? "Institution Console"
                      : workspace === "verifier" ? "Verifier Portal"
                      : workspace === "government" ? "Gov. Portal"
                      : workspace === "developer" ? "Dev Portal"
                      : workspace === "student" ? "Student Wallet"
                      : ""}
                  </p>
                )}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isExternal = item.to.startsWith("http");
              const props = isExternal
                ? { as: "a", href: item.to, target: "_blank", rel: "noopener noreferrer" }
                : {};
              return isExternal ? (
                <a key={item.label} href={item.to} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-9 rounded-xl font-semibold text-[--muted-foreground] hover:text-[--foreground] gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Button>
                </a>
              ) : (
                <Link key={item.label} to={item.to}>
                  <Button variant="ghost" size="sm" className="h-9 rounded-xl font-semibold text-[--muted-foreground] hover:text-[--foreground] gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}
              className="hidden sm:flex h-9 w-9 rounded-xl text-[--muted-foreground]">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Workspace CTA */}
            <div className="hidden md:flex">
              {isAuthenticated
                ? <WorkspaceCTA workspace={workspace} plan={user?.subscriptionPlan} />
                : (
                  <div className="flex items-center gap-2">
                    <Link to="/access">
                      <Button variant="ghost" size="sm" className="h-9 rounded-xl font-semibold text-[--muted-foreground] text-xs">Sign In</Button>
                    </Link>
                    <Link to="/register">
                      <Button size="sm" className="h-9 rounded-xl font-black text-xs uppercase tracking-widest">Register Institution</Button>
                    </Link>
                  </div>
                )
              }
            </div>

            {/* User menu (authenticated) */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 rounded-xl gap-2 hidden md:flex">
                    <div className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black">
                      {user?.name?.charAt(0) ?? "U"}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[--muted-foreground]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2">
                  <div className="px-3 py-2 mb-1">
                    <p className="font-black text-sm text-[--foreground] truncate">{user?.name ?? "User"}</p>
                    <p className="text-xs text-[--muted-foreground] truncate">{user?.email ?? ""}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {workspace === "institution" && (
                    <>
                      <DropdownMenuItem asChild><Link to="/institution/profile" className="rounded-xl font-semibold text-xs">Profile</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/institution/billing/upgrade" className="rounded-xl font-semibold text-xs">Billing</Link></DropdownMenuItem>
                    </>
                  )}
                  {workspace === "verifier" && (
                    <>
                      <DropdownMenuItem asChild><Link to="/verifier/settings" className="rounded-xl font-semibold text-xs">Settings</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/verifier/billing/plan" className="rounded-xl font-semibold text-xs">Plan & Billing</Link></DropdownMenuItem>
                    </>
                  )}
                  {workspace === "government" && (
                    <DropdownMenuItem asChild><Link to="/government/dashboard" className="rounded-xl font-semibold text-xs">Overview</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="rounded-xl text-red-600 focus:bg-red-50 dark:focus:bg-red-950 font-bold text-xs cursor-pointer">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile menu toggle */}
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-xl"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[--border] py-3 space-y-1 pb-4 animate-in slide-in-from-top-2 duration-200">
            {navItems.map(item => {
              const Icon = item.icon;
              return item.to.startsWith("http") ? (
                <a key={item.label} href={item.to} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" className="w-full justify-start rounded-xl font-semibold text-sm gap-3 text-[--muted-foreground]"
                    onClick={() => setIsMobileMenuOpen(false)}>
                    <Icon className="w-4 h-4" /> {item.label}
                  </Button>
                </a>
              ) : (
                <Link key={item.label} to={item.to}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl font-semibold text-sm gap-3 text-[--muted-foreground]"
                    onClick={() => setIsMobileMenuOpen(false)}>
                    <Icon className="w-4 h-4" /> {item.label}
                  </Button>
                </Link>
              );
            })}
            <div className="pt-3 border-t border-[--border] space-y-2">
              {isAuthenticated ? (
                <Button variant="destructive" className="w-full rounded-xl font-black text-xs uppercase tracking-widest" onClick={logout}>
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link to="/access" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl font-black text-xs uppercase tracking-widest">Sign In</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full rounded-xl font-black text-xs uppercase tracking-widest">Register Institution</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
