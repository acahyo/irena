
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import PaymentRequestsClientPage from './client-page';
import { getPaymentRequests } from '@/actions/payment-requests';
import type { PaymentRequest } from '@/lib/types';


export default async function PaymentRequestsPage() {
  const user = await getAdminSession();
  if (!user) {
    redirect('/');
  }

  const requests = await getPaymentRequests();

  const serializedRequests: PaymentRequest[] = requests.map(req => ({
    ...req,
    requestDate: req.requestDate.toISOString() as any,
    processedDate: req.processedDate ? (req.processedDate as Date).toISOString() as any : undefined,
  }));

  return <PaymentRequestsClientPage initialRequests={serializedRequests} />;
}
