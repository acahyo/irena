'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
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
  ShieldCheck,
  UsersRound,
  Settings,
  CalendarCheck,
  LayoutDashboard,
  Printer,
  ClipboardCheck,
  Wallet,
  WalletCards,
  ChevronDown,
  MapPin,
} from "lucide-react";
import type { AppSettings, User, Role, MenuOrderItem } from "@/lib/types";


const allNavItemsList = (lang: 'id' | 'en') => [
  { id: 'dashboard', href: "/dashboard", icon: LayoutDashboard, label: lang === 'id' ? "Dasbor" : "Dashboard", exact: true },
  { id: 'employees', href: "/dashboard/employees", icon: Users, label: lang === 'id' ? "Karyawan" : "Employees" },
  { id: 'leave-schedule', href: "/dashboard/leave-schedule", icon: CalendarCheck, label: lang === 'id' ? "Jadwal Cuti" : "Leave Schedule" },
  { id: 'payroll', href: "/dashboard/payroll", icon: Wallet, label: "Payroll" },
  { id: 'attendance', href: "/dashboard/attendance", icon: ClipboardCheck, label: lang === 'id' ? "Input Absensi" : "Attendance Input" },
  { id: 'payslip', href: "/dashboard/payslip", icon: Printer, label: lang === 'id' ? "Cetak Slip Gaji" : "Print Payslip" },
  { id: 'payslip-collective', href: "/dashboard/payslip-collective", icon: Printer, label: lang === 'id' ? "Slip Gaji Kolektif" : "Collective Payslip" },
  { id: 'department', href: "/dashboard/department", icon: Briefcase, label: lang === 'id' ? "Departemen" : "Department" },
  { id: 'position', href: "/dashboard/position", icon: WalletCards, label: lang === 'id' ? "Jabatan & Gaji" : "Position & Salary" },
  { id: 'project', href: "/dashboard/project", icon: Briefcase, label: "Proyek" },
  { id: 'users', href: "/dashboard/users", icon: UsersRound, label: "Users" },
  { id: 'roles', href: "/dashboard/roles", icon: ShieldCheck, label: "Roles" },
  { id: 'settings', href: "/dashboard/settings", icon: Settings, label: lang === 'id' ? "Pengaturan" : "Settings" },
];


export default function DashboardClientLayout({
  children,
  settings,
  user,
  role,
}: {
  children: React.ReactNode;
  settings: AppSettings;
  user: User;
  role: Role | null;
}) {
  const pathname = usePathname();
  const lang = settings.language || 'id';
  
  const allNavItemsMap = useMemo(() => {
      const map = new Map();
      allNavItemsList(lang).forEach(item => map.set(item.id, item));
      return map;
  }, [lang]);

  const orderedNavItems = useMemo(() => {
    // If a menu order is saved in settings, use it. Otherwise, use the default list.
    const menuOrderSource = settings.menuOrder && settings.menuOrder.length > 0 
        ? settings.menuOrder 
        : allNavItemsList(lang).map(item => ({ id: item.id, isGroup: false, subItems: [] }));
    
    // Ensure all menus are present, even if not in the saved order, to prevent them from disappearing.
    const allKnownIds = new Set(allNavItemsList(lang).map(i => i.id));
    const usedIds = new Set(menuOrderSource.flatMap(item => item.isGroup ? (item.subItems || []) : [item.id]));
    const missingItems = Array.from(allKnownIds).filter(id => !usedIds.has(id)).map(id => ({ id, isGroup: false, subItems: [] }));

    const finalMenuOrder = [...menuOrderSource, ...missingItems];

    return finalMenuOrder.map(orderItem => {
        if (orderItem.isGroup) {
            return {
                id: orderItem.id,
                isGroup: true,
                label: `Grup Menu`, // You might want a way to name groups
                icon: FolderKanban,
                subItems: (orderItem.subItems || [])
                    .map(subId => allNavItemsMap.get(subId))
                    .filter(Boolean),
            };
        }
        return allNavItemsMap.get(orderItem.id);
    }).filter(Boolean); // Filter out any undefined items
  }, [allNavItemsMap, settings.menuOrder, lang]);
  
  const navItems = useMemo(() => {
    if (!role) return [];
    if (role.name.toLowerCase() === 'administrator') return orderedNavItems;

    const accessibleMenus = new Set(role.accessibleMenus || []);
    
    return orderedNavItems.map(item => {
        if (item.isGroup) {
            const accessibleSubItems = item.subItems.filter((sub: any) => accessibleMenus.has(sub.id));
            if (accessibleSubItems.length > 0) {
                return { ...item, subItems: accessibleSubItems };
            }
            return null;
        }
        return accessibleMenus.has(item.id) ? item : null;
    }).filter(Boolean);
  }, [orderedNavItems, role]);


  const getActiveLabel = () => {
    for (const item of allNavItemsList(lang)) {
        if (item.href && (item.exact ? pathname === item.href : pathname.startsWith(item.href))) {
            return item.label;
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
            {navItems.map((item: any, index) => (
              <SidebarMenuItem key={`${item.id}-${index}`}>
                {item.isGroup ? (
                   <>
                        <SidebarMenuButton
                            isSubmenu
                            isActive={item.subItems?.some((sub: any) => pathname.startsWith(sub.href))}
                            tooltip={{ children: item.label }}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                         <SidebarMenuSub>
                            {item.subItems.map((subItem: any) => (
                                 <SidebarMenuItem key={subItem.href}>
                                    <Link href={subItem.href} passHref>
                                        <SidebarMenuSubButton isActive={pathname.startsWith(subItem.href)}>
                                            {subItem.label}
                                        </SidebarMenuSubButton>
                                    </Link>
                                 </SidebarMenuItem>
                            ))}
                        </SidebarMenuSub>
                    </>
                ) : (
                    <Link href={item.href} passHref>
                        <SidebarMenuButton
                            isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                            tooltip={{ children: item.label }}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar || "https://placehold.co/100x100/877795/FFFFFF"} alt={user.name} />
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
            <SidebarMenuButton tooltip={{ children: lang === 'id' ? 'Keluar' : 'Log Out' }}>
              <LogOut />
              <span>{lang === 'id' ? 'Keluar' : 'Log Out'}</span>
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
