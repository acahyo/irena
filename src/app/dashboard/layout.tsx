
import React from "react";
import { redirect } from "next/navigation";
import DashboardClientLayout from "./layout-client";
import { getSettings } from "@/actions/settings";
import { getAdminSession } from "@/actions/auth";
import { getRoles } from "@/actions/roles";
import { UserProvider } from "@/contexts/user-context";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const [currentUser, roles] = await Promise.all([getAdminSession(), getRoles()]);
  
  if (!currentUser) {
    redirect('/');
  }

  const currentUserRole = roles.find(r => r.name === currentUser.role) || null;

  // Pass userSiteIds to children that need it, like the main dashboard page
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      if (child.type.name === 'DashboardPage' || child.type.name === 'LeaveSchedulePage' || child.type.name === 'EmployeesPage' || child.type.name === 'PayrollPage' || child.type.name === 'PayslipCollectivePage' || child.type.name === 'BpjsIdSimperPage' || child.type.name === 'FinancePage' || child.type.name === 'KoperasiLimitPage' || child.type.name === 'PurchasingPage' || child.type.name === 'PayslipPage') {
        return React.cloneElement(child, {
          userSiteIds: currentUser.role === 'Admin Proyek' ? currentUser.siteIds : undefined,
        } as any);
      }
    }
    return child;
  });

  return (
    <UserProvider user={currentUser}>
      <DashboardClientLayout
        settings={settings}
        user={currentUser}
        role={currentUserRole}
      >
        {childrenWithProps}
      </DashboardClientLayout>
    </UserProvider>
  );
}
