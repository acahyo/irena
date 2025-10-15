

import { getEmployees } from '@/actions/employees';
import ReviewEmployeesClientPage from './client-page';
import type { EmployeeWithPosition, Position } from '@/lib/types';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getSites } from '@/actions/sites';
import { getPositions } from '@/actions/positions';
import { getLeaveRequestsByEmployeeId } from '@/actions/leave';

export default async function ReviewEmployeesPage() {
  const user = await getAdminSession();
  if (!user || !['Administrator', 'HR'].includes(user.role)) {
    redirect('/dashboard');
  }

  const [allEmployees, sites, allPositions] = await Promise.all([
    getEmployees(),
    getSites(),
    getPositions()
  ]);

  const pendingEmployees = allEmployees.filter(
    (emp) => emp.employeeStatus === 'pending'
  );
  
  const pendingEmployeesWithDetails: EmployeeWithPosition[] = await Promise.all(
    pendingEmployees.map(async (emp) => {
        const positionDetails: Position[] = (emp.positions || [])
            .map(posName => allPositions.find(p => p.name === posName))
            .filter((p): p is Position => !!p);
        
        const leaveHistory = await getLeaveRequestsByEmployeeId(emp.id);

        return {
            ...emp,
            positionDetails,
            leaveHistory,
        };
    })
  );


  return <ReviewEmployeesClientPage pendingEmployees={pendingEmployeesWithDetails} sites={sites} />;
}
