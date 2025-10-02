
import React from "react";
import { redirect } from "next/navigation";
import DashboardClientLayout from "./layout-client";
import { getSettings } from "@/actions/settings";
import { getAdminSession } from "@/actions/auth";
import { getRoles } from "@/actions/roles";


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

  // Pass siteId(s) for Admin Proyek role
  const childrenWithProps = React.cloneElement(children as React.ReactElement, { 
      userSiteId: currentUser.role === 'Admin Proyek' ? (currentUser.siteIds ? currentUser.siteIds[0] : undefined) : undefined 
  });

  return (
    <DashboardClientLayout
      settings={settings}
      user={currentUser}
      role={currentUserRole}
    >
      {childrenWithProps}
    </DashboardClientLayout>
  );
}
