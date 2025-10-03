

import { getLeaveRequests } from '@/actions/leave';
import LeaveScheduleClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function LeaveSchedulePage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }
  // For leave schedule, filtering by the first siteId is a reasonable default for multi-project admins.
  // HR and Admins should see all requests.
  const siteIdForFilter = (user.role === 'Admin Proyek' && user.siteIds) ? user.siteIds[0] : undefined;

  const initialRequests = await getLeaveRequests({ siteId: siteIdForFilter });

  return <LeaveScheduleClientPage initialRequests={initialRequests} />;
}
