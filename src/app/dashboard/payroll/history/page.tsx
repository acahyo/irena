import PayrollHistoryClientPage from './client-page';
import { getPayrollHistoryByPeriod } from '@/actions/payroll';
import { getSites } from '@/actions/sites';

export default async function PayrollHistoryPage() {

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const initialHistory = await getPayrollHistoryByPeriod(currentPeriod);
  
  return (
    <PayrollHistoryClientPage
      initialHistory={initialHistory}
    />
  );
}
