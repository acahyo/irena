import { getEmployeeSession } from '@/actions/auth';
import { notFound, redirect } from 'next/navigation';
import DriverDashboardClient from './client-page';

export default async function DriverDashboardPage() {
    const employee = await getEmployeeSession();

    if (!employee) {
        redirect('/login/driver');
    }

    // You could add a check here to ensure the employee has the correct role
    if (employee.role !== 'Driver LV Office') {
        // Maybe redirect to the regular employee portal?
        // Or just show an error.
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-destructive">Akses ditolak. Anda bukan Driver.</p>
            </div>
        )
    }

    return <DriverDashboardClient employee={employee} />;
}
