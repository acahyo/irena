
import { getAllPjAttendance } from '@/actions/pj';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import PjAttendanceClientPage from './client-page';
import type { PjAttendance } from '@/lib/types';

export default async function PjAttendanceRecapPage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'HR')) {
    redirect('/dashboard');
  }

  const attendanceRecords = await getAllPjAttendance();

  // Serialize date objects
  const serializedRecords: PjAttendance[] = attendanceRecords.map(rec => ({
    ...rec,
    timestamp: rec.timestamp.toISOString() as any,
  }));

  return <PjAttendanceClientPage initialRecords={serializedRecords} />;
}
