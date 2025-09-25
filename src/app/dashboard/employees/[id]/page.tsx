import { getEmployee } from '@/actions/employees';
import { getLeaveRequestsByEmployeeId } from '@/actions/leave';
import { notFound } from 'next/navigation';
import EmployeeProfileClientPage from './client-page';
import { format, parseISO } from 'date-fns';
import { getPositions } from '@/actions/positions';
import type { EmployeeWithPosition, Position } from '@/lib/types';


// Helper to safely format dates that might be strings or Date objects
const formatDate = (date: string | Date | undefined): string | undefined => {
  if (!date) return undefined;
  // Firestore Timestamps are often serialized as ISO strings
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  try {
    return format(dateObj, 'PPP');
  } catch (error) {
    console.error("Invalid date format:", date);
    return 'Invalid Date';
  }
};

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


  // Pre-format dates on the server before sending to the client component
  const employee: EmployeeWithPosition = {
    ...employeeData,
    positionDetails: positionDetails,
    dateOfBirth: formatDate(employeeData.dateOfBirth),
    messEntryDate: formatDate(employeeData.messEntryDate),
    contractStartDate: formatDate(employeeData.contractStartDate),
    contractEndDate: formatDate(employeeData.contractEndDate),
    leaveHistory: leaveHistoryData.map(req => ({
        ...req,
        startDate: formatDate(req.startDate) as any,
        endDate: formatDate(req.endDate) as any,
    }))
  };


  return <EmployeeProfileClientPage employee={employee} />;
}
