

import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import SeparationsClientPage from './client-page';
import { getEmployees } from '@/actions/employees';
import { getSites } from '@/actions/sites';
import type { Employee, Site } from '@/lib/types';


export default async function SeparationsPage() {
    const user = await getAdminSession();
    if (!user) {
        redirect('/');
    }

    const hasAccess = ['Administrator', 'HR', 'Admin Proyek', 'Disipliner'].includes(user.role);
    if (!hasAccess) {
        redirect('/dashboard');
    }

    const siteIds = user.role === 'Admin Proyek' ? user.siteIds : undefined;

    const [employees, allSites] = await Promise.all([
        getEmployees({ siteIds }),
        getSites()
    ]);
    
    const relevantSites = user.role === 'Admin Proyek' && user.siteIds 
        ? allSites.filter(site => user.siteIds?.includes(site.id))
        : allSites;
    
    return <SeparationsClientPage initialEmployees={employees} sites={relevantSites} />;
}
