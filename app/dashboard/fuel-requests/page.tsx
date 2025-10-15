
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import FuelRequestsClientPage from './client-page';
import { getAllFuelRequests } from '@/actions/fuel';
import type { FuelRequest } from '@/lib/types';
import { getVehicles } from '@/actions/vehicles';

export default async function FuelRequestsPage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Purchasing' && user.role !== 'Finance' && user.role !== 'Administrator')) {
    redirect('/dashboard');
  }

  const [requests, vehicles] = await Promise.all([
    getAllFuelRequests(),
    getVehicles()
  ]);

  const serializedRequests: FuelRequest[] = requests.map(req => ({
    ...req,
    requestDate: req.requestDate.toISOString() as any,
    approvedDate: req.approvedDate ? (req.approvedDate as Date).toISOString() as any : undefined,
  }));

  return <FuelRequestsClientPage initialRequests={serializedRequests} vehicles={vehicles} />;
}
