import React from 'react';
import {
    LayoutDashboard,
    ShieldCheck,
    Link2,
    Users,
    History,
    ChevronRight,
    LogOut,
    Building2,
    TrendingUp,
    Settings
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    onLogout: () => void;
}

export function AdminSidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
    const menuItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'governance', label: 'Governance', icon: ShieldCheck },
        { id: 'blockchain', label: 'Blockchain', icon: Link2 },
        { id: 'users', label: 'Team', icon: Users },
        { id: 'audit', label: 'Audit Logs', icon: History },
    ];

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Admin<span className="text-blue-500">Portal</span></span>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
                                activeTab === item.id
                                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                activeTab === item.id ? "text-blue-400" : "text-gray-500 group-hover:text-white"
                            )} />
                            {item.label}
                            {activeTab === item.id && (
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 space-y-4">
                <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                            SA
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white">Super Admin</p>
                            <p className="text-[10px] text-gray-500">admin@educreds.xyz</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 text-sm font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

function Lock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}
