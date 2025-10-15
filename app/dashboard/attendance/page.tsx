

import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import AttendanceClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import { getSettings } from '@/actions/settings';
import type { AttendanceRecord, EmployeeWithPosition, Position, Site } from '@/lib/types';
import { getAdminSession } from '@/actions/auth';
import { getSites, getSitesByIds } from '@/actions/sites';

export default async function AttendancePage({ searchParams }: { searchParams?: { projectId?: string } }) {
  const [settings, user] = await Promise.all([
    getSettings(),
    getAdminSession()
  ]);

  if (!user) {
    // This should be caught by middleware, but as a safeguard
    return null;
  }
  
  let assignedSites: Site[] = [];
  let employeeSiteFilter: string[] | undefined = undefined;

  if (user.role === 'Admin Proyek') {
    assignedSites = user.siteIds ? await getSitesByIds(user.siteIds) : [];
    employeeSiteFilter = user.siteIds;
  } else if (user.role === 'Administrator' || user.role === 'HR') {
    assignedSites = await getSites(); // Admins can filter by any site
  }
  
  const projectId = searchParams?.projectId;
  // For initial load, filter by projectId if present, otherwise default for Admin Proyek
  const initialSiteFilter = projectId || (user.role === 'Admin Proyek' ? assignedSites[0]?.id : undefined);

  const [employees, positions] = await Promise.all([
    getEmployees({ siteIds: employeeSiteFilter }),
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
  
  const initialAttendance = await getAttendanceByPeriod(currentPeriod, { siteId: initialSiteFilter });


  return (
    <AttendanceClientPage
      employees={employeesWithPositionDetails}
      initialAttendance={initialAttendance}
      settings={settings}
      assignedSites={assignedSites}
      initialProjectId={initialSiteFilter}
    />
  );
}
