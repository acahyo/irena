
import { notFound } from 'next/navigation';
import { getUser } from '@/actions/users';
import { getRoles } from '@/actions/roles';
import EditUserClientPage from './client-page';

export default async function EditUserPage({ params }: { params: { id: string } }) {
    const user = await getUser(params.id);

    if (!user) {
        notFound();
    }
    
    const roles = await getRoles();

    return <EditUserClientPage user={user} roles={roles} />;
}
