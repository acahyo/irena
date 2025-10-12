

import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import RegisterEmployeeClientPage from './client-page';
import { User, Candidate } from '@/lib/types';


export default async function RegisterEmployeePage() {
  const currentUser = await getAdminSession();
  
  if (!currentUser) {
    redirect('/');
  }

  if (currentUser.role !== 'Admin Proyek' && currentUser.role !== 'Rekrutmen' && currentUser.role !== 'HR' && currentUser.role !== 'Administrator') {
    redirect('/dashboard');
  }

  return <RegisterEmployeeClientPage user={currentUser as User} />;
}
