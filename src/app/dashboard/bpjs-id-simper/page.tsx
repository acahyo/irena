import { getEmployees } from '@/actions/employees';
import BpjsIdSimperClientPage from './client-page';
import { getSites } from '@/actions/sites';
import { getPositions } from '@/actions/positions';

export default async function BpjsIdSimperPage({ userSiteId }: { userSiteId?: string }) {
  const [employees, sites, positions] = await Promise.all([
      getEmployees({ siteId: userSiteId }),
      getSites(),
      getPositions(),
  ]);

  return <BpjsIdSimperClientPage employees={employees} sites={sites} positions={positions} />;
}
