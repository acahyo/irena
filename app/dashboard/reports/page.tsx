
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import ReportsClientPage from './client-page';
import { getEmployees } from '@/actions/employees';
import { getPayrollHistoryByPeriod } from '@/actions/payroll';
import { getPaymentRequests } from '@/actions/payment-requests';
import { getPurchaseRequests } from '@/actions/purchasing';

export default async function ReportsPage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'Finance' && user.role !== 'HR')) {
    redirect('/dashboard');
  }

  // Fetch all data required for reports
  const [employees, payrollHistory, paymentRequests, purchaseRequests] = await Promise.all([
    getEmployees(),
    getPayrollHistoryByPeriod(new Date().toISOString().slice(0, 7)), // Fetch for current month initially
    getPaymentRequests({}),
    getPurchaseRequests({}),
  ]);

  return (
    <ReportsClientPage
      employees={employees}
      payrollHistory={payrollHistory}
      paymentRequests={paymentRequests}
      purchaseRequests={purchaseRequests}
    />
  );
}
