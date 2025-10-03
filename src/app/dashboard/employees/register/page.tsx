
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import RegisterEmployeeClientPage from './client-page';
import { User, Site } from '@/lib/types';
import { getSitesByIds } from '@/actions/sites';


export default async function RegisterEmployeePage() {
  const currentUser = await getAdminSession();
  
  if (!currentUser) {
    // If no user session, redirect to login
    redirect('/');
  }

  // Only Admin Proyek can access this page
  if (currentUser.role !== 'Admin Proyek') {
    redirect('/dashboard');
  }

  const assignedSites: Site[] = currentUser.siteIds ? await getSitesByIds(currentUser.siteIds) : [];

  return <RegisterEmployeeClientPage user={currentUser as User} assignedSites={assignedSites} />;
}
