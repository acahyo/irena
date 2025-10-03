
import { getFinanceRecords } from '@/actions/finance';
import { getSites } from '@/actions/sites';
import FinanceClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function FinancePage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }

  const userSiteId = (user.role === 'Admin Proyek') ? user.siteIds?.[0] : undefined;

  const [initialRecords, projects] = await Promise.all([
    getFinanceRecords({ siteId: userSiteId }),
    getSites(),
  ]);

  return <FinanceClientPage initialRecords={initialRecords} projects={projects} />;
}
