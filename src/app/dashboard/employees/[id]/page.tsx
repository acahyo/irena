import { getEmployee } from '@/actions/employees';
import { getLeaveRequestsByEmployeeId } from '@/actions/leave';
import { notFound } from 'next/navigation';
import EmployeeProfileClientPage from './client-page';
import { format, parseISO } from 'date-fns';
import { getPositions } from '@/actions/positions';
import type { EmployeeWithPosition, Position, LeaveRequest } from '@/lib/types';


export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const employeeData = await getEmployee(params.id);

  if (!employeeData) {
    notFound();
  }

  const [leaveHistoryData, allPositions] = await Promise.all([
    getLeaveRequestsByEmployeeId(params.id),
    getPositions(),
  ]);
  
  const positionDetails: Position[] = (employeeData.positions || [])
    .map(posName => allPositions.find(p => p.name === posName))
    .filter((p): p is Position => !!p);

  // Pass raw date objects or ISO strings to the client component
  const employee: EmployeeWithPosition = {
    ...employeeData,
    positionDetails: positionDetails,
    leaveHistory: leaveHistoryData.map(req => ({
      ...req,
      startDate: req.startDate, // Pass as is
      endDate: req.endDate,     // Pass as is
    })) as LeaveRequest[],
  };

  return <EmployeeProfileClientPage employee={employee} />;
}
