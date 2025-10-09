

'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect } from "react";
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
  AlertTriangle,
  Fuel,
  Archive,
} from "lucide-react";
import type { AppSettings, User, Role, MenuOrderItem } from "@/lib/types";
import { logout } from "@/actions/auth";


const allNavItemsList = (lang: 'id' | 'en') => [
  { id: 'dashboard', href: "/dashboard", icon: LayoutDashboard, label: lang === 'id' ? "Dasbor" : "Dashboard", exact: true },
  { id: 'finance-dashboard', href: "/dashboard/finance", icon: Landmark, label: "Dasbor Keuangan" },
  { id: 'hse-dashboard', href: "/dashboard/hse", icon: ShieldCheck, label: "Dasbor HSE" },
  
  // Kepegawaian
  { id: 'employees', href: "/dashboard/employees", icon: Users, label: lang === 'id' ? "Daftar Karyawan" : "Employees" },
  { id: 'employee-register', href: "/dashboard/employees/register", icon: UserPlus, label: "Registrasi Karyawan" },
  { id: 'employee-review', href: "/dashboard/employees/review", icon: UserCheckIcon, label: "Tinjau Registrasi" },
  { id: 'leave-schedule', href: "/dashboard/leave-schedule", icon: CalendarCheck, label: lang === 'id' ? "Jadwal Cuti" : "Leave Schedule" },
  { id: 'bpjs-id-simper', href: "/dashboard/bpjs-id-simper", icon: Database, label: "BPJS, ID & SIMPER" },
  { id: 'violations', href: "/dashboard/violations", icon: AlertTriangle, label: "Catatan Pelanggaran" },
  
  // Payroll & Absensi
  { id: 'attendance', href: "/dashboard/attendance", icon: ClipboardCheck, label: lang === 'id' ? "Input Absensi" : "Attendance Input" },
  { id: 'payroll', href: "/dashboard/payroll", icon: Wallet, label: "Payroll" },
  { id: 'payslip', href: "/dashboard/payslip", icon: Printer, label: lang === 'id' ? "Cetak Slip Gaji" : "Print Payslip" },
  { id: 'payslip-collective', href: "/dashboard/payslip-collective", icon: Printer, label: lang === 'id' ? "Slip Gaji Kolektif" : "Collective Payslip" },
  { id: 'payroll-history', href: "/dashboard/payroll/history", icon: History, label: "Riwayat Payroll" },

  // Purchasing & Gudang
  { id: 'purchasing', href: "/dashboard/purchasing", icon: ShoppingCart, label: "Pengajuan Barang" },
  { id: 'warehouse', href: "/dashboard/warehouse", icon: Archive, label: "Gudang" },
  
  // Keuangan
  { id: 'finance', href: "/dashboard/finance", icon: Landmark, label: lang === 'id' ? "Laporan Keuangan" : "Finance Report" },
  { id: 'payment-requests', href: "/dashboard/payment-requests", icon: CircleDollarSign, label: "Pengajuan Pembayaran" },
  { id: 'fuel-requests', href: "/dashboard/fuel-requests", icon: Fuel, label: "Pengajuan BBM" },
  { id: 'koperasi-limit', href: "/dashboard/finance/koperasi-limit", icon: Wallet, label: "Limit Koperasi" },
  
  // Koperasi
  { id: 'koperasi-items', href: "/dashboard/koperasi/items", icon: Store, label: "Barang Koperasi" },
  { id: 'koperasi-orders', href: "/dashboard/koperasi/orders", icon: ShoppingCart, label: "Pesanan Koperasi" },
  
  // Operasional & Driver
  { id: 'vehicles', href: "/dashboard/vehicles", icon: Truck, label: "Kendaraan" },
  { id: 'driver-attendance', href: "/dashboard/driver-attendance", icon: ClipboardList, label: "Absensi Driver" },
  { id: 'pj-attendance', href: "/dashboard/pj-attendance", icon: ClipboardList, label: "Absensi PJ" },

  // HSE
  { id: 'hse', href: "/dashboard/hse", icon: ShieldCheck, label: "Report HSE" },
  { id: 'hse-fines', href: "/dashboard/hse/fines", icon: CircleDollarSign, label: "Pengaturan Denda" },

  // Pengaturan & Master Data
  { id: 'department', href: "/dashboard/department", icon: Briefcase, label: lang === 'id' ? "Departemen" : "Department" },
  { id: 'position', href: "/dashboard/position", icon: WalletCards, label: lang === 'id' ? "Jabatan & Gaji" : "Position & Salary" },
  { id: 'project', href: "/dashboard/project", icon: Briefcase, label: "Proyek" },
  
  // Administrasi Sistem
  { id: 'users', href: "/dashboard/users", icon: UsersRound, label: "Users" },
  { id: 'roles', href: "/dashboard/roles", icon: ShieldCheck, label: "Roles & Hak Akses" },
  { id: 'driver-access', href: "/dashboard/driver-access", icon: Car, label: "Hak Akses Driver" },
  { id: 'pj-access', href: "/dashboard/pj-access", icon: Contact, label: "Hak Akses PJ" },
  { id: 'settings', href: "/dashboard/settings", icon: Settings, label: lang === 'id' ? "Pengaturan" : "Settings" },
];

const staticMenuOrder: MenuOrderItem[] = [
    { id: 'dashboard' },
    { id: 'finance-dashboard' },
    { id: 'hse-dashboard' },
    { id: 'employees' },
    { id: 'employee-register' },
    { id: 'employee-review' },
    { id: 'leave-schedule' },
    { id: 'bpjs-id-simper' },
    { id: 'violations' },
    { id: 'attendance' },
    { id: 'payroll' },
    { id: 'payslip' },
    { id: 'payslip-collective' },
    { id: 'payroll-history' },
    { id: 'purchasing' },
    { id: 'warehouse' },
    { id: 'finance' },
    { id: 'payment-requests' },
    { id: 'fuel-requests' },
    { id: 'koperasi-limit' },
    { id: 'koperasi-items' },
    { id: 'koperasi-orders' },
    { id: 'vehicles' },
    { id: 'driver-attendance' },
    { id: 'pj-attendance' },
    { id: 'hse' },
    { id: 'hse-fines' },
    { id: 'department' },
    { id: 'position' },
    { id: 'project' },
    { id: 'users' },
    { id: 'roles' },
    { id: 'driver-access' },
    { id: 'pj-access' },
    { id: 'settings' },
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
  
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [router]);
  
  const allNavItemsMap = useMemo(() => {
    const map = new Map();
    allNavItemsList(lang).forEach(item => map.set(item.id, item));
    return map;
  }, [lang]);

  const orderedNavItems = useMemo(() => {
    const menuOrder = settings.menuOrder && settings.menuOrder.length > 0 ? settings.menuOrder : staticMenuOrder;
    return menuOrder.map(orderItem => allNavItemsMap.get(orderItem.id)).filter(Boolean);
  }, [allNavItemsMap, settings.menuOrder]);
  
  const navItems = useMemo(() => {
    if (!role) return [];

    if (role.name.toLowerCase() === 'administrator') {
      return orderedNavItems;
    }

    const accessibleMenus = new Set(role.accessibleMenus || []);
    // Ensure dashboard is always accessible if a user has any other menu access
    if (accessibleMenus.size > 0) {
        accessibleMenus.add('dashboard');
        // Add finance dashboard for finance role
        if (role.name === 'Finance') {
            accessibleMenus.add('finance-dashboard');
        }
        if (role.name === 'HSE') {
            accessibleMenus.add('hse-dashboard');
        }
    }


    return orderedNavItems.filter(item => accessibleMenus.has(item.id));
  }, [orderedNavItems, role]);


  const getActiveLabel = () => {
    for (const item of allNavItemsList(lang)) {
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
              <AvatarImage src={user.avatar} alt={user.name} />
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
