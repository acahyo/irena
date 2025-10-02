
import { getPurchaseRequests } from '@/actions/purchasing';
import { getSites } from '@/actions/sites';
import { getRoles } from '@/actions/roles';
import PurchasingClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function PurchasingPage({ userSiteIds }: { userSiteIds?: string[] }) {
    const user = await getAdminSession();
    if (!user) {
        redirect('/');
    }

    const [requests, sites, roles] = await Promise.all([
        getPurchaseRequests({}), // Fetch all, filtering is done on client for this role
        getSites(),
        getRoles()
    ]);
    
    const userRole = roles.find(r => r.name === user.role);

    // If Admin Proyek, filter requests for their sites
    const finalRequests = user.role === 'Admin Proyek' && userSiteIds
        ? requests.filter(req => userSiteIds.includes(req.projectId))
        : requests;

    return (
        <PurchasingClientPage 
            initialRequests={finalRequests} 
            sites={sites} 
            userRole={userRole?.name || ''}
        />
    );
}
