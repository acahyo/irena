

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
