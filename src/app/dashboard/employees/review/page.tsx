import { getEmployees } from '@/actions/employees';
import ReviewEmployeesClientPage from './client-page';
import type { Employee } from '@/lib/types';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function ReviewEmployeesPage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'HR')) {
    // Optional: Redirect if user is not authorized to review
    // redirect('/dashboard');
  }

  const allEmployees = await getEmployees();
  const pendingEmployees = allEmployees.filter(
    (emp) => emp.employeeStatus === 'pending'
  );

  return <ReviewEmployeesClientPage pendingEmployees={pendingEmployees} />;
}
