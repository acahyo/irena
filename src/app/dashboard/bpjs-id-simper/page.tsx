import { getEmployees } from '@/actions/employees';
import BpjsIdSimperClientPage from './client-page';
import { getSites } from '@/actions/sites';
import { getPositions } from '@/actions/positions';
import { User } from '@/lib/types';

export default async function BpjsIdSimperPage({ user }: { user: User }) {
  
  const siteIdForFilter = (user.role === 'Administrator' || user.role === 'HR') ? undefined : user.siteIds?.[0];

  const [employees, sites, positions] = await Promise.all([
      getEmployees({ siteId: siteIdForFilter }),
      getSites(),
      getPositions(),
  ]);

  return <BpjsIdSimperClientPage employees={employees} sites={sites} positions={positions} />;
}
