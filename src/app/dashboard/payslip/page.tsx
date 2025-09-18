
import { getEmployees } from '@/actions/employees';
import PayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import { getAttendanceByPeriod } from '@/actions/attendance';
import type { EmployeeWithPosition, AttendanceRecord } from '@/lib/types';
import { getDepartments } from '@/actions/departments';


export default async function PayslipPage({ userSiteId }: { userSiteId?: string }) {
  const [employees, settings, positions, departments] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getSettings(),
    getPositions(),
    getDepartments()
  ]);

  const employeesWithDetails: EmployeeWithPosition[] = employees.map(emp => {
      const positionDetails = positions.find(p => p.name === emp.position);
      return { ...emp, positionDetails };
  });
  
  // Also pre-fetch attendance for the current month
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const attendanceRecordsData = await getAttendanceByPeriod(currentPeriod, { siteId: userSiteId });
  
  // Convert Date objects to strings
  const attendanceRecords = attendanceRecordsData.map(record => ({
    ...record,
    date: record.date ? record.date.toString() : new Date().toString(),
  })) as AttendanceRecord[];


  return (
    <PayslipClientPage
      initialEmployees={employeesWithDetails}
      settings={settings}
      initialAttendance={attendanceRecords}
      departments={departments}
    />
  );
}
