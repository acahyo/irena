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
  Store,
} from "lucide-react";
import type { AppSettings, Employee } from "@/lib/types";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const getNavItems = (lang: 'id' | 'en', settings: AppSettings) => {
  const allItems = [
    { id: 'profile', href: "/portal", icon: User, label: lang === 'id' ? "Profil" : "Profile", exact: true },
    { id: 'attendance', href: "/portal/attendance", icon: ClipboardCheck, label: lang === 'id' ? "Absensi" : "Kehadiran" },
    { id: 'leave', href: "/portal/leave", icon: CalendarCheck, label: lang === 'id' ? "Cuti" : "Cuti" },
    { id: 'koperasi', href: "/portal/koperasi", icon: Store, label: lang === 'id' ? "Koperasi" : "Koperasi" },
    { id: 'payslip', href: "/portal/payslip", icon: Printer, label: lang === 'id' ? "Gaji" : "Payslip" },
  ];

  if (settings.employeePayslipAccess === false) {
    return allItems.filter(item => item.id !== 'payslip');
  }
  
  return allItems;
};

const BottomNavItem = ({ href, icon: Icon, label, isActive }: { href: string; icon: React.ElementType; label: string; isActive: boolean }) => (
  <Link href={href} className={cn(
    "flex flex-col items-center justify-center gap-1 w-full h-full p-2 transition-colors duration-200",
    isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
  )}>
    <Icon className="h-6 w-6" />
    <span className="text-xs font-medium">{label}</span>
  </Link>
);


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
      {/* --- Desktop Sidebar --- */}
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
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sticky top-0 z-10 md:relative">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-full md:hidden">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-semibold">
                {activeLabel}
            </h1>
          </div>
          <div className="flex-1" />
           <Button onClick={handleLogout} variant="ghost" size="icon" className="md:hidden">
            <LogOut className="h-5 w-5" />
           </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </SidebarInset>

      {/* --- Mobile Bottom Navigation --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-t-lg z-50">
        <div className="flex justify-around items-center h-full">
          {navItems.map(item => (
            <BottomNavItem
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
            />
          ))}
        </div>
      </div>
    </SidebarProvider>
  );
}
