import { getKoperasiItems } from '@/actions/koperasi';
import KoperasiItemsClientPage from './client-page';
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';


export default async function KoperasiItemsPage() {
    const user = await getAdminSession();
    if (!user || (user.role !== 'Administrator' && user.role !== 'Purchasing')) {
        redirect('/dashboard');
    }
    
    const items = await getKoperasiItems();
    return <KoperasiItemsClientPage initialItems={items} />;
}
