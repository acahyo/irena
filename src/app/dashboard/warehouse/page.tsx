

import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getWarehouseItems } from '@/actions/warehouse';
import WarehouseClientPage from './client-page';
import { getPurchaseRequests } from '@/actions/purchasing';

export default async function WarehousePage() {
    const user = await getAdminSession();
    // Example authorization, adjust roles as needed
    if (!user || (user.role !== 'Administrator' && user.role !== 'Purchasing' && user.role !== 'Finance')) {
        redirect('/dashboard');
    }

    const [items, stockOutRequests] = await Promise.all([
        getWarehouseItems(),
        getPurchaseRequests({ status: 'Approved by Purchasing' })
    ]);

    return <WarehouseClientPage 
              initialItems={items} 
              stockOutRequests={stockOutRequests} 
           />;
}
