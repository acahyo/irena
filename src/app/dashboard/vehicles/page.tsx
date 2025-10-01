import { getVehicles } from '@/actions/vehicles';
import VehiclesClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getP2hReports, getUnitConditionReports } from '@/actions/driver';
import type { P2hReport, UnitConditionReport } from '@/lib/types';


export default async function VehiclesPage() {
    const user = await getAdminSession();
    if (!user || (user.role !== 'Administrator' && user.role !== 'Purchasing')) {
        // Example authorization, adjust as needed
        redirect('/dashboard');
    }
    
    const [vehicles, p2hReports, unitConditionReports] = await Promise.all([
        getVehicles(),
        getP2hReports(),
        getUnitConditionReports()
    ]);
    
    // Serialize date objects to strings
    const serializedP2h: P2hReport[] = p2hReports.map(r => ({ ...r, timestamp: (r.timestamp as Date).toISOString() as any }));
    const serializedCondition: UnitConditionReport[] = unitConditionReports.map(r => ({ ...r, timestamp: (r.timestamp as Date).toISOString() as any }));


    return <VehiclesClientPage 
                initialVehicles={vehicles} 
                initialP2hReports={serializedP2h}
                initialConditionReports={serializedCondition}
            />;
}
