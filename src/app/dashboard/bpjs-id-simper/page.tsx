
import { getEmployees } from '@/actions/employees';
import BpjsIdSimperClientPage from './client-page';
import { getSites } from '@/actions/sites';
import { getPositions } from '@/actions/positions';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function BpjsIdSimperPage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }
  
  const siteIdForFilter = (user.role === 'Administrator' || user.role === 'HR') ? undefined : user.siteIds?.[0];

  const [employees, sites, positions] = await Promise.all([
      getEmployees({ siteId: siteIdForFilter }),
      getSites(),
      getPositions(),
  ]);

  return <BpjsIdSimperClientPage employees={employees} sites={sites} positions={positions} />;
}
