

import { getPurchaseRequests } from '@/actions/purchasing';
import { getSites } from '@/actions/sites';
import PurchasingClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import type { User, PurchaseRequest } from '@/lib/types';

export default async function PurchasingPage() {
    const sessionUser = await getAdminSession();
    if (!sessionUser) {
        redirect('/');
    }

    // Purchasing and Admin can see all requests. Admin Proyek can only see their own.
    const isFullAccess = sessionUser.role === 'Purchasing' || sessionUser.role === 'Administrator';
    const siteIdForFilter = !isFullAccess ? sessionUser.siteIds?.[0] : undefined;


    const [requests, sites] = await Promise.all([
        getPurchaseRequests({ siteId: siteIdForFilter }),
        getSites(),
    ]);
    
    return (
        <PurchasingClientPage 
            initialRequests={requests} 
            sites={sites} 
        />
    );
}
