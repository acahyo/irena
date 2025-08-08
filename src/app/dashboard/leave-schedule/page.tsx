
import { getLeaveRequests } from '@/actions/leave';
import LeaveScheduleClientPage from './client-page';

export default async function LeaveSchedulePage() {
  const initialRequests = await getLeaveRequests();

  return <LeaveScheduleClientPage initialRequests={initialRequests} />;
}
