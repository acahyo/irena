

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
  const [settings, currentUser, roles] = await Promise.all([
      getSettings(), 
      getAdminSession(), 
      getRoles()
  ]);
  
  if (!currentUser) {
    redirect('/');
  }

  const currentUserRole = roles.find(r => r.name === currentUser.role) || null;

  // Pass user object to children that need it via context.
  // Pages that need siteIds will fetch it themselves based on the user from the session.
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      const pageName = child.type.name;
       if (
        pageName === 'DashboardPage' ||
        pageName === 'LeaveSchedulePage' ||
        pageName === 'EmployeeDirectoryPage' ||
        pageName === 'PayrollPage' ||
        pageName === 'PayslipCollectivePage' ||
        pageName === 'BpjsIdSimperPage' ||
        pageName === 'FinancePage' ||
        pageName === 'KoperasiLimitPage'
      ) {
         return React.cloneElement(child, {
          user: currentUser,
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
        {children}
      </DashboardClientLayout>
    </UserProvider>
  );
}
