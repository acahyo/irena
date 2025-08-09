
import { redirect } from "next/navigation";
import DashboardClientLayout from "./layout-client";
import { getSettings } from "@/actions/settings";
import { getUsers } from "@/actions/users";
import type { User } from "@/lib/types";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  // NOTE: This is a placeholder for a real authentication system.
  // In a real app, you would get the logged-in user from a session.
  const users = await getUsers();
  const currentUser = users.find(u => u.email === 'admin@irena.com') || users.find(u => u.role?.toLowerCase().includes('admin')) || users[0];

  if (!currentUser) {
    // If no users exist, maybe redirect to a setup page or show an error.
    // For now, we'll redirect to login as a fallback.
    redirect('/');
  }

  return (
    <DashboardClientLayout
      settings={settings}
      user={currentUser}
    >
      {children}
    </DashboardClientLayout>
  );
}
