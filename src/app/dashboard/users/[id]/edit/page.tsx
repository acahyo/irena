import { notFound } from 'next/navigation';
import { getUser } from '@/actions/users';
import { getRoles } from '@/actions/roles';
import { getSites } from '@/actions/sites';
import EditUserClientPage from './client-page';

export default async function EditUserPage({ params }: { params: { id: string } }) {
    const user = await getUser(params.id);

    if (!user) {
        notFound();
    }
    
    const [roles, sites] = await Promise.all([
        getRoles(),
        getSites()
    ]);

    return <EditUserClientPage user={user} roles={roles} sites={sites} />;
}
