'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Landmark,
  Database,
  ShoppingCart,
  UserPlus,
  UserCheck as UserCheckIcon,
  Store,
  History
} from "lucide-react";
import type { AppSettings, User, Role, MenuOrderItem } from "@/lib/types";
import { logout } from "@/actions/auth";


const allNavItemsList = (lang: 'id' | 'en') => [
  { id: 'dashboard', href: "/dashboard", icon: LayoutDashboard, label: lang === 'id' ? "Dasbor" : "Dashboard", exact: true },
  { id: 'employees', href: "/dashboard/employees", icon: Users, label: lang === 'id' ? "Karyawan" : "Employees" },
  { id: 'employee-register', href: "/dashboard/employees/register", icon: UserPlus, label: "Registrasi Karyawan" },
  { id: 'employee-review', href: "/dashboard/employees/review", icon: UserCheckIcon, label: "Tinjau Registrasi" },
  { id: 'leave-schedule', href: "/dashboard/leave-schedule", icon: CalendarCheck, label: lang === 'id' ? "Jadwal Cuti" : "Leave Schedule" },
  { id: 'payroll', href: "/dashboard/payroll", icon: Wallet, label: "Payroll" },
  { id: 'payroll-history', href: "/dashboard/payroll/history", icon: History, label: "Riwayat Payroll" },
  { id: 'attendance', href: "/dashboard/attendance", icon: ClipboardCheck, label: lang === 'id' ? "Input Absensi" : "Attendance Input" },
  { id: 'payslip', href: "/dashboard/payslip", icon: Printer, label: lang === 'id' ? "Cetak Slip Gaji" : "Print Payslip" },
  { id: 'payslip-collective', href: "/dashboard/payslip-collective", icon: Printer, label: lang === 'id' ? "Slip Gaji Kolektif" : "Collective Payslip" },
  { id: 'purchasing', href: "/dashboard/purchasing", icon: ShoppingCart, label: "Purchasing" },
  { id: 'purchasing-items', href: "/dashboard/purchasing/items", icon: Store, label: "Barang Koperasi" },
  { id: 'koperasi-orders', href: "/dashboard/koperasi/orders", icon: ShoppingCart, label: "Pesanan Koperasi" },
  { id: 'bpjs-id-simper', href: "/dashboard/bpjs-id-simper", icon: Database, label: "BPJS-ID-SIMPER" },
  { id: 'department', href: "/dashboard/department", icon: Briefcase, label: lang === 'id' ? "Departemen" : "Department" },
  { id: 'position', href: "/dashboard/position", icon: WalletCards, label: lang === 'id' ? "Jabatan & Gaji" : "Position & Salary" },
  { id: 'project', href: "/dashboard/project", icon: Briefcase, label: "Proyek" },
  { id: 'finance', href: "/dashboard/finance", icon: Landmark, label: lang === 'id' ? "Keuangan" : "Finance" },
  { id: 'koperasi-limit', href: "/dashboard/finance/koperasi-limit", icon: Wallet, label: "Limit Koperasi" },
  { id: 'hse', href: "/dashboard/hse", icon: ShieldCheck, label: "HSE" },
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
  const router = useRouter();
  const lang = settings.language || 'id';
  
  const allNavItemsMap = useMemo(() => {
    const map = new Map();
    allNavItemsList(lang).forEach(item => map.set(item.id, item));
    return map;
  }, [lang]);

  const orderedNavItems = useMemo(() => {
    const fullNavList = allNavItemsList(lang);
    const menuOrder = settings.menuOrder || [];
    const usedIds = new Set(menuOrder.flatMap(item => [item.id, ...(item.subItems || [])]));
    
    // Add any items not defined in the saved order to the end
    const remainingItems = fullNavList.filter(item => !usedIds.has(item.id)).map(item => ({ id: item.id }));

    const finalOrder = [...menuOrder, ...remainingItems];

    return finalOrder.map(orderItem => {
        const mainItem = allNavItemsMap.get(orderItem.id);
        if (!mainItem) return null;

        if (orderItem.isGroup) {
            const subItems = (orderItem.subItems || [])
                .map(subId => allNavItemsMap.get(subId))
                .filter(Boolean);
            
            return {
                ...mainItem,
                isGroup: true,
                subItems: subItems,
            };
        }
        return mainItem;
    }).filter(Boolean);
  }, [allNavItemsMap, settings.menuOrder, lang]);
  
  const navItems = useMemo(() => {
    if (!role) return [];
    if (role.name.toLowerCase() === 'administrator') return orderedNavItems;

    const accessibleMenus = new Set(role.accessibleMenus || []);
    
    return orderedNavItems.map(item => {
        if ((item as any).isGroup) {
            const accessibleSubItems = (item as any).subItems.filter((sub: any) => accessibleMenus.has(sub.id));
            if (accessibleSubItems.length > 0) {
                return { ...item, subItems: accessibleSubItems };
            }
            return null;
        }
        return accessibleMenus.has(item.id) ? item : null;
    }).filter(Boolean);
  }, [orderedNavItems, role]);


  const getActiveLabel = () => {
    for (const item of allNavItemsList(lang).flatMap(i => (i as any).subItems ? (i as any).subItems : i)) {
        if (item.href && (item.exact ? pathname === item.href : pathname.startsWith(item.href))) {
            return item.label;
        }
    }
    return settings.appName || 'Dashboard';
  }

  const handleLogout = async () => {
      await logout('admin');
      router.push('/');
      router.refresh();
  }

  const activeLabel = getActiveLabel();


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-md">
                {settings.logo && <AvatarImage src={settings.logo} alt={settings.appName} />}
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
                    <FolderKanban className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold text-sidebar-foreground">
              {settings.appName}
            </span>
          </Link>
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
          <SidebarMenuButton onClick={handleLogout} tooltip={{ children: lang === 'id' ? 'Keluar' : 'Log Out' }}>
              <LogOut />
              <span>{lang === 'id' ? 'Keluar' : 'Log Out'}</span>
            </SidebarMenuButton>
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