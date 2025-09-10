import { getFinanceRecords } from '@/actions/finance';
import { getSites } from '@/actions/sites';
import FinanceClientPage from './client-page';

export default async function FinancePage() {
  const [initialRecords, projects] = await Promise.all([
    getFinanceRecords(),
    getSites(),
  ]);

  return <FinanceClientPage initialRecords={initialRecords} projects={projects} />;
}
