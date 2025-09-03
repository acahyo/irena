
import { getLeaveRequestsByEmployeeId } from '@/actions/leave';
import MyLeaveClientPage from './client-page';
import { getEmployeeSession } from '@/actions/auth';
import { getSettings } from '@/actions/settings';
import { notFound, redirect } from 'next/navigation';
import { getEmployee } from '@/actions/employees';
import { format, parseISO } from 'date-fns';
import { LeaveRequest } from '@/lib/types';


const formatDate = (date: string | Date | undefined): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  try {
    // Check if date is valid before formatting
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }
    return format(dateObj, 'PPP');
  } catch (error) {
    console.error('Invalid date format:', date);
    return 'Invalid Date';
  }
};


export default async function MyLeavePage() {
  const [session, settings] = await Promise.all([getEmployeeSession(), getSettings()]);

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

  const initialRequests: LeaveRequest[] = initialRequestsData.map(req => ({
      ...req,
      startDate: formatDate(req.startDate),
      endDate: formatDate(req.endDate),
  }));


  return <MyLeaveClientPage initialRequests={initialRequests} employee={employee} settings={settings} />;
}
