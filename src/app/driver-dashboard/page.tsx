
import { getEmployeeSession } from '@/actions/auth';
import { notFound, redirect } from 'next/navigation';
import DriverDashboardClient from './client-page';
import { getDriverAttendanceHistory } from '@/actions/driver';
import type { DriverAttendance } from '@/lib/types';


export default async function DriverDashboardPage() {
    const employee = await getEmployeeSession();

    if (!employee) {
        redirect('/login/driver');
    }

    // You could add a check here to ensure the employee has the correct role
    if (!employee.positions?.includes('Driver LV Office')) {
        // Maybe redirect to the regular employee portal?
        // Or just show an error.
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-destructive">Akses ditolak. Anda bukan Driver.</p>
            </div>
        )
    }

    const attendanceHistory = await getDriverAttendanceHistory(employee.id);

    // Convert Date objects to strings to avoid serialization issues
    const serializedHistory: DriverAttendance[] = attendanceHistory.map(rec => ({
        ...rec,
        timestamp: rec.timestamp.toISOString() as any,
    }));


    return <DriverDashboardClient employee={employee} initialHistory={serializedHistory} />;
}

