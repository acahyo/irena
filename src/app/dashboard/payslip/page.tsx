
import { getEmployees } from '@/actions/employees';
import PayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';

export default async function PayslipPage() {
  const employees = await getEmployees();
  const settings = await getSettings();

  return <PayslipClientPage initialEmployees={employees} settings={settings} />;
}
