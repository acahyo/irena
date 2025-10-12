
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import EmployeeDirectoryClientPage from './client-page';
import { format, parseISO, differenceInDays, addMonths, isValid } from 'date-fns';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getViolationRecords } from '@/actions/violations';
import type { Employee } from '@/lib/types';


export default async function EmployeeDirectoryPage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }
  
  // Redirect roles that should not access this page
  if (user.role === 'Rekrutmen') {
    redirect('/dashboard/recruitment');
  }
  if (user.role === 'Admin Proyek') {
    redirect('/dashboard');
  }


  // HR and Admin see all employees, regardless of siteIds
  const siteIdsForFilter = (user.role === 'HR' || user.role === 'Administrator') ? undefined : user.siteIds;

  const [fetchedEmployees, leaveRequests, violationRecords] = await Promise.all([
      getEmployees({ siteIds: siteIdsForFilter }),
      getLeaveRequests({}),
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
        let endDate: Date | undefined;
        if (emp.contractEndDate) {
            const parsedEndDate = new Date(emp.contractEndDate);
            if (isValid(parsedEndDate)) {
                endDate = parsedEndDate;
                if (endDate > today) {
                    contractWarningDays = differenceInDays(endDate, today);
                }
            }
        }
        
        const startDate = emp.contractStartDate ? new Date(emp.contractStartDate) : undefined;

        return {
          ...emp,
          contractStartDate: startDate && isValid(startDate) ? startDate.toISOString() : undefined,
          contractEndDate: endDate && isValid(endDate) ? endDate.toISOString() : undefined,
          onLeave: approvedLeave.some((req) => req.employeeId === emp.id),
          latestViolation: violationInfo,
          contractWarningDays,
        };
    });

  return <EmployeeDirectoryClientPage initialEmployees={employeesWithDetails} />;
}
