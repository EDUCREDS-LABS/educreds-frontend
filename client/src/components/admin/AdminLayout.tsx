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
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { title: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { title: "User Management", path: "/admin/users", icon: Users },
  { title: "Infrastructure", path: "/admin/infrastructure", icon: Cpu },
  { title: "Recovery", path: "/admin/recovery", icon: Zap },
  { title: "Compliance", path: "/admin/compliance", icon: ShieldCheck },
  { title: "Security Logs", path: "/admin/security", icon: Lock },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6">
        <div className="mb-8 font-black text-xl tracking-tighter">ADMIN PORTAL</div>
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer",
                location === item.path 
                  ? "bg-primary text-primary-foreground" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}>
                <item.icon className="size-5" />
                {item.title}
              </div>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
};
