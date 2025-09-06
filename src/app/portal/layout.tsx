import { redirect } from "next/navigation";
import { getSettings } from "@/actions/settings";
import { getEmployee } from "@/actions/employees";
import PortalClientLayout from "./layout-client";
import { getEmployeeSession } from "@/actions/auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, session] = await Promise.all([getSettings(), getEmployeeSession()]);

  if (!session || !session.id) {
    redirect('/');
  }

  const employee = await getEmployee(session.id);
  
  if (!employee) {
    redirect('/');
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
