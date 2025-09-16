import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import EmployeeDirectoryClientPage from './client-page';
import { format, parseISO } from 'date-fns';

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


export default async function EmployeeDirectoryPage({ userSiteId }: { userSiteId?: string }) {
  const [fetchedEmployees, leaveRequests] = await Promise.all([
      getEmployees({ siteId: userSiteId }),
      getLeaveRequests({ siteId: userSiteId }),
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

  return <EmployeeDirectoryClientPage initialEmployees={employeesWithLeaveStatus} />;
}
