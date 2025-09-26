

import { getEmployees } from '@/actions/employees';
import KoperasiLimitClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getPositions } from '@/actions/positions';
import { getSites } from '@/actions/sites';


export default async function KoperasiLimitPage() {
    const user = await getAdminSession();
    if (!user || (user.role !== 'Administrator' && user.role !== 'Finance')) {
        redirect('/dashboard');
    }

    const [employees, positions, sites] = await Promise.all([
        getEmployees(),
        getPositions(),
        getSites()
    ]);
    
    return <KoperasiLimitClientPage initialEmployees={employees} positions={positions} sites={sites} />;
}

