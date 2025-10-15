

import { getEmployees } from '@/actions/employees';
import PayslipClientPage from './client-page';
import { getSettings } from '@/actions/settings';
import { getPositions } from '@/actions/positions';
import { getAttendanceByPeriod } from '@/actions/attendance';
import type { EmployeeWithPosition, AttendanceRecord, Position, Site } from '@/lib/types';
import { getSites } from '@/actions/sites';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';


export default async function PayslipPage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }

  const userSiteIds = (user.role === 'HR' || user.role === 'Administrator') ? undefined : user.siteIds;

  const [employees, settings, positions, sites] = await Promise.all([
    getEmployees({ siteIds: userSiteIds }),
    getSettings(),
    getPositions(),
    getSites(),
  ]);

  // Filter employees based on position if user is Admin Absensi
  const filteredEmployeesForPage = user?.role === 'Admin Absensi' && user.positionName 
    ? employees.filter(emp => emp.positions?.includes(user.positionName!))
    : employees;

  const employeesWithDetails: EmployeeWithPosition[] = filteredEmployeesForPage.map(emp => {
      const positionDetails: Position[] = (emp.positions || [])
        .map(posName => positions.find(p => p.name === posName))
        .filter((p): p is Position => !!p);
      return { ...emp, positionDetails };
  });
  
  // Also pre-fetch attendance for the current month
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const attendanceRecordsData = await getAttendanceByPeriod(currentPeriod);
  
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
      sites={sites}
      positions={positions}
    />
  );
}
