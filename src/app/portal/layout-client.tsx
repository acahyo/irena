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
} from "@/components/ui/sidebar";
import {
  LogOut,
  CalendarCheck,
  Printer,
  ClipboardCheck,
  User,
  ShoppingCart,
  Store,
} from "lucide-react";
import type { AppSettings, Employee } from "@/lib/types";
import { logout } from "@/actions/auth";

const getNavItems = (lang: 'id' | 'en', settings: AppSettings) => {
  const allItems = [
    { id: 'profile', href: "/portal", icon: User, label: lang === 'id' ? "Profil Saya" : "My Profile", exact: true },
    { id: 'attendance', href: "/portal/attendance", icon: ClipboardCheck, label: lang === 'id' ? "Kehadiran Saya" : "My Attendance" },
    { id: 'leave', href: "/portal/leave", icon: CalendarCheck, label: lang === 'id' ? "Cuti Saya" : "My Leave" },
    { id: 'payslip', href: "/portal/payslip", icon: Printer, label: lang === 'id' ? "Slip Gaji Saya" : "My Payslip" },
    { id: 'purchasing', href: "/portal/purchasing", icon: ShoppingCart, label: lang === 'id' ? "Pengajuan Barang" : "Purchase Request" },
    { id: 'koperasi', href: "/portal/koperasi", icon: Store, label: lang === 'id' ? "Koperasi Saya" : "My Cooperative" },
  ];

  if (settings.employeePayslipAccess === false) {
    return allItems.filter(item => item.id !== 'payslip');
  }
  
  return allItems;
};

export default function PortalClientLayout({
  children,
  settings,
  employee,
}: {
  children: React.ReactNode;
  settings: AppSettings;
  employee: Employee;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = settings.language || 'id';
  
  const navItems = useMemo(() => getNavItems(lang, settings), [lang, settings]);

  const getActiveLabel = () => {
    for (const item of navItems) {
      if (item.exact ? pathname === item.href : pathname.startsWith(item.href)) {
        return item.label;
      }
    }
    return lang === 'id' ? 'Portal Karyawan' : 'Employee Portal';
  }
  
  const handleLogout = async () => {
      await logout('employee');
      router.push('/login/employee');
      router.refresh();
  }

  const activeLabel = getActiveLabel();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/portal" className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-md">
                {settings.logo && <AvatarImage src={settings.logo} alt={settings.appName} />}
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground">
                    {settings.appName?.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <span className="text-lg font-semibold text-sidebar-foreground">
              {settings.appName}
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item, index) => (
              <SidebarMenuItem key={`${item.label}-${index}`}>
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
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-sm">
              <span className="font-semibold text-sidebar-foreground">
                {employee.name}
              </span>
              <span className="text-sidebar-foreground/70">
                {employee.email}
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
