import { getEmployeeSession } from '@/actions/auth';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getSettings } from '@/actions/settings';
import { notFound, redirect } from 'next/navigation';
import MyAttendanceClientPage from './client-page';
import { getEmployee } from '@/actions/employees';

export default async function MyAttendancePage() {
  const [session, settings] = await Promise.all([getEmployeeSession(), getSettings()]);

  if (!session?.id) {
    redirect('/');
  }
  
  const employee = await getEmployee(session.id);
  if (!employee) {
    notFound();
  }

  // Fetch initial attendance for the current month
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const allAttendance = await getAttendanceByPeriod(currentPeriod);
  const initialAttendance = allAttendance.filter(rec => rec.employeeId === session.id);


  return (
    <MyAttendanceClientPage
      employee={employee}
      initialAttendance={initialAttendance}
      settings={settings}
    />
  );
}
