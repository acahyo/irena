

import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getWarehouseItems } from '@/actions/warehouse';
import WarehouseClientPage from './client-page';
import { getPurchaseRequests } from '@/actions/purchasing';
import { getAllFuelRequests } from '@/actions/fuel';
import type { PurchaseRequest } from '@/lib/types';


export default async function WarehousePage() {
    const user = await getAdminSession();
    // Example authorization, adjust roles as needed
    if (!user || (user.role !== 'Administrator' && user.role !== 'Purchasing' && user.role !== 'Finance')) {
        redirect('/dashboard');
    }

    const [items, purchaseRequests, fuelRequests] = await Promise.all([
        getWarehouseItems(),
        getPurchaseRequests({ status: 'Approved by Purchasing' }),
        getAllFuelRequests(),
    ]);

    // Filter fuel requests that were approved from stock
    const solarStockOutRequests: PurchaseRequest[] = fuelRequests
        .filter(req => req.isFromStock === true)
        .map(req => ({
            id: req.id,
            requestDate: req.requestDate,
            projectName: `Pengisian BBM: ${req.vehicleId}`,
            requesterName: req.driverName,
            requesterId: req.driverId,
            projectId: '', // Fuel requests don't have projectId
            status: 'Approved by Purchasing',
            items: [{
                name: 'Solar',
                quantity: req.liters,
                price: items.find(i => i.name.toLowerCase() === 'solar')?.price || 0,
            }]
        }));
    
    const allStockOutRequests = [...purchaseRequests, ...solarStockOutRequests];


    return <WarehouseClientPage 
              initialItems={items} 
              stockOutRequests={allStockOutRequests}
           />;
}
