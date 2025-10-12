import { getEmployees } from '@/actions/employees';
import ReviewEmployeesClientPage from './client-page';
import type { Employee } from '@/lib/types';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getSites } from '@/actions/sites';

export default async function ReviewEmployeesPage() {
  const user = await getAdminSession();
  if (!user || !['Administrator', 'HR'].includes(user.role)) {
    redirect('/dashboard');
  }

  const [allEmployees, sites] = await Promise.all([
    getEmployees(),
    getSites()
  ]);

  const pendingEmployees = allEmployees.filter(
    (emp) => emp.employeeStatus === 'pending'
  );

  return <ReviewEmployeesClientPage pendingEmployees={pendingEmployees} sites={sites} />;
}
