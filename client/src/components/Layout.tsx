import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Award, Bell, Search, User, LogOut, Wallet, ShieldCheck, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsInbox } from "./NotificationsInbox";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-neutral-50/50 dark:bg-neutral-950 transition-colors duration-300">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl px-6 md:px-8 shadow-sm">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="-ml-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" />
              <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 hidden md:block" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-black text-neutral-400 uppercase tracking-[0.2em] hidden md:flex">
                  <ShieldCheck className="size-4 text-primary" />
                  Management Infrastructure
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="relative hidden lg:block group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="search"
                  placeholder="Universal search..."
                  className="h-11 w-80 rounded-xl border-none bg-neutral-100/80 dark:bg-neutral-800/80 pl-11 text-sm font-medium focus:bg-white dark:focus:bg-neutral-800 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner dark:text-neutral-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <NotificationsInbox />
                <ThemeToggle />
              </div>

              <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800 mx-2" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-3 px-1 hover:bg-transparent focus-visible:ring-0 group">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight group-hover:text-primary transition-colors">{user?.name}</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-black uppercase tracking-widest">
                        {user?.isVerified ? "Verified Partner" : "Pending Review"}
                      </p>
                    </div>
                    <div className="relative">
                      <Avatar className="h-11 w-11 border-2 border-white dark:border-neutral-800 shadow-xl shadow-neutral-200/50 dark:shadow-black/20 group-hover:border-primary/20 transition-all">
                        <AvatarFallback className="bg-primary/5 text-primary text-sm font-black uppercase">
                          {user?.name?.charAt(0) || "I"}
                        </AvatarFallback>
                      </Avatar>
                      {user?.isVerified && (
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
                  <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                    <Link href="/institution/profile" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                      <User className="mr-3 size-4" />
                      <span>Institutional Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                    <Link href="/institution/settings" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                      <Settings className="mr-3 size-4" />
                      <span>System Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl h-11 px-4 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                    <Link href="/student-portal" className="flex items-center font-bold text-xs uppercase tracking-wider dark:text-neutral-300">
                      <Wallet className="mr-3 size-4" />
                      <span>Student Interface</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
                  <DropdownMenuItem onClick={logout} className="rounded-xl h-11 px-4 text-red-600 focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-600 transition-colors cursor-pointer font-bold text-xs uppercase tracking-wider">
                    <LogOut className="mr-3 size-4" />
                    <span>Terminate Session</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 md:p-12 lg:p-16 bg-neutral-50/50 dark:bg-neutral-950 transition-colors duration-300">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
