
import { getViolationRecords } from '@/actions/violations';
import ViolationsClientPage from './client-page';
import { getEmployees } from '@/actions/employees';
import { getSites } from '@/actions/sites';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { ViolationRecord } from '@/lib/types';
import { addMonths, differenceInDays } from 'date-fns';

export default async function ViolationsPage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'HR' && user.role !== 'HSE' && user.role !== 'Disipliner')) {
    redirect('/dashboard');
  }

  const [records, employees, sites] = await Promise.all([
    getViolationRecords(),
    getEmployees(),
    getSites(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const serializedRecords: ViolationRecord[] = records.map(rec => {
    const violationDate = new Date(rec.date);
    const expiryDate = addMonths(violationDate, 6);
    const expiresInDays = differenceInDays(expiryDate, today);

    return {
      ...rec,
      date: (rec.date as Date).toISOString(),
      expiresInDays: expiresInDays > 0 ? expiresInDays : 0,
    };
  });

  return <ViolationsClientPage initialRecords={serializedRecords} employees={employees} sites={sites} />;
}
