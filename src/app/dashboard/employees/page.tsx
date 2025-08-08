
import { getEmployees } from '@/actions/employees';
import { getLeaveRequests } from '@/actions/leave';
import EmployeeDirectoryClientPage from './client-page';

export default async function EmployeeDirectoryPage() {
  const [fetchedEmployees, leaveRequests] = await Promise.all([
      getEmployees(),
      getLeaveRequests(),
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
      onLeave: approvedLeave.some((req) => req.employeeId === emp.id),
    }));

  return <EmployeeDirectoryClientPage initialEmployees={employeesWithLeaveStatus} />;
}
