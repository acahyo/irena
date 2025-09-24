import { getEmployeeSession } from '@/actions/auth';
import { getKoperasiItems, getKoperasiOrders } from '@/actions/koperasi';
import { notFound, redirect } from 'next/navigation';
import KoperasiClientPage from './client-page';

export default async function KoperasiPage() {
    const session = await getEmployeeSession();
    if (!session) {
        redirect('/login/employee');
    }

    const [items, orders] = await Promise.all([
        getKoperasiItems(),
        getKoperasiOrders({ employeeId: session.id }),
    ]);

    return <KoperasiClientPage employee={session} initialItems={items} initialOrders={orders} />;
}
