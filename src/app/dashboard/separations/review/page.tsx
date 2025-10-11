
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import ReviewSeparationsClientPage from './client-page';
import { getEmployees } from '@/actions/employees';
import type { Employee } from '@/lib/types';


export default async function ReviewSeparationsPage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'HR')) {
    redirect('/dashboard');
  }

  const allEmployees = await getEmployees();
  
  const pendingPhkEmployees = allEmployees.filter(
    (emp) => emp.employeeStatus === 'Pending PHK Approval'
  );

  return <ReviewSeparationsClientPage initialEmployees={pendingPhkEmployees} />;
}
