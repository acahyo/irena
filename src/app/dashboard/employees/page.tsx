

import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import EmployeeDirectoryClientPage from './client-page';
import { format, parseISO, differenceInDays, addMonths } from 'date-fns';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getViolationRecords } from '@/actions/violations';
import type { Employee } from '@/lib/types';


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


export default async function EmployeeDirectoryPage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }

  // HR and Admin see all employees, regardless of siteIds
  const siteIdsForFilter = (user.role === 'HR' || user.role === 'Administrator') ? undefined : user.siteIds;

  const [fetchedEmployees, leaveRequests, violationRecords] = await Promise.all([
      getEmployees({ siteIds: siteIdsForFilter }),
      getLeaveRequests({ siteId: siteIdsForFilter ? siteIdsForFilter[0] : undefined }),
      getViolationRecords(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedLeave = leaveRequests.filter(
      (req) =>
        req.status === 'Approved' &&
        new Date(req.startDate) <= today &&
        new Date(req.endDate) >= today
    );
    
    const employeesWithDetails: Employee[] = fetchedEmployees.map((emp) => {
        const latestViolation = violationRecords
            .filter(v => v.employeeId === emp.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            
        let violationInfo: Employee['latestViolation'] | undefined = undefined;
        if (latestViolation) {
            const violationDate = new Date(latestViolation.date);
            const expiryDate = addMonths(violationDate, 6);
            const expiresInDays = differenceInDays(expiryDate, today);

            if (expiresInDays > 0) {
                violationInfo = {
                    status: latestViolation.status,
                    date: latestViolation.date,
                    expiresInDays,
                };
            }
        }
        
        let contractWarningDays: number | undefined = undefined;
        if (emp.contractEndDate) {
            const endDate = new Date(emp.contractEndDate);
            if (endDate > today) {
                contractWarningDays = differenceInDays(endDate, today);
            }
        }
        
        return {
          ...emp,
          contractStartDate: emp.contractStartDate ? new Date(emp.contractStartDate).toISOString() : undefined,
          contractEndDate: emp.contractEndDate ? new Date(emp.contractEndDate).toISOString() : undefined,
          onLeave: approvedLeave.some((req) => req.employeeId === emp.id),
          latestViolation: violationInfo,
          contractWarningDays,
        };
    });

  return <EmployeeDirectoryClientPage initialEmployees={employeesWithDetails} />;
}

