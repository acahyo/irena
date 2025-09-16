import { getFinanceRecords } from '@/actions/finance';
import { getSites } from '@/actions/sites';
import FinanceClientPage from './client-page';

export default async function FinancePage({ userSiteId }: { userSiteId?: string }) {
  const [initialRecords, projects] = await Promise.all([
    getFinanceRecords({ siteId: userSiteId }),
    getSites(),
  ]);

  return <FinanceClientPage initialRecords={initialRecords} projects={projects} />;
}
