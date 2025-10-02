
import { getPurchaseRequests } from '@/actions/purchasing';
import { getSites } from '@/actions/sites';
import { getRoles } from '@/actions/roles';
import PurchasingClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';

export default async function PurchasingPage({ user, userSiteIds }: { user: User, userSiteIds?: string[] }) {
    const sessionUser = await getAdminSession();
    if (!sessionUser) {
        redirect('/');
    }

    const [requests, sites, roles] = await Promise.all([
        getPurchaseRequests({}), // Fetch all, filtering is done on client for this role
        getSites(),
        getRoles()
    ]);
    
    const userRole = roles.find(r => r.name === sessionUser.role);

    // If Admin Proyek, filter requests for their sites
    const finalRequests = sessionUser.role === 'Admin Proyek' && userSiteIds
        ? requests.filter(req => userSiteIds.includes(req.projectId))
        : requests;

    return (
        <PurchasingClientPage 
            initialRequests={finalRequests} 
            sites={sites} 
            userRole={userRole?.name || ''}
            user={sessionUser}
        />
    );
}
