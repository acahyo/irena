
import { getLeaveRequestsByEmployeeId } from '@/actions/leave';
import MyLeaveClientPage from './client-page';
import { getEmployeeSession } from '@/actions/auth';
import { getSettings } from '@/actions/settings';
import { notFound, redirect } from 'next/navigation';
import { getEmployee } from '@/actions/employees';

export default async function MyLeavePage() {
  const [session, settings] = await Promise.all([getEmployeeSession(), getSettings()]);

  if (!session?.id) {
    redirect('/');
  }

  const [initialRequests, employee] = await Promise.all([
    getLeaveRequestsByEmployeeId(session.id),
    getEmployee(session.id),
  ]);

  if (!employee) {
      notFound();
  }

  return <MyLeaveClientPage initialRequests={initialRequests} employee={employee} settings={settings} />;
}
