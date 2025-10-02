
import { getLeaveRequests } from '@/actions/leave';
import LeaveScheduleClientPage from './client-page';

export default async function LeaveSchedulePage({ userSiteIds }: { userSiteIds?: string[] }) {
  // For leave schedule, filtering by the first siteId is a reasonable default for multi-project admins.
  // A more complex UI could allow switching, but for now, this works.
  const initialRequests = await getLeaveRequests({ siteId: userSiteIds ? userSiteIds[0] : undefined });

  return <LeaveScheduleClientPage initialRequests={initialRequests} />;
}
