

import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import EmployeeDirectoryClientPage from './client-page';
import { format, parseISO } from 'date-fns';
import type { User } from '@/lib/types';

const formatDate = (date: string | Date | undefined): string | undefined => {
  if (!date) return undefined;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  try {
    // Check if date is valid before formatting
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }
    return format(dateObj, 'PP');
  } catch (error) {
    console.error('Invalid date format:', date);
    return 'Invalid Date';
  }
};


export default async function EmployeeDirectoryPage({ user, userSiteIds }: { user: User, userSiteIds?: string[] }) {
  if (!user) {
    // This case should be handled by the layout, but as a safeguard:
    return <EmployeeDirectoryClientPage initialEmployees={[]} user={{ id: '', name: '', email: '', role: '' }} />;
  }

  // HR should see all employees, regardless of siteIds
  const siteIdsForFilter = user.role === 'HR' ? undefined : userSiteIds;

  const [fetchedEmployees, leaveRequests] = await Promise.all([
      getEmployees({ siteIds: siteIdsForFilter }),
      getLeaveRequests({ siteId: siteIdsForFilter ? siteIdsForFilter[0] : undefined }), // Note: Leave requests might need adjustment for multi-site
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedLeave = leaveRequests.filter(
      (req) =>
        req.status === 'Approved' &&
        new Date(req.startDate) <= today &&
        new Date(req.endDate) >= today
    );
    
    const employeesWithLeaveStatus = fetchedEmployees.map((emp) => ({
      ...emp,
      contractStartDate: formatDate(emp.contractStartDate),
      contractEndDate: formatDate(emp.contractEndDate),
      onLeave: approvedLeave.some((req) => req.employeeId === emp.id),
    }));

  return <EmployeeDirectoryClientPage initialEmployees={employeesWithLeaveStatus} user={user} />;
}
