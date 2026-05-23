import { Bell, Check, Clock, Info, Shield, Zap, CheckCircle2, ShieldAlert, Radio, ArrowRight, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mockNotifications = [
  {
    id: 1,
    title: "Consensus Finalized",
    description: "24 certificates successfully synchronized with Base L2 mainnet cluster.",
    time: "2 mins ago",
    type: "success",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    id: 2,
    title: "Protocol Proposal Active",
    description: "DAO Governance #142: Ingestion standards update is open for institutional voting.",
    time: "1 hour ago",
    type: "info",
    icon: Radio,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: 3,
    title: "Audit Alert",
    description: "EduCreds Trust Agent (ETA) flagged 2 high-risk issuance attempts in shard #09.",
    time: "3 hours ago",
    type: "warning",
    icon: ShieldAlert,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
];

export function NotificationsInbox() {
  const [unreadCount, setUnreadCount] = useState(3);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-neutral-400 hover:text-primary transition-all relative group" aria-label="Open notifications">
          <Bell className="size-5 transition-transform group-hover:rotate-12" />
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 size-2.5 bg-primary rounded-full border-2 border-white dark:border-neutral-950 shadow-[0_0_8px_rgba(21,96,189,0.8)] animate-pulse" aria-hidden="true" />
          )}
          <span className="sr-only">Notifications ({unreadCount} unread)</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-[32px] border-none shadow-2xl bg-white dark:bg-neutral-900 overflow-hidden" align="end" sideOffset={12}>
        {/* Inbox Header */}
        <div className="p-6 bg-neutral-900 dark:bg-black text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="size-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Database className="size-4 text-primary" />
             </div>
             <div>
                <h4 className="font-black text-xs uppercase tracking-[0.2em]">Management Inbox</h4>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">Global Telemetry Logs</p>
             </div>
          </div>
          {unreadCount > 0 && (
             <Badge className="bg-primary text-white border-none font-black text-[9px] uppercase px-2 py-0.5 rounded-full">
                {unreadCount} New
             </Badge>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {mockNotifications.map((n) => (
              <div key={n.id} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-4 relative z-10">
                  <div className={cn("size-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm", n.bg)}>
                    <n.icon className={cn("size-6", n.color)} />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 leading-none group-hover:text-primary transition-colors">{n.title}</p>
                       <p className="text-[9px] text-neutral-400 font-black uppercase tracking-widest">{n.time}</p>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium line-clamp-2">{n.description}</p>
                    <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                       <span>Audit Details</span>
                       <ArrowRight className="size-2.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Inbox Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950/50 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
          <Button 
            variant="ghost" 
            onClick={handleMarkAllRead}
            className="flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Mark Synchronized
          </Button>
          <Button 
            className="flex-1 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-900 text-white dark:text-white text-[10px] font-black uppercase tracking-widest shadow-lg"
          >
            Terminal View
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
