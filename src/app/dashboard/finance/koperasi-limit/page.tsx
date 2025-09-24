import { getEmployees } from '@/actions/employees';
import KoperasiLimitClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';


export default async function KoperasiLimitPage() {
    const user = await getAdminSession();
    if (!user || (user.role !== 'Administrator' && user.role !== 'Finance')) {
        redirect('/dashboard');
    }

    const employees = await getEmployees();
    return <KoperasiLimitClientPage initialEmployees={employees} />;
}
