

import { getLeaveRequests } from '@/actions/leave';
import LeaveScheduleClientPage from './client-page';
import type { User } from '@/lib/types';

export default async function LeaveSchedulePage({ user }: { user: User }) {
  // For leave schedule, filtering by the first siteId is a reasonable default for multi-project admins.
  // HR and Admins should see all requests.
  const siteIdForFilter = (user.role === 'Admin Proyek' && user.siteIds) ? user.siteIds[0] : undefined;

  const initialRequests = await getLeaveRequests({ siteId: siteIdForFilter });

  return <LeaveScheduleClientPage initialRequests={initialRequests} />;
}
