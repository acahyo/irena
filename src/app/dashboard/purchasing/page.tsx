import { getPurchaseRequests } from '@/actions/purchasing';
import { getSites } from '@/actions/sites';
import { getRoles } from '@/actions/roles';
import PurchasingClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function PurchasingPage({ userSiteId }: { userSiteId?: string }) {
    const user = await getAdminSession();
    if (!user) {
        redirect('/');
    }

    const [requests, sites, roles] = await Promise.all([
        getPurchaseRequests({ siteId: userSiteId }),
        getSites(),
        getRoles()
    ]);
    
    const userRole = roles.find(r => r.name === user.role);

    return (
        <PurchasingClientPage 
            initialRequests={requests} 
            sites={sites} 
            userRole={userRole?.name || ''}
        />
    );
}
