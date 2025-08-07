
import React from 'react';
import { notFound } from 'next/navigation';
import { users } from '@/lib/data';
import EditUserClientPage from './client-page';

export default function EditUserPage({ params }: { params: { id: string } }) {
    const user = users.find((u) => u.id === params.id);

    if (!user) {
        notFound();
    }

    return <EditUserClientPage user={user} />;
}
