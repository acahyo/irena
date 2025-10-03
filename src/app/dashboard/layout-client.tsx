

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
  History,
  CircleDollarSign,
  Car,
  Truck,
  ClipboardList,
  Contact,
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
  { id: 'koperasi-orders', href: "/dashboard/koperasi/orders", icon: ShoppingCart, label: "Pesanan Koperasi" },
  { id: 'koperasi-items', href: "/dashboard/koperasi/items", icon: Store, label: "Barang Koperasi" },
  { id: 'bpjs-id-simper', href: "/dashboard/bpjs-id-simper", icon: Database, label: "BPJS-ID-SIMPER" },
  { id: 'department', href: "/dashboard/department", icon: Briefcase, label: lang === 'id' ? "Departemen" : "Department" },
  { id: 'position', href: "/dashboard/position", icon: WalletCards, label: lang === 'id' ? "Jabatan & Gaji" : "Position & Salary" },
  { id: 'project', href: "/dashboard/project", icon: Briefcase, label: "Proyek" },
  { id: 'finance', href: "/dashboard/finance", icon: Landmark, label: lang === 'id' ? "Keuangan" : "Finance" },
  { id: 'koperasi-limit', href: "/dashboard/finance/koperasi-limit", icon: Wallet, label: "Limit Koperasi" },
  { id: 'hse', href: "/dashboard/hse", icon: ShieldCheck, label: "Dasbor HSE" },
  { id: 'hse-fines', href: "/dashboard/hse/fines", icon: CircleDollarSign, label: "Pengaturan Denda" },
  { id: 'vehicles', href: "/dashboard/vehicles", icon: Truck, label: "Kendaraan" },
  { id: 'driver-attendance', href: "/dashboard/driver-attendance", icon: ClipboardList, label: "Absensi Driver" },
  { id: 'pj-attendance', href: "/dashboard/pj-attendance", icon: ClipboardList, label: "Absensi PJ" },
  { id: 'users', href: "/dashboard/users", icon: UsersRound, label: "Users" },
  { id: 'roles', href: "/dashboard/roles", icon: ShieldCheck, label: "Roles" },
  { id: 'driver-access', href: "/dashboard/driver-access", icon: Car, label: "Hak Akses Driver" },
  { id: 'pj-access', href: "/dashboard/pj-access", icon: Contact, label: "Hak Akses PJ" },
  { id: 'settings', href: "/dashboard/settings", icon: Settings, label: lang === 'id' ? "Pengaturan" : "Settings" },
];

const staticMenuOrder: MenuOrderItem[] = [
    { id: 'dashboard' },
    {
      id: 'karyawan-group',
      isGroup: true,
      subItems: ['employees', 'employee-register', 'employee-review', 'leave-schedule'],
    },
    {
      id: 'payroll-group',
      isGroup: true,
      subItems: ['payroll', 'payroll-history', 'attendance', 'payslip', 'payslip-collective'],
    },
    {
      id: 'purchasing-group',
      isGroup: true,
      subItems: ['purchasing', 'koperasi-items', 'koperasi-orders'],
    },
    { id: 'bpjs-id-simper' },
    {
      id: 'data-master-group',
      isGroup: true,
      subItems: ['department', 'position', 'project'],
    },
    {
      id: 'finance-group',
      isGroup: true,
      subItems: ['finance', 'koperasi-limit'],
    },
    {
      id: 'hse-group',
      isGroup: true,
      subItems: ['hse', 'hse-fines'],
    },
    {
      id: 'driver-group',
      isGroup: true,
      subItems: ['vehicles', 'driver-attendance', 'pj-attendance'],
    },
    {
      id: 'admin-group',
      isGroup: true,
      subItems: ['users', 'roles', 'driver-access', 'pj-access', 'settings'],
    },
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
    // Group titles are not in allNavItemsList, so we define them here.
    const groupLabels: Record<string, string> = {
        'karyawan-group': 'Manajemen Karyawan',
        'payroll-group': 'Payroll',
        'purchasing-group': 'Purchasing & Koperasi',
        'data-master-group': 'Data Master',
        'finance-group': 'Keuangan',
        'hse-group': 'HSE',
        'driver-group': 'Driver & PJ',
        'admin-group': 'Administrasi',
    };
    const groupIcons: Record<string, React.ElementType> = {
        'karyawan-group': Users,
        'payroll-group': Wallet,
        'purchasing-group': ShoppingCart,
        'data-master-group': Database,
        'finance-group': Landmark,
        'hse-group': ShieldCheck,
        'driver-group': Truck,
        'admin-group': Settings,
    };

    return staticMenuOrder.map(orderItem => {
        if (orderItem.isGroup) {
            const subItems = (orderItem.subItems || [])
                .map(subId => allNavItemsMap.get(subId))
                .filter(Boolean);
            
            return {
                id: orderItem.id,
                label: groupLabels[orderItem.id] || 'Group',
                icon: groupIcons[orderItem.id] || Briefcase,
                isGroup: true,
                subItems: subItems,
            };
        }
        return allNavItemsMap.get(orderItem.id);
    }).filter(Boolean);
  }, [allNavItemsMap, lang]);
  
  const navItems = useMemo(() => {
    if (!role) return [];

    let accessibleItems;
    if (role.name.toLowerCase() === 'administrator') {
      accessibleItems = orderedNavItems;
    } else {
        const accessibleMenus = new Set(role.accessibleMenus || []);
        accessibleItems = orderedNavItems.map(item => {
            if ((item as any).isGroup) {
                const accessibleSubItems = (item as any).subItems.filter((sub: any) => accessibleMenus.has(sub.id));
                if (accessibleSubItems.length > 0) {
                    return { ...item, subItems: accessibleSubItems };
                }
                return null;
            }
            return accessibleMenus.has(item.id) ? item : null;
        }).filter(Boolean);
    }
    
    const hasDashboard = accessibleItems.some(item => item.id === 'dashboard');
    if (!hasDashboard) {
      const dashboardItem = allNavItemsMap.get('dashboard');
      if (dashboardItem) {
        return [dashboardItem, ...accessibleItems];
      }
    }
    
    return accessibleItems;

  }, [orderedNavItems, role, allNavItemsMap]);


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
