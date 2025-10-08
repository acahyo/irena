
import { getFinanceRecords } from '@/actions/finance';
import { getPaymentRequests } from '@/actions/payment-requests';
import FinanceClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function FinancePage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'Finance')) {
    redirect('/dashboard');
  }

  // Fetch pending payment requests for approval
  const pendingRequests = await getPaymentRequests({ status: 'Pending' });

  // Fetch all finance records for the log
  const financeLog = await getFinanceRecords({});

  return <FinanceClientPage pendingRequests={pendingRequests} financeLog={financeLog} />;
}
