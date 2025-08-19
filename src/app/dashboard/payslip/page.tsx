
import { getEmployees } from '@/actions/employees';
import PayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';

export default async function PayslipPage() {
  const [employees, settings, positions] = await Promise.all([
    getEmployees(),
    getSettings(),
    getPositions()
  ]);

  return <PayslipClientPage initialEmployees={employees} settings={settings} positions={positions} />;
}
