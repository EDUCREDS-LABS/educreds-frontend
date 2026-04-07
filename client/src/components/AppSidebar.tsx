import * as React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  Zap,
  Palette,
  Shield,
  CreditCard,
  User,
  LogOut,
  Award,
  Wallet,
  Settings,
  MoreHorizontal,
  ShieldCheck,
  Globe,
  Database,
  Cpu,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const data = {
  navMain: [
    { title: "Network Overview", url: "/institution/dashboard", icon: LayoutDashboard },
    {
      title: "Credentialing",
      url: "#",
      icon: Award,
      items: [
        { title: "Mint Credentials", url: "/institution/issue", icon: Zap },
        { title: "Registry Archive", url: "/institution/certificates", icon: FileText },
        { title: "Asset Templates", url: "/institution/manage-specs", icon: Palette },
      ],
    },
    { title: "Trust Pipeline", url: "/institution/verification", icon: Shield },
    { title: "DAO Governance", url: "/institution/governance-workspace", icon: Cpu },
  ],
  navSecondary: [
    { title: "Entity Profile", url: "/institution/profile", icon: User },
    { title: "Infrastructure Plan", url: "/institution/subscription", icon: CreditCard },
    { title: "System Settings", url: "/institution/settings", icon: Settings },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (url: string) => location === url;

  return (
    <Sidebar collapsible="icon" className="border-r border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-xl" {...props}>
      <SidebarHeader className="p-6">
        <Link href="/institution/dashboard">
          <div className="flex items-center gap-4 cursor-pointer group">
            <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="size-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
              <span className="font-black text-neutral-900 dark:text-neutral-100 tracking-tighter text-lg">EduCreds</span>
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">Institutional Node</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 gap-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-4 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">
            Core Infrastructure
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.items ? (
                  <>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={item.items.some((sub) => isActive(sub.url))}
                      className="h-11 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                    >
                      <item.icon className="size-4 text-neutral-400 group-data-[active=true]:text-primary" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub className="ml-4 border-l border-neutral-100 dark:border-neutral-800 pl-4 gap-1">
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(subItem.url)} className="h-9 rounded-lg font-bold text-[10px] uppercase tracking-widest">
                            <Link href={subItem.url}>
                              <div className="flex items-center gap-2">
                                <span>{subItem.title}</span>
                              </div>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)} className="h-11 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                    <Link href={item.url}>
                      <item.icon className="size-4 text-neutral-400 group-data-[active=true]:text-primary" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-4 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">
            Resource Management
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {data.navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url)} className="h-11 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                  <Link href={item.url}>
                    <item.icon className="size-4 text-neutral-400 group-data-[active=true]:text-primary" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-neutral-100 dark:border-neutral-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-14 rounded-2xl bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-white dark:hover:bg-neutral-800 transition-all shadow-sm border border-neutral-100 dark:border-neutral-800"
            >
              <Avatar className="h-9 w-9 rounded-xl border-2 border-white dark:border-neutral-900 shadow-md">
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-black uppercase">
                  {user?.name?.charAt(0) || "I"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">{user?.name}</span>
                <span className="truncate text-[10px] text-neutral-400 font-bold">{user?.email}</span>
              </div>
              <MoreHorizontal className="ml-auto size-4 text-neutral-400 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-2xl p-2 border-neutral-100 dark:border-neutral-800 shadow-2xl dark:bg-neutral-900"
            side="right"
            align="end"
            sideOffset={12}
          >
            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 cursor-pointer">
              <Link href="/institution/profile" className="flex items-center font-bold text-xs uppercase tracking-widest">
                <User className="mr-3 size-4 text-neutral-400" />
                Profile Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl h-11 px-4 cursor-pointer">
              <Link href="/student-portal" className="flex items-center font-bold text-xs uppercase tracking-widest">
                <Globe className="mr-3 size-4 text-neutral-400" />
                Public Interface
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-100 dark:bg-neutral-800" />
            <DropdownMenuItem onClick={logout} className="rounded-xl h-11 px-4 text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 transition-colors cursor-pointer font-bold text-xs uppercase tracking-widest">
              <LogOut className="mr-3 size-4" />
              Terminate Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
