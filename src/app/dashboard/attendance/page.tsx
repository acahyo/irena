
import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import AttendanceClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getSettings } from '@/actions/settings';
import type { AttendanceRecord } from '@/lib/types';

export default async function AttendancePage({ userSiteId }: { userSiteId?: string }) {
  const [employees, positions, settings] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getPositions(),
    getSettings(),
  ]);
  
  const employeesWithPositionDetails = employees.map(emp => {
      const positionDetails = positions.find(p => p.name === emp.position);
      return { ...emp, positionDetails };
  });

  // We can fetch initial attendance for the current month, but client will refetch on period change
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const initialAttendanceData = await getAttendanceByPeriod(currentPeriod);
  
  // Convert Date objects to strings to prevent serialization errors
  const initialAttendance = initialAttendanceData.map(record => ({
    ...record,
    date: record.date ? record.date.toString() : new Date().toString(),
  })) as AttendanceRecord[];


  return (
    <AttendanceClientPage
      employees={employeesWithPositionDetails}
      initialAttendance={initialAttendance}
      settings={settings}
    />
  );
}
