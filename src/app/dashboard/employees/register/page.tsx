import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import RegisterEmployeeClientPage from './client-page';
import { User, Site } from '@/lib/types';
import { getSitesByIds } from '@/actions/sites';


export default async function RegisterEmployeePage() {
  const currentUser = await getAdminSession();
  
  if (!currentUser || currentUser.role !== 'Admin Proyek') {
    // Redirect non-project-admins away
    redirect('/dashboard');
  }

  const assignedSites: Site[] = currentUser.siteIds ? await getSitesByIds(currentUser.siteIds) : [];

  return <RegisterEmployeeClientPage user={currentUser as User} assignedSites={assignedSites} />;
}
