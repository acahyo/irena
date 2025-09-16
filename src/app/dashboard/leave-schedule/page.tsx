import { getLeaveRequests } from '@/actions/leave';
import LeaveScheduleClientPage from './client-page';

export default async function LeaveSchedulePage({ userSiteId }: { userSiteId?: string }) {
  const initialRequests = await getLeaveRequests({ siteId: userSiteId });

  return <LeaveScheduleClientPage initialRequests={initialRequests} />;
}
