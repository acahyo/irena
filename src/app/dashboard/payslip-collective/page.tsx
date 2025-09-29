
import { getEmployees } from '@/actions/employees';
import PayslipCollectiveClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import type { EmployeeWithPosition, Position } from '@/lib/types';


export default async function PayslipCollectivePage({ userSiteId }: { userSiteId?: string }) {
  const [employees, settings, positions] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getSettings(),
    getPositions()
  ]);

  const employeesWithDetails: EmployeeWithPosition[] = employees.map(emp => {
      const positionDetails: Position[] = (emp.positions || [])
        .map(posName => positions.find(p => p.name === posName))
        .filter((p): p is Position => !!p);
      return { ...emp, positionDetails };
  });

  return (
    <PayslipCollectiveClientPage
      initialEmployees={employeesWithDetails}
      settings={settings}
    />
  );
}
