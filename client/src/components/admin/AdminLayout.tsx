import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Shield, 
  Users, 
  Cpu, 
  FileText, 
  Lock, 
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Bell,
  History,
  Terminal,
  Activity,
  Clock,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminAuth } from '@/lib/admin-auth';

const sidebarItems = [
  { title: "Network Overview", path: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Security Telemetry", path: "/admin/security", icon: ShieldCheck },
  { title: "User Management", path: "/admin/users", icon: Users },
  { title: "Infrastructure", path: "/admin/infrastructure", icon: Cpu },
  { title: "Recovery Ops", path: "/admin/recovery", icon: Zap },
  { title: "Pending Mints", path: "/admin/pending-mints", icon: Clock },
  { title: "DAO Governance", path: "/admin/governance", icon: Shield },
  { title: "Compliance Center", path: "/admin/compliance", icon: Lock },
  { title: "Observability", path: "/admin/observability", icon: Activity },
  { title: "Infrastructure Logs", path: "/admin/audit", icon: Terminal },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const session = AdminAuth.getSession();

  const handleLogout = () => {
    AdminAuth.logout();
    setLocation('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-950 font-sans selection:bg-primary/30">
      {/* Strategic Sidebar */}
      <aside className="w-80 bg-gray-900 border-r border-white/5 flex flex-col h-screen sticky top-0 z-30 shadow-2xl">
        <div className="p-10 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-12">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <Lock className="size-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tighter">EduCreds</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Platform Admin</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-6 px-4">Management Infrastructure</p>
            {sidebarItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer group",
                  location === item.path 
                    ? "bg-white/5 text-primary border border-white/5 shadow-inner" 
                    : "text-neutral-500 hover:text-white hover:bg-white/[0.03]"
                )}>
                  <item.icon className={cn(
                    "size-5 transition-transform duration-300 group-hover:scale-110",
                    location === item.path ? "text-primary" : "text-neutral-600 group-hover:text-neutral-400"
                  )} />
                  <span className="tracking-tight">{item.title}</span>
                  {location === item.path && (
                    <div className="size-1.5 rounded-full bg-primary ml-auto shadow-[0_0_8px_rgba(21,96,189,0.8)]" />
                  )}
                </div>
              </Link>
            ))}
          </nav>

          <div className="pt-10 border-t border-white/5 space-y-6">
            <div className="bg-gray-950 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Cpu className="size-16 rotate-12" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="size-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg">
                  {session?.email?.charAt(0).toUpperCase() || 'SA'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white truncate tracking-tight">Root Authority</p>
                  <p className="text-[10px] text-neutral-600 font-bold truncate tracking-tighter uppercase">{session?.email}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-neutral-500 hover:text-red-500 hover:bg-red-500/5 transition-all duration-300 text-xs font-black uppercase tracking-widest"
            >
              <LogOut className="size-5" />
              Terminate Access
            </button>
          </div>
        </div>
      </aside>

      {/* Main Command Center */}
      <main className="flex-1 relative">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(21,96,189,0.08),transparent_50%)] pointer-events-none" />
         <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
         <div className="relative z-10 p-12 lg:p-16">
            {children}
         </div>
      </main>
    </div>
  );
};
