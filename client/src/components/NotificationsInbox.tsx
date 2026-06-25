import { Bell, CheckCircle2, ShieldAlert, Radio, ArrowRight, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";

const iconByType = {
  CERTIFICATE_ISSUED: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  CERTIFICATE_REVOKED: { icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  PROPOSAL_CREATED: { icon: Radio, color: "text-primary", bg: "bg-primary/10" },
  PROPOSAL_EXECUTED: { icon: Radio, color: "text-primary", bg: "bg-primary/10" },
  SUBSCRIPTION_CHANGED: { icon: Radio, color: "text-primary", bg: "bg-primary/10" },
  SYSTEM_MAINTENANCE: { icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  INSTITUTION_REGISTERED: { icon: Radio, color: "text-primary", bg: "bg-primary/10" },
  PROPOSAL_SUBMITTED: { icon: Radio, color: "text-primary", bg: "bg-primary/10" },
} as const;

const formatRelativeTime = (value?: string) => {
  if (!value) return "now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export function NotificationsInbox() {
  const { data: notificationsData, isLoading } = useNotifications({ page: 1, limit: 20 });
  const { data: unreadData } = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  const notifications = notificationsData?.notifications || [];
  const unreadCount = Number(unreadData?.count || 0);

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const emptyState = !isLoading && notifications.length === 0;

  const mappedNotifications = useMemo(
    () =>
      notifications.map((n: any) => {
        const map = iconByType[n.type as keyof typeof iconByType] || iconByType.SYSTEM_MAINTENANCE;
        return {
          ...n,
          icon: map.icon,
          color: map.color,
          bg: map.bg,
          time: formatRelativeTime(n.createdAt),
          description: n.message || n.title,
        };
      }),
    [notifications],
  );

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
          {isLoading && (
            <div className="h-[400px] flex items-center justify-center text-neutral-400">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {emptyState && (
            <div className="h-[400px] flex flex-col items-center justify-center gap-3 text-neutral-500">
              <Bell className="size-7 opacity-40" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">No notifications</p>
            </div>
          )}

          {!isLoading && !emptyState && (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {mappedNotifications.map((n: any) => (
              <div
                key={n.id}
                className={cn(
                  "p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all cursor-pointer group relative overflow-hidden",
                  !n.isRead && "bg-primary/[0.03]",
                )}
                onClick={() => {
                  if (!n.isRead) {
                    markReadMutation.mutate(String(n.id));
                  }
                }}
              >
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
          )}
        </ScrollArea>

        {/* Inbox Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950/50 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
          <Button 
            variant="ghost" 
            disabled={markAllReadMutation.isPending || unreadCount === 0}
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
