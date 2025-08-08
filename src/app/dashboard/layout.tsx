
import DashboardClientLayout from "./layout-client";
import { getSettings } from "@/actions/settings";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <DashboardClientLayout
      settings={settings}
    >
      {children}
    </DashboardClientLayout>
  );
}
