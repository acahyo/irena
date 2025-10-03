import { getEmployee } from '@/actions/employees';
import { getLeaveRequestsByEmployeeId } from '@/actions/leave';
import { notFound, redirect } from 'next/navigation';
import EmployeeProfileClientPage from '@/app/dashboard/employees/[id]/client-page';
import { getPositions } from '@/actions/positions';
import type { EmployeeWithPosition, LeaveRequest } from '@/lib/types';
import { getEmployeeSession } from '@/actions/auth';


export default async function MyProfilePage() {
  const session = await getEmployeeSession();

  if (!session?.id) {
    redirect('/');
  }

  const employeeData = await getEmployee(session.id);

  if (!employeeData) {
    notFound();
  }

  const [leaveHistoryData, positions] = await Promise.all([
    getLeaveRequestsByEmployeeId(session.id),
    getPositions(),
  ]);

  const positionDetails = (employeeData.positions || [])
    .map(posName => positions.find(p => p.name === posName))
    .filter(Boolean);

  const employee: EmployeeWithPosition = {
    ...employeeData,
    positionDetails,
    leaveHistory: leaveHistoryData as LeaveRequest[],
  };

  return <EmployeeProfileClientPage employee={employee} isPortalView={true} />;
}
