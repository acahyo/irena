
import { getEmployees } from '@/actions/employees';
import PayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import { getAttendanceByPeriod } from '@/actions/attendance';
import type { EmployeeWithPosition, AttendanceRecord } from '@/lib/types';
import { getDepartments } from '@/actions/departments';
import { getAdminSession } from '@/actions/auth';


export default async function PayslipPage({ userSiteId }: { userSiteId?: string }) {
  const [employees, settings, positions, departments, user] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getSettings(),
    getPositions(),
    getDepartments(),
    getAdminSession()
  ]);

  // Filter employees based on position if user is Admin Absensi
  const filteredEmployeesForPage = user?.role === 'Admin Absensi' && user.positionName 
    ? employees.filter(emp => emp.position === user.positionName)
    : employees;

  const employeesWithDetails: EmployeeWithPosition[] = filteredEmployeesForPage.map(emp => {
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
