
import { redirect } from "next/navigation";
import DashboardClientLayout from "./layout-client";
import { getSettings } from "@/actions/settings";
import { getUsers } from "@/actions/users";
import { getRoles } from "@/actions/roles";
import type { User, Role } from "@/lib/types";
import { seedDatabase } from "@/lib/seed-data";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await seedDatabase();

  const settings = await getSettings();
  // NOTE: This is a placeholder for a real authentication system.
  // In a real app, you would get the logged-in user from a session.
  const [users, roles] = await Promise.all([getUsers(), getRoles()]);
  const currentUser = users.find(u => u.email === 'admin@irena.com') || users.find(u => u.role?.toLowerCase().includes('admin')) || users[0];

  if (!currentUser) {
    // If no users exist, maybe redirect to a setup page or show an error.
    // For now, we'll redirect to login as a fallback.
    redirect('/');
  }

  const currentUserRole = roles.find(r => r.name === currentUser.role) || null;

  return (
    <DashboardClientLayout
      settings={settings}
      user={currentUser}
      role={currentUserRole}
    >
      {children}
    </DashboardClientLayout>
  );
}
