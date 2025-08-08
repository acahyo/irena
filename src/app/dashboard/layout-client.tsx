
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Building,
  LogOut,
  Users,
  Briefcase,
  Shield,
  UsersRound,
  ShieldCheck,
  Settings,
  CalendarCheck,
  LayoutDashboard,
} from "lucide-react";
import type { AppSettings } from "@/lib/types";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/employees", icon: Users, label: "Employees" },
  { href: "/dashboard/leave-schedule", icon: CalendarCheck, label: "Jadwal Cuti" },
  { href: "/dashboard/department", icon: Briefcase, label: "Department" },
  { href: "/dashboard/position", icon: Shield, label: "Position" },
  { href: "/dashboard/users", icon: UsersRound, label: "Users" },
  { href: "/dashboard/roles", icon: ShieldCheck, label: "Roles" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardClientLayout({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: AppSettings;
}) {
  const pathname = usePathname();

  const activeLabel = navItems.find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href))?.label || settings.appName || 'Staff Hub';


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-md">
                {settings.logo && <AvatarImage src={settings.logo} alt={settings.appName} />}
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
                    <Building className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold text-sidebar-foreground">
              {settings.appName || 'Staff Hub'}
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/100x100/877795/FFFFFF" alt="Admin" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm">
              <span className="font-semibold text-sidebar-foreground">
                Admin User
              </span>
              <span className="text-sidebar-foreground/70">
                admin@staffhub.com
              </span>
            </div>
          </div>
          <Link href="/" passHref>
            <SidebarMenuButton tooltip={{ children: 'Log Out' }}>
              <LogOut />
              <span>Log Out</span>
            </SidebarMenuButton>
          </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <SidebarTrigger className="flex md:hidden" />
          <div className="flex-1">
             <h1 className="text-lg font-semibold">
                {activeLabel}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
