import { getVehicles } from '@/actions/vehicles';
import VehiclesClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function VehiclesPage() {
    const user = await getAdminSession();
    if (!user || (user.role !== 'Administrator' && user.role !== 'Purchasing')) {
        // Example authorization, adjust as needed
        redirect('/dashboard');
    }
    
    const vehicles = await getVehicles();
    return <VehiclesClientPage initialVehicles={vehicles} />;
}
