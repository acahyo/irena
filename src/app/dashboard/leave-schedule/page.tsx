
import { getLeaveRequests } from '@/actions/leave';
import LeaveScheduleClientPage from './client-page';
import type { User } from '@/lib/types';

export default async function LeaveSchedulePage({ user, userSiteIds }: { user: User, userSiteIds?: string[] }) {
  // For leave schedule, filtering by the first siteId is a reasonable default for multi-project admins.
  // A more complex UI could allow switching, but for now, this works.
  // HR should see all requests.
  const siteIdForFilter = user.role === 'Admin Proyek' && userSiteIds ? userSiteIds[0] : undefined;

  const initialRequests = await getLeaveRequests({ siteId: siteIdForFilter });

  return <LeaveScheduleClientPage initialRequests={initialRequests} user={user} />;
}
