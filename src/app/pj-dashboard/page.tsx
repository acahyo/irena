
import { getEmployeeSession } from '@/actions/auth';
import { notFound, redirect } from 'next/navigation';
import PjDashboardClient from './client-page';
import { getPjAttendanceHistory } from '@/actions/pj';
import type { PjAttendance } from '@/lib/types';


export default async function PjDashboardPage() {
    const employee = await getEmployeeSession();

    if (!employee) {
        // Assuming a login page exists or will be created at /login/pj
        // For now, redirecting to employee login as a fallback.
        redirect('/login/employee');
    }

    // A check to ensure the employee has the correct role, e.g., 'PJ'
    if (!employee.positions?.includes('PJ')) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-destructive">Akses ditolak. Anda bukan Penanggung Jawab (PJ).</p>
            </div>
        )
    }

    const attendanceHistory = await getPjAttendanceHistory(employee.id);

    // Convert Date objects to strings to avoid serialization issues
    const serializedHistory: PjAttendance[] = attendanceHistory.map(rec => ({
        ...rec,
        timestamp: rec.timestamp.toISOString() as any,
    }));


    return <PjDashboardClient employee={employee} initialHistory={serializedHistory} />;
}
