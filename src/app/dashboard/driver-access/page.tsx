
import { getEmployees } from '@/actions/employees';
import DriverAccessClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function DriverAccessPage() {
    const user = await getAdminSession();
    if (!user || (user.role !== 'Administrator' && user.role !== 'HR')) {
        redirect('/dashboard');
    }

    const employees = await getEmployees();
    
    return <DriverAccessClientPage initialEmployees={employees} />;
}
