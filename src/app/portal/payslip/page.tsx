
import { getEmployeeSession } from '@/actions/auth';
import MyPayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import { getAttendanceByEmployeeAndPeriod } from '@/actions/attendance';
import type { EmployeeWithPosition } from '@/lib/types';
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

  const employeeWithDetails: EmployeeWithPosition = {
      ...employee,
      positionDetails: positions.find(p => p.name === employee.position),
  };
  
  // Pre-fetch attendance for the current month
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const initialAttendance = await getAttendanceByEmployeeAndPeriod(session.id, currentPeriod);

  return (
    <MyPayslipClientPage
      employee={employeeWithDetails}
      settings={settings}
      initialAttendance={initialAttendance}
    />
  );
}
