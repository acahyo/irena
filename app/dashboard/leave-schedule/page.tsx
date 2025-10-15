

import { getLeaveRequests } from '@/actions/leave';
import LeaveScheduleClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function LeaveSchedulePage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }
  
  // For Admin Proyek, filter requests by their assigned sites.
  // For other roles like HR/Admin, siteIds will be undefined, fetching all requests.
  const siteIdsForFilter = user.role === 'Admin Proyek' ? user.siteIds : undefined;

  const initialRequests = await getLeaveRequests({ siteIds: siteIdsForFilter });

  return <LeaveScheduleClientPage initialRequests={initialRequests} />;
}
