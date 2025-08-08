
import React from 'react';
import { notFound } from 'next/navigation';
import { users } from '@/lib/data';
import { getRoles } from '@/actions/roles';
import EditUserClientPage from './client-page';

export default async function EditUserPage({ params }: { params: { id: string } }) {
    const user = users.find((u) => u.id === params.id);

    if (!user) {
        notFound();
    }
    
    const roles = await getRoles();

    return <EditUserClientPage user={user} roles={roles} />;
}
