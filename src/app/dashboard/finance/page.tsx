import { getFinanceRecords } from '@/actions/finance';
import { getPaymentRequests } from '@/actions/payment-requests';
import { getPurchaseRequests } from '@/actions/purchasing';
import FinanceClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import type { PaymentRequest, PurchaseRequest } from '@/lib/types';

type ApprovalItem = (PaymentRequest & { type: 'payment' }) | (PurchaseRequest & { type: 'purchase' });

export default async function FinancePage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'Finance')) {
    redirect('/dashboard');
  }

  // Fetch pending payment requests for approval
  const [pendingPaymentRequests, verifiedPurchaseRequests, financeLog] = await Promise.all([
    getPaymentRequests({ status: 'Pending' }),
    getPurchaseRequests({ status: 'Verified' }),
    getFinanceRecords({}),
  ]);

  const approvals: ApprovalItem[] = [
    ...pendingPaymentRequests.map(req => ({ ...req, type: 'payment' as const })),
    ...verifiedPurchaseRequests.map(req => ({ ...req, type: 'purchase' as const })),
  ];


  return <FinanceClientPage pendingApprovals={approvals} financeLog={financeLog} />;
}
