
import { getAllDriverAttendance } from '@/actions/driver';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import DriverAttendanceClientPage from './client-page';
import type { DriverAttendance } from '@/lib/types';

export default async function DriverAttendanceRecapPage() {
  const user = await getAdminSession();
  if (!user || user.role !== 'Administrator') {
    redirect('/dashboard');
  }

  const attendanceRecords = await getAllDriverAttendance();

  // Serialize date objects
  const serializedRecords: DriverAttendance[] = attendanceRecords.map(rec => ({
    ...rec,
    timestamp: rec.timestamp.toISOString() as any,
  }));

  return <DriverAttendanceClientPage initialRecords={serializedRecords} />;
}
