import { getEmployeeSession } from '@/actions/auth';
import MyPayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import { getAttendanceByEmployeeAndPeriod } from '@/actions/attendance';
import type { EmployeeWithPosition, Position, AppSettings, Employee, AttendanceRecord } from '@/lib/types';
import { notFound, redirect } from 'next/navigation';
import { getEmployee } from '@/actions/employees';


export default async function MyPayslipPage() {
  let session, settings, positions, employee, initialAttendance;
  
  try {
    [session, settings, positions] = await Promise.all([
      getEmployeeSession(),
      getSettings(),
      getPositions(),
    ]);

    if (!session?.id) {
      redirect('/');
    }

    employee = await getEmployee(session.id);
    if (!employee) {
      notFound();
    }
    
    const currentPeriod = new Date().toISOString().slice(0, 7);
    initialAttendance = await getAttendanceByEmployeeAndPeriod(session.id, currentPeriod);

  } catch (error) {
    console.error("Failed to fetch data for payslip page:", error);
    // Set defaults to allow page to render
    if (!settings) settings = { appName: 'Staff Hub' };
    if (!employee) employee = { id: '', name: 'Guest' };
    if (!positions) positions = [];
    initialAttendance = null;
  }

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
