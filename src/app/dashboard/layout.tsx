
import Link from "next/link";
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
import DashboardClientLayout from "./layout-client";
import { getSettings } from "@/actions/settings";


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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  const activeLabel = (pathname: string) => {
    return navItems.find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href))?.label || settings.appName || 'Staff Hub';
  }

  return (
    <DashboardClientLayout
      settings={settings}
      activeLabelProvider={activeLabel}
    >
      {children}
    </DashboardClientLayout>
  );
}
