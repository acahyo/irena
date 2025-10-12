

import { getAdminSession } from '@/actions/auth';
import { redirect, notFound } from 'next/navigation';
import RegisterEmployeeClientPage from './client-page';
import { User, Site, Candidate } from '@/lib/types';
import { getSitesByIds } from '@/actions/sites';
import { getCandidates } from '@/actions/candidates';


export default async function RegisterEmployeePage({ searchParams }: { searchParams?: { candidateId?: string }}) {
  const currentUser = await getAdminSession();
  
  if (!currentUser) {
    // If no user session, redirect to login
    redirect('/');
  }

  // Only Admin Proyek and Rekrutmen can access this page
  if (currentUser.role !== 'Admin Proyek' && currentUser.role !== 'Rekrutmen') {
    redirect('/dashboard');
  }

  const assignedSites: Site[] = currentUser.siteIds ? await getSitesByIds(currentUser.siteIds) : [];

  let candidate: Candidate | undefined = undefined;
  if (searchParams?.candidateId) {
    const candidates = await getCandidates();
    candidate = candidates.find(c => c.id === searchParams.candidateId);
    if (!candidate) {
      notFound();
    }
  }

  return <RegisterEmployeeClientPage user={currentUser as User} assignedSites={assignedSites} candidate={candidate} />;
}
