import { getPaymentRequests } from '@/actions/payment-requests';
import { getPurchaseRequests } from '@/actions/purchasing';
import FinanceClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import type { PaymentRequest, PurchaseRequest } from '@/lib/types';

export default async function FinancePage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'Finance')) {
    redirect('/dashboard');
  }

  const [paymentRequests, purchaseRequests] = await Promise.all([
    getPaymentRequests({}),
    getPurchaseRequests({}),
  ]);

  return <FinanceClientPage paymentRequests={paymentRequests} purchaseRequests={purchaseRequests} />;
}
