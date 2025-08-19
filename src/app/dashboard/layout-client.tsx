
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
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  FolderKanban,
  LogOut,
  Users,
  Briefcase,
  Shield,
  UsersRound,
  ShieldCheck,
  Settings,
  CalendarCheck,
  LayoutDashboard,
  Printer,
  ClipboardCheck,
  Wallet,
} from "lucide-react";
import type { AppSettings, User } from "@/lib/types";

const allNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true, roles: ["Administrator", "HR"] },
  { href: "/dashboard/employees", icon: Users, label: "Employees", roles: ["Administrator", "HR"] },
  { href: "/dashboard/leave-schedule", icon: CalendarCheck, label: "Jadwal Cuti", roles: ["Administrator", "HR"] },
  { href: "/dashboard/attendance", icon: ClipboardCheck, label: "Input Absensi", roles: ["Administrator", "HR"] },
  { href: "/dashboard/payslip", icon: Printer, label: "Cetak Slip Gaji", roles: ["Administrator", "HR"] },
  { href: "/dashboard/payslip-collective", icon: Printer, label: "Slip Gaji Kolektif", roles: ["Administrator", "HR"] },
  { href: "/dashboard/department", icon: Briefcase, label: "Department", roles: ["Administrator", "HR"] },
  { href: "/dashboard/position", icon: Shield, label: "Position", roles: ["Administrator", "HR"] },
  { href: "/dashboard/users", icon: UsersRound, label: "Users", roles: ["Administrator"] },
  { href: "/dashboard/roles", icon: ShieldCheck, label: "Roles", roles: ["Administrator"] },
  { href: "/dashboard/settings", icon: Settings, label: "Settings", roles: ["Administrator"] },
];

export default function DashboardClientLayout({
  children,
  settings,
  user,
}: {
  children: React.ReactNode;
  settings: AppSettings;
  user: User;
}) {
  const pathname = usePathname();
  
  const userRole = user?.role || '';

  const navItems = allNavItems.filter(item => {
    if (userRole.toLowerCase() === 'administrator') return true;
    return item.roles.includes(userRole);
  });

  const getActiveLabel = () => {
    for (const item of navItems) {
        if (item.href && (item.exact ? pathname === item.href : pathname.startsWith(item.href))) {
            return item.label;
        }
        if ('subItems' in item && item.subItems) {
            for (const subItem of item.subItems) {
                if (pathname.startsWith(subItem.href)) {
                    return subItem.label;
                }
            }
        }
    }
    return settings.appName || 'Dashboard';
  }

  const activeLabel = getActiveLabel();


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-md">
                {settings.logo && <AvatarImage src={settings.logo} alt={settings.appName} />}
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
                    <FolderKanban className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold text-sidebar-foreground">
              {settings.appName}
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item, index) => (
              <SidebarMenuItem key={`${item.label}-${index}`}>
                {'href' in item && item.href ? (
                    <Link href={item.href} passHref>
                        <SidebarMenuButton
                            isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                            tooltip={{ children: item.label }}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                ) : (
                    'subItems' in item && item.subItems && (
                    <>
                        <SidebarMenuButton
                            isSubmenu
                            isActive={item.subItems?.some(sub => pathname.startsWith(sub.href))}
                            tooltip={{ children: item.label }}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                         <SidebarMenuSub>
                            {item.subItems.map(subItem => (
                                 <SidebarMenuItem key={subItem.href}>
                                    <Link href={subItem.href}>
                                        <SidebarMenuSubButton isActive={pathname.startsWith(subItem.href)}>
                                            {subItem.label}
                                        </SidebarMenuSubButton>
                                    </Link>
                                 </SidebarMenuItem>
                            ))}
                        </SidebarMenuSub>
                    </>
                    )
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/100x100/877795/FFFFFF" alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm">
              <span className="font-semibold text-sidebar-foreground">
                {user.name}
              </span>
              <span className="text-sidebar-foreground/70">
                {user.email}
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
