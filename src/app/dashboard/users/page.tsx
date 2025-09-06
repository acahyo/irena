import { getUsers } from '@/actions/users';
import UsersClientPage from './client-page';


export default async function UsersPage() {
  const initialUsers = await getUsers();

  return <UsersClientPage initialUsers={initialUsers} />;
}
