import React from 'react';
import {
    LayoutDashboard,
    ShieldCheck,
    Link2,
    Users,
    History,
    ChevronRight,
    LogOut,
    Lock,
    Cpu,
    Database,
    ShieldAlert,
    Terminal,
    Bell,
    Activity,
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    onLogout: () => void;
}

export function AdminSidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
    const menuItems = [
        { id: 'overview', label: 'Network Control', icon: LayoutDashboard },
        { id: 'notifications', label: 'Admin Notifications', icon: Bell },
        { id: 'governance', label: 'DAO Governance', icon: ShieldCheck },
        { id: 'blockchain', label: 'On-Chain Ledger', icon: Link2 },
        { id: 'users', label: 'Administrative Team', icon: Users },
        { id: 'audit', label: 'Infrastructure Logs', icon: Terminal },
        { id: 'integrity', label: 'System Integrity', icon: Activity },
    ];

    return (
        <div className="w-80 bg-gray-950 border-r border-gray-800 flex flex-col h-full shadow-2xl relative z-30">
            <div className="p-8">
                <div className="flex items-center gap-4 mb-12">
                    <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                        <Lock className="size-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-white tracking-tighter">EduCreds</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Platform Admin</span>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 px-4">Management Layer</p>
                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-sm font-bold",
                                        activeTab === item.id
                                            ? "bg-white/5 text-primary border border-white/5 shadow-inner shadow-black/20"
                                            : "text-gray-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "size-5 transition-transform duration-300 group-hover:scale-110",
                                        activeTab === item.id ? "text-primary" : "text-gray-600 group-hover:text-gray-400"
                                    )} />
                                    <span className="tracking-tight">{item.label}</span>
                                    {activeTab === item.id && (
                                        <div className="size-1.5 rounded-full bg-primary ml-auto shadow-[0_0_8px_rgba(21,96,189,0.8)]" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 px-4">System Integrity</p>
                        <div className="px-4 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Database className="size-4 text-gray-600" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DB Sync</span>
                                </div>
                                <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto p-8 border-t border-white/5">
                <div className="bg-gray-900 rounded-3xl p-5 mb-6 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Cpu className="size-16 rotate-12" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="size-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg">
                            SA
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-white truncate tracking-tight">Root Authority</p>
                            <p className="text-[10px] text-gray-500 font-bold truncate tracking-tighter uppercase">admin@educreds.xyz</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-500 hover:text-red-500 hover:bg-red-500/5 transition-all duration-300 text-xs font-black uppercase tracking-widest"
                >
                    <LogOut className="size-5" />
                    Terminate Access
                </button>
            </div>
        </div>
    );
}
