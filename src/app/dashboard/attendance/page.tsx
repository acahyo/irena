
import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import AttendanceClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getSettings } from '@/actions/settings';
import type { AttendanceRecord } from '@/lib/types';
import { getAdminSession } from '@/actions/auth';

export default async function AttendancePage({ userSiteId }: { userSiteId?: string }) {
  const [employees, positions, settings, user] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getPositions(),
    getSettings(),
    getAdminSession()
  ]);

  // Filter employees based on position if user is Admin Absensi
  const filteredEmployeesForPage = user?.role === 'Admin Absensi' && user.positionName 
    ? employees.filter(emp => emp.position === user.positionName)
    : employees;
  
  const employeesWithPositionDetails = filteredEmployeesForPage.map(emp => {
      const positionDetails = positions.find(p => p.name === emp.position);
      return { ...emp, positionDetails };
  });

  // Fetch initial attendance for the current month, filtering by site if applicable
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const initialAttendance = await getAttendanceByPeriod(currentPeriod, { siteId: userSiteId });


  return (
    <AttendanceClientPage
      employees={employeesWithPositionDetails}
      initialAttendance={initialAttendance}
      settings={settings}
    />
  );
}
