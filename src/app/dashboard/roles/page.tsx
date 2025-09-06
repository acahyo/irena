import { getRoles } from '@/actions/roles';
import RolesClientPage from './client-page';


export default async function RolesPage() {
  const initialRoles = await getRoles();

  return <RolesClientPage initialRoles={initialRoles} />;
}
