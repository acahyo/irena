

import { getPurchaseRequests } from '@/actions/purchasing';
import { getSites } from '@/actions/sites';
import PurchasingClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';

export default async function PurchasingPage() {
    const sessionUser = await getAdminSession();
    if (!sessionUser) {
        redirect('/');
    }

    const [requests, sites] = await Promise.all([
        getPurchaseRequests({}), // Fetch all, filtering is done on client for this role
        getSites(),
    ]);
    
    // If Admin Proyek, filter requests for their sites
    const finalRequests = (sessionUser.role === 'Admin Proyek' && sessionUser.siteIds)
        ? requests.filter(req => sessionUser.siteIds!.includes(req.projectId))
        : requests;

    return (
        <PurchasingClientPage 
            initialRequests={finalRequests} 
            sites={sites} 
        />
    );
}
