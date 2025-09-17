
import { getEmployeeSession } from '@/actions/auth';
import MyPayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import { getAttendanceByEmployeeAndPeriod } from '@/actions/attendance';
import type { EmployeeWithPosition, Position, AppSettings, Employee, AttendanceRecord } from '@/lib/types';
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
    
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const initialAttendanceData = await getAttendanceByEmployeeAndPeriod(session.id, currentPeriod);

    // Convert Date object to string to avoid serialization error
    const initialAttendance = initialAttendanceData
        ? { ...initialAttendanceData, date: initialAttendanceData.date ? initialAttendanceData.date.toString() : new Date().toString() }
        : null;

  const employeeWithDetails: EmployeeWithPosition = {
      ...employee,
      positionDetails: (positions || []).find(p => p.name === employee.position),
  };
  
  return (
    <MyPayslipClientPage
      employee={employeeWithDetails}
      settings={settings as AppSettings}
      initialAttendance={initialAttendance as AttendanceRecord | null}
    />
  );
}
