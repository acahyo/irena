

import { getEmployeeSession } from '@/actions/auth';
import MyPayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import type { EmployeeWithPosition, Position, AppSettings, Employee } from '@/lib/types';
import { notFound, redirect } from 'next/navigation';
import { getEmployee } from '@/actions/employees';


export default async function MyPayslipPage() {
  const [session, settings, positions] = await Promise.all([
      getEmployeeSession(),
      getSettings(),
      getPositions(),
    ]);

    if (!session?.id) {
      redirect('/');
    }

    const employee = await getEmployee(session.id);
    if (!employee) {
      notFound();
    }
    
    const positionDetails: Position[] = (employee.positions || [])
        .map(posName => positions.find(p => p.name === posName))
        .filter((p): p is Position => !!p);

    const employeeWithDetails: EmployeeWithPosition = {
      ...employee,
      positionDetails: positionDetails,
    };
  
  return (
    <MyPayslipClientPage
      employee={employeeWithDetails}
      settings={settings as AppSettings}
    />
  );
}
