import { useState, useMemo, useRef } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Award, Bell, Search, User, LogOut, Wallet, ShieldCheck, Settings, CheckCircle, Compass, KeyRound, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsInbox } from "./NotificationsInbox";
import { QuickCreateButton } from "./QuickCreateButton";
import { MobileQuickActions } from "./MobileQuickActions";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { getCapabilitiesForWorkspace, type NavCapability } from "@/lib/capabilityMatrix";
import { useActiveWorkspace } from "@/lib/useActiveWorkspace";

type SearchItem = { path: string; label: string; keywords: string[] };


export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const { active } = useActiveWorkspace();
  const searchIndex = useMemo<SearchItem[]>(() => {
    const ws = active ?? "institution";
    const caps = getCapabilitiesForWorkspace(ws, ws === "institution" ? (user?.deploymentTier ?? "workspace") : null);
    const flat = (items: NavCapability[]): NavCapability[] => items.flatMap((i) => (i.children?.length ? flat(i.children) : [i]));
    const seen = new Set<string>();
    return flat([...caps.primary, ...caps.secondary])
      .filter((i) => i.path !== "#" && !seen.has(i.path) && seen.add(i.path))
      .map((i) => ({ path: i.path, label: i.label, keywords: [i.label.toLowerCase(), i.id.replace(/-/g, " ")] }));
  }, [active, user?.deploymentTier]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      navigate(searchResults[0].path);
      setSearchQuery("");
      setShowResults(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const matches = searchIndex.filter((route) =>
      route.keywords.some((kw) => kw.includes(q)) || route.label.toLowerCase().includes(q)
    );
    setSearchResults(matches);
    setShowResults(matches.length > 0);
  };

  // Only institutions have stats/notifications endpoints — gate non-institution personas
  const isInstitutionPersona = user?.type === AuthType.INSTITUTION || !user?.type;

  const { data: statsData } = useQuery({
    queryKey: ["/api/stats", user?.id],
    queryFn: () => api.getStats(user?.id),
    enabled: !!user && isInstitutionPersona,
  });

  const isInstitutionVerified = useMemo(() => {
    if (!user) return false;
    const stats = statsData || {};
    const hasIIN = Boolean(stats.iinTokenId || stats.iinId);
    const hasHighPoIC = Number(stats.poicScore || 0) >= 60;
    const isExplicitlyVerified = Boolean(user.isVerified);
    return isExplicitlyVerified || hasIIN || hasHighPoIC;
  }, [user, statsData]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-neutral-50/50 dark:bg-neutral-950 transition-colors duration-300">
        {/* Desktop sidebar */}
        <div className="hidden md:block fixed inset-y-0 left-0 z-40">
          <AppSidebar deploymentTier={user?.deploymentTier ?? "workspace"} />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 h-full" data-testid="mobile-nav-drawer">
              <AppSidebar deploymentTier={user?.deploymentTier ?? "workspace"} onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        <main className="md:ml-64 transition-all duration-300 ease-in-out flex flex-col bg-transparent relative z-10">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 md:h-20 shrink-0 items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-4 md:px-8 shadow-sm">
            <div className="flex items-center gap-4 md:gap-6">
              {/* Mobile hamburger */}
              <button
                className="md:hidden -ml-1 p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-nav-toggle"
                aria-label="Toggle navigation menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>
               <div className="flex items-center gap-3">
                 <WorkspaceSwitcher />
               </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="relative hidden lg:block" ref={searchRef}>
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="search"
                    placeholder="Jump to a page…"
                    data-testid="header-page-search"
                    aria-label="Search across the application"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 150)}
                    className="h-11 w-80 rounded-xl border-none bg-neutral-100/80 dark:bg-neutral-800/80 pl-11 text-sm font-medium focus:bg-white dark:focus:bg-neutral-800 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner dark:text-neutral-200"
                  />
                </form>
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50">
                    {searchResults.map((result) => (
                        <button
                          key={result.path}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                          onMouseDown={() => {
                            navigate(result.path);
                            setSearchQuery("");
                            setShowResults(false);
                          }}
                        >
                          <Search className="size-3.5 text-neutral-400" />
                          {result.label}
                        </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <QuickCreateButton />
                {isInstitutionPersona && <NotificationsInbox />}
                <ThemeToggle />
              </div>

              <div className="h-6 w-[1px] bg-neutral-200 dark:border-neutral-800 mx-2" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-3 px-1 hover:bg-transparent focus-visible:ring-0 group" aria-label="User account menu">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight group-hover:text-primary transition-colors">{user?.name}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-black uppercase tracking-widest">
                        {user?.type === AuthType.STUDENT
                          ? "Student"
                          : user?.type === AuthType.VERIFIER
                          ? "Verifier"
                          : user?.type === AuthType.DEVELOPER
                          ? "Developer"
                          : isInstitutionVerified
                          ? "Approved institution"
                          : "Pending review"}
                      </p>
                    </div>
                    <div className="relative">
                      <Avatar className="h-11 w-11 border-2 border-white dark:border-neutral-800 shadow-xl shadow-neutral-200/50 dark:shadow-black/20 group-hover:border-primary/20 transition-all">
                        <AvatarFallback className="bg-primary/5 text-primary text-sm font-black uppercase">
                          {user?.name?.charAt(0) || "I"}
                        </AvatarFallback>
                      </Avatar>
                      {isInstitutionVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm">
                          <CheckCircle className="size-3" />
                        </div>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-3 rounded-2xl p-2 border-neutral-100 dark:border-neutral-800 shadow-2xl dark:bg-neutral-900" align="end" forceMount>
                  <DropdownMenuLabel className="p-4 pt-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none dark:text-neutral-100">{user?.name}</p>
                      <p className="text-xs leading-none text-neutral-500 dark:text-neutral-400 mt-1">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                  {/* Context-aware profile menu based on user type */}
                  {user?.type === AuthType.INSTITUTION ? (
                    <>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                        <Link to="/institution/profile" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                          <User className="mr-3 size-4" />
                          <span>Institution profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                        <Link to="/institution/settings" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                          <Settings className="mr-3 size-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                        <Link to="/institution/did-management" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                          <KeyRound className="mr-3 size-4" />
                          <span>Identity & keys</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                        <Link to="/institution/staff" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                          <Users className="mr-3 size-4" />
                          <span>Team & access</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : user?.type === AuthType.VERIFIER ? (
                    <>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                        <Link to="/verifier/settings" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                          <Settings className="mr-3 size-4" />
                          <span>Verifier Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                        <Link to="/verifier/billing/plan" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                          <Wallet className="mr-3 size-4" />
                          <span>Billing & Plan</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                  <DropdownMenuItem onClick={logout} data-testid="header-sign-out" className="rounded-xl h-11 px-4 text-red-600 focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-600 transition-colors cursor-pointer font-bold text-xs uppercase tracking-wider">
                    <LogOut className="mr-3 size-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-6 pb-24 sm:px-6 md:p-10 bg-neutral-50/50 dark:bg-neutral-950 transition-colors duration-300">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="shrink-0 border-t border-neutral-200/60 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-4 md:px-8 py-3 flex items-center justify-between gap-4">
            <p className="text-[11px] text-neutral-400 font-medium hidden sm:block">
               © {new Date().getFullYear()} EduCreds — trusted credentials for every learner
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('startOnboarding'))}
              className="ml-auto text-primary hover:bg-primary/5 font-bold"
            >
              <Compass className="size-4 mr-2" />
              Take a product tour
            </Button>
          </footer>
          <MobileQuickActions />
        </main>
      </div>
    </SidebarProvider>
  );
}
