
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getWarehouseItems } from '@/actions/warehouse';
import WarehouseClientPage from './client-page';

export default async function WarehousePage() {
    const user = await getAdminSession();
    // Example authorization, adjust roles as needed
    if (!user || (user.role !== 'Administrator' && user.role !== 'Purchasing')) {
        redirect('/dashboard');
    }

    const items = await getWarehouseItems();

    return <WarehouseClientPage initialItems={items} />;
}
