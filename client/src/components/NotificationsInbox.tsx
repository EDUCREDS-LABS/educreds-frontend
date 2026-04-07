import { Bell, Check, Clock, Info, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const notifications = [
  {
    id: 1,
    title: "On-chain Issuance Success",
    description: "24 certificates successfully minted on Base Mainnet.",
    time: "2 mins ago",
    type: "success",
    icon: Shield,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    id: 2,
    title: "Governance Proposal Active",
    description: "New proposal regarding accreditation standards is open for voting.",
    time: "1 hour ago",
    type: "info",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: 3,
    title: "Verification Pending",
    description: "AI analysis for University of Lagos is 85% complete.",
    time: "3 hours ago",
    type: "warning",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
];

export function NotificationsInbox() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-neutral-100 relative">
          <Bell className="h-5 w-5 text-neutral-500" />
          <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full border-2 border-white shadow-sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-2xl border-neutral-100 shadow-2xl" align="end">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h4 className="font-bold text-sm tracking-tight">Management Inbox</h4>
          <Badge variant="secondary" className="text-[10px] font-black uppercase">3 New</Badge>
        </div>
        <ScrollArea className="h-80">
          <div className="divide-y divide-neutral-50">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer group">
                <div className="flex gap-3">
                  <div className={`size-10 rounded-xl ${n.bg} flex items-center justify-center flex-shrink-0`}>
                    <n.icon className={`size-5 ${n.color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-neutral-900 leading-none group-hover:text-primary transition-colors">{n.title}</p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-medium line-clamp-2">{n.description}</p>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-neutral-100">
          <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-primary">
            View All Infrastructure Logs
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
