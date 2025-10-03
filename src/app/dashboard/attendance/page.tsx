
import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import AttendanceClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getSettings } from '@/actions/settings';
import type { AttendanceRecord, EmployeeWithPosition, Position, Site } from '@/lib/types';
import { getAdminSession } from '@/actions/auth';
import { getSitesByIds } from '@/actions/sites';

export default async function AttendancePage({ userSiteIds, searchParams }: { userSiteIds?: string[], searchParams?: { projectId?: string } }) {
  const [settings, user] = await Promise.all([
    getSettings(),
    getAdminSession()
  ]);

  let assignedSites: Site[] | undefined = undefined;
  if(user?.role === 'Admin Proyek' && userSiteIds && userSiteIds.length > 0) {
    assignedSites = await getSitesByIds(userSiteIds);
  }

  const projectId = searchParams?.projectId;
  const employeeSiteIds = projectId && projectId !== 'all' ? [projectId] : userSiteIds;

  const [employees, positions] = await Promise.all([
    getEmployees({ siteIds: employeeSiteIds }),
    getPositions(),
  ]);

  // Filter employees based on position if user is Admin Absensi
  const filteredEmployeesForPage = user?.role === 'Admin Absensi' && user.positionName 
    ? employees.filter(emp => emp.positions?.includes(user.positionName!))
    : employees;
  
  const employeesWithPositionDetails: EmployeeWithPosition[] = filteredEmployeesForPage.map(emp => {
      const positionDetails: Position[] = (emp.positions || [])
        .map(posName => positions.find(p => p.name === posName))
        .filter((p): p is Position => !!p);
      return { ...emp, positionDetails };
  });

  // Fetch initial attendance for the current month, filtering by site if applicable
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const employeeIdsToFetch = employeesWithPositionDetails.map(e => e.id);
  
  const allAttendanceForPeriod = await getAttendanceByPeriod(currentPeriod);
  const initialAttendance = allAttendanceForPeriod.filter(att => employeeIdsToFetch.includes(att.employeeId));


  return (
    <AttendanceClientPage
      employees={employeesWithPositionDetails}
      initialAttendance={initialAttendance}
      settings={settings}
      assignedSites={assignedSites}
    />
  );
}
