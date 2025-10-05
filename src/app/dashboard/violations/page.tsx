
import { getViolationRecords } from '@/actions/violations';
import ViolationsClientPage from './client-page';
import { getEmployees } from '@/actions/employees';
import { getSites } from '@/actions/sites';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function ViolationsPage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'HR')) {
    redirect('/dashboard');
  }

  const [records, employees, sites] = await Promise.all([
    getViolationRecords(),
    getEmployees(),
    getSites(),
  ]);

  return <ViolationsClientPage initialRecords={records} employees={employees} sites={sites} />;
}
