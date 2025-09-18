import { getEmployees } from '@/actions/employees';
import PayslipCollectiveClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import { getAttendanceByPeriod } from '@/actions/attendance';
import type { EmployeeWithPosition, AttendanceRecord } from '@/lib/types';


export default async function PayslipCollectivePage({ userSiteId }: { userSiteId?: string }) {
  const [employees, settings, positions] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getSettings(),
    getPositions()
  ]);

  const employeesWithDetails: EmployeeWithPosition[] = employees.map(emp => {
      const positionDetails = positions.find(p => p.name === emp.position);
      return { ...emp, positionDetails };
  });
  
  // We can pre-fetch attendance for the current month, 
  // but the client will fetch again if the period changes.
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const attendanceRecords = await getAttendanceByPeriod(currentPeriod, { siteId: userSiteId });


  return (
    <PayslipCollectiveClientPage
      initialEmployees={employeesWithDetails}
      settings={settings}
      initialAttendance={attendanceRecords}
    />
  );
}
