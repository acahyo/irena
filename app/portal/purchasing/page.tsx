import { getEmployeeSession } from '@/actions/auth';
import { getPurchaseRequestsByEmployee } from '@/actions/purchasing';
import { getSites } from '@/actions/sites';
import { notFound, redirect } from 'next/navigation';
import MyPurchasingClientPage from './client-page';

export default async function MyPurchasingPage() {
  const session = await getEmployeeSession();
  if (!session?.id || !session.siteLocation) {
    // If user is not a project PIC or doesn't have a site, they can't make requests
    // You might want to redirect them or show a message.
    // For now, let's assume only PICs with assigned projects can access this.
    return (
        <div className="flex justify-center items-center h-64">
            <p className="text-destructive">Hanya PIC Proyek yang dapat mengakses halaman ini.</p>
        </div>
    )
  }

  const [requests, sites] = await Promise.all([
    getPurchaseRequestsByEmployee(session.id),
    getSites(),
  ]);

  const userSite = sites.find(s => s.name === session.siteLocation);
  
  if (!userSite) {
       return (
        <div className="flex justify-center items-center h-64">
            <p className="text-destructive">Proyek Anda tidak ditemukan. Hubungi Administrator.</p>
        </div>
    )
  }

  return (
    <MyPurchasingClientPage
      initialRequests={requests}
      employee={session}
      site={userSite}
    />
  );
}
