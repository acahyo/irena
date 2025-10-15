
import { getLeaveRequestsByEmployeeId } from '@/actions/leave';
import MyLeaveClientPage from './client-page';
import { getEmployeeSession } from '@/actions/auth';
import { getSettings } from '@/actions/settings';
import { notFound, redirect } from 'next/navigation';
import { getEmployee } from '@/actions/employees';
import { LeaveRequest } from '@/lib/types';


export default async function MyLeavePage() {
  const [session, settings] = await Promise.all([
      getEmployeeSession(),
      getSettings(),
  ]);

  if (!session?.id) {
    redirect('/');
  }

  const [initialRequestsData, employee] = await Promise.all([
    getLeaveRequestsByEmployeeId(session.id),
    getEmployee(session.id),
  ]);

  if (!employee) {
      notFound();
  }


  const initialRequests: LeaveRequest[] = (initialRequestsData || []).map(req => ({
      ...req,
      // Pass ISO strings to client to avoid hydration errors
      startDate: new Date(req.startDate).toISOString(),
      endDate: new Date(req.endDate).toISOString(),
  }));


  return <MyLeaveClientPage initialRequests={initialRequests} employee={employee} settings={settings} />;
}
