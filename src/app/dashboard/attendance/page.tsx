import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import AttendanceClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getSettings } from '@/actions/settings';

export default async function AttendancePage() {
  const [employees, positions, settings] = await Promise.all([
    getEmployees(),
    getPositions(),
    getSettings(),
  ]);
  
  const employeesWithPositionDetails = employees.map(emp => {
      const positionDetails = positions.find(p => p.name === emp.position);
      return { ...emp, positionDetails };
  });

  // We can fetch initial attendance for the current month, but client will refetch on period change
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const initialAttendance = await getAttendanceByPeriod(currentPeriod);

  return (
    <AttendanceClientPage
      employees={employeesWithPositionDetails}
      initialAttendance={initialAttendance}
      settings={settings}
    />
  );
}
