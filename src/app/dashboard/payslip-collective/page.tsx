

import { getEmployees } from '@/actions/employees';
import PayslipCollectiveClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import type { EmployeeWithPosition, Position, Site } from '@/lib/types';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getSites } from '@/actions/sites';


export default async function PayslipCollectivePage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }

  const userSiteIds = (user.role === 'HR' || user.role === 'Administrator') ? undefined : user.siteIds;

  const [employees, settings, positions, sites] = await Promise.all([
    getEmployees({ siteIds: userSiteIds }),
    getSettings(),
    getPositions(),
    getSites(),
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
      sites={sites}
      positions={positions}
    />
  );
}
