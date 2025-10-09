
import { getViolationRecords } from '@/actions/violations';
import ViolationsClientPage from './client-page';
import { getEmployees } from '@/actions/employees';
import { getSites } from '@/actions/sites';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { ViolationRecord } from '@/lib/types';

export default async function ViolationsPage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'HR' && user.role !== 'HSE')) {
    redirect('/dashboard');
  }

  const [records, employees, sites] = await Promise.all([
    getViolationRecords(),
    getEmployees(),
    getSites(),
  ]);

  const serializedRecords: ViolationRecord[] = records.map(rec => ({
    ...rec,
    date: (rec.date as Date).toISOString(),
  }));

  return <ViolationsClientPage initialRecords={serializedRecords} employees={employees} sites={sites} />;
}
