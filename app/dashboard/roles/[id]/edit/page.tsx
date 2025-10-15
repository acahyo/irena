import { notFound } from 'next/navigation';
import { getRole } from '@/actions/roles';
import EditRolePageClient from './client-page';


export default async function EditRolePage({ params }: { params: { id: string } }) {
  const role = await getRole(params.id);

  if (!role) {
    notFound();
  }

  return <EditRolePageClient role={role} />;
}
