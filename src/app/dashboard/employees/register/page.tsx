import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import RegisterEmployeeClientPage from './client-page';
import { User } from '@/lib/types';


export default async function RegisterEmployeePage() {
  const currentUser = await getAdminSession();
  
  if (!currentUser || currentUser.role !== 'Admin Proyek') {
    // Redirect non-project-admins away
    redirect('/dashboard');
  }

  return <RegisterEmployeeClientPage user={currentUser as User} />;
}
