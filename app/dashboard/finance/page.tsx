
import { getPaymentRequests } from '@/actions/payment-requests';
import { getPurchaseRequests } from '@/actions/purchasing';
import FinanceClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import type { PaymentRequest, PurchaseRequest, Site } from '@/lib/types';
import { getSites } from '@/actions/sites';

export default async function FinancePage() {
  const user = await getAdminSession();
  if (!user || (user.role !== 'Administrator' && user.role !== 'Finance')) {
    redirect('/dashboard');
  }

  const [paymentRequests, purchaseRequests, sites] = await Promise.all([
    getPaymentRequests({}),
    getPurchaseRequests({}),
    getSites(),
  ]);

  return <FinanceClientPage paymentRequests={paymentRequests} purchaseRequests={purchaseRequests} sites={sites} />;
}
