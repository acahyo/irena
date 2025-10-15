import { redirect } from "next/navigation";
import { getSettings } from "@/actions/settings";
import PortalClientLayout from "./layout-client";
import { getEmployeeSession } from "@/actions/auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, employee] = await Promise.all([getSettings(), getEmployeeSession()]);

  if (!employee) {
    redirect('/login/employee');
  }

  return (
    <PortalClientLayout
      settings={settings}
      employee={employee}
    >
      {children}
    </PortalClientLayout>
  );
}
