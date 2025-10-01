import { getEmployees } from '@/actions/employees';
import PjAccessClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function PjAccessPage() {
    const user = await getAdminSession();
    if (!user || user.role !== 'Administrator') {
        redirect('/dashboard');
    }

    const employees = await getEmployees();
    
    return <PjAccessClientPage initialEmployees={employees} />;
}
